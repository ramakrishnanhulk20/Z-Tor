// Z-Tor relayer: accepts a withdraw proof bundle and submits the
// transaction itself, so the recipient address never needs gas.
// The proof binds (recipient, relayer, fee) — this service cannot redirect
// funds or change its own fee, it can only refuse to relay.
import http from "node:http";
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  http as httpTransport,
  isAddress,
  isHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const PORT = Number(process.env.PORT ?? 8787);
const FEE_BASIS_POINTS = BigInt(process.env.FEE_BASIS_POINTS ?? 100); // 1%
const REGISTRY = process.env.ZTOR_REGISTRY;
const PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

if (!PRIVATE_KEY || !REGISTRY) {
  console.error("RELAYER_PRIVATE_KEY and ZTOR_REGISTRY must be set (see .env.example)");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const transport = httpTransport(process.env.RPC_URL);
const publicClient = createPublicClient({ chain: sepolia, transport });
const walletClient = createWalletClient({ account, chain: sepolia, transport });

const registryAbi = [
  {
    type: "function",
    name: "allPoolIds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string[]" }],
  },
  {
    type: "function",
    name: "poolFor",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "string" }],
    outputs: [{ type: "address" }],
  },
];

const poolAbi = [
  {
    type: "function",
    name: "denomination",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proof", type: "bytes" },
      { name: "root", type: "bytes32" },
      { name: "nullifierHash", type: "bytes32" },
      { name: "recipient", type: "address" },
      { name: "relayer", type: "address" },
      { name: "fee", type: "uint256" },
    ],
    outputs: [],
  },
];

// Only relay to pools listed in the official registry.
let knownPools = { at: 0, set: new Set() };
async function poolAllowlist() {
  if (Date.now() - knownPools.at < 5 * 60_000) return knownPools.set;
  const ids = await publicClient.readContract({
    address: REGISTRY,
    abi: registryAbi,
    functionName: "allPoolIds",
  });
  const addresses = await Promise.all(
    ids.map((id) =>
      publicClient.readContract({
        address: REGISTRY,
        abi: registryAbi,
        functionName: "poolFor",
        args: [id],
      }),
    ),
  );
  knownPools = { at: Date.now(), set: new Set(addresses.map((a) => a.toLowerCase())) };
  return knownPools.set;
}

export function expectedFee(denomination, feeBasisPoints = FEE_BASIS_POINTS) {
  return (denomination * feeBasisPoints) / 10_000n;
}

function revertName(err) {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) return revert.data?.errorName;
  }
  return undefined;
}

const REVERT_MESSAGES = {
  NoteAlreadySpent: "This note has already been withdrawn.",
  RootTooRecent: "The privacy delay has not passed yet.",
  UnknownRoot: "The pool state is out of sync — retry in a minute.",
  InvalidProof: "The proof did not verify. Regenerate it with this relayer's address and fee.",
};

/** FHE ACL revert when Phase 3b pools pay out cUSDC without allowTransient. */
const BROKEN_PAYOUT_REVERT = "0x9de3392c";

function errorText(err) {
  if (err instanceof BaseError) {
    return [err.shortMessage, err.message, err.details, err.cause?.toString?.()]
      .filter(Boolean)
      .join("\n");
  }
  return String(err);
}

function relayErrorMessage(err) {
  const name = revertName(err);
  if (name && REVERT_MESSAGES[name]) return REVERT_MESSAGES[name];

  const raw = errorText(err);
  if (raw.includes(BROKEN_PAYOUT_REVERT)) {
    return (
      "This note is from an older pool that cannot pay out confidential tokens (Sepolia Phase 3b bug). " +
      "Make a fresh deposit on the current pools, wait the privacy delay, then withdraw with the new note. " +
      "Your current note stays unspent."
    );
  }
  if (name) return `Withdraw reverted: ${name}.`;
  if (raw.includes("reverted")) {
    return (
      "The withdrawal would revert on-chain. If this note is from before the latest pool redeploy, " +
      "deposit again with a fresh note on the current pools."
    );
  }
  return "The withdrawal transaction would fail.";
}

async function handleRelay(body) {
  const { pool, proof, root, nullifierHash, recipient, fee } = body ?? {};
  if (!isAddress(pool ?? "") || !isAddress(recipient ?? "")) {
    return [400, { error: "Invalid pool or recipient address." }];
  }
  if (!isHex(proof ?? "") || !isHex(root ?? "") || !isHex(nullifierHash ?? "")) {
    return [400, { error: "proof, root, and nullifierHash must be hex strings." }];
  }

  const allowed = await poolAllowlist();
  if (!allowed.has(pool.toLowerCase())) {
    return [400, { error: "Unknown pool — not in the Z-Tor registry." }];
  }

  const denomination = await publicClient.readContract({
    address: pool,
    abi: poolAbi,
    functionName: "denomination",
  });
  if (BigInt(fee ?? 0) !== expectedFee(denomination)) {
    return [
      400,
      {
        error: "Fee mismatch.",
        expectedFee: expectedFee(denomination).toString(),
      },
    ];
  }

  const args = [proof, root, nullifierHash, recipient, account.address, BigInt(fee)];
  try {
    const { request } = await publicClient.simulateContract({
      account,
      address: pool,
      abi: poolAbi,
      functionName: "withdraw",
      args,
    });
    const txHash = await walletClient.writeContract(request);
    console.log(`relayed withdraw → ${txHash} (pool ${pool})`);
    return [200, { txHash }];
  } catch (err) {
    const message = relayErrorMessage(err);
    console.error(`relay rejected: ${message}`);
    return [400, { error: message }];
  }
}

function send(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});
    if (req.method === "GET" && req.url === "/info") {
      return send(res, 200, {
        relayer: account.address,
        chainId: sepolia.id,
        feeBasisPoints: Number(FEE_BASIS_POINTS),
      });
    }
    if (req.method === "POST" && req.url === "/relay") {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 100_000) return send(res, 413, { error: "Body too large." });
      }
      const [status, payload] = await handleRelay(JSON.parse(raw));
      return send(res, status, payload);
    }
    return send(res, 404, { error: "Not found." });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Relayer error." });
  }
});

server.listen(PORT, () => {
  console.log(`z-tor relayer listening on :${PORT}`);
  console.log(`relayer address: ${account.address} (fee ${FEE_BASIS_POINTS} bps)`);
});
