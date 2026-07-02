// Shared relayer logic — used by the local HTTP server and Next.js API routes on Vercel.
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

const FEE_BASIS_POINTS = BigInt(process.env.FEE_BASIS_POINTS ?? 100);

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
  { type: "error", name: "NoteAlreadySpent", inputs: [] },
  { type: "error", name: "RootTooRecent", inputs: [] },
  { type: "error", name: "UnknownRoot", inputs: [] },
  { type: "error", name: "InvalidProof", inputs: [] },
  { type: "error", name: "FeeExceedsDenomination", inputs: [] },
  { type: "error", name: "FeeWithoutRelayer", inputs: [] },
];

let clients;
let knownPools = { at: 0, set: new Set() };

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function getClients() {
  if (clients) return clients;

  const privateKey = requireEnv("RELAYER_PRIVATE_KEY");
  const registry = requireEnv("ZTOR_REGISTRY");
  const rpcUrl = process.env.RPC_URL ?? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  if (!rpcUrl) throw new Error("RPC_URL or NEXT_PUBLIC_SEPOLIA_RPC_URL is not set");

  const account = privateKeyToAccount(privateKey);
  const transport = httpTransport(rpcUrl);
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const walletClient = createWalletClient({ account, chain: sepolia, transport });

  clients = { account, registry, publicClient, walletClient };
  return clients;
}

export function isRelayerConfigured() {
  try {
    getClients();
    return true;
  } catch {
    return false;
  }
}

async function poolAllowlist() {
  const { registry, publicClient } = getClients();
  if (Date.now() - knownPools.at < 5 * 60_000) return knownPools.set;

  const ids = await publicClient.readContract({
    address: registry,
    abi: registryAbi,
    functionName: "allPoolIds",
  });
  const addresses = await Promise.all(
    ids.map((id) =>
      publicClient.readContract({
        address: registry,
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
  RootTooRecent:
    "The privacy delay has not passed yet. Wait until the countdown on the withdraw page reaches zero, then try again.",
  UnknownRoot: "The pool state is out of sync — refresh the page and retry in a minute.",
  InvalidProof:
    "The zero-knowledge proof did not verify on-chain. Refresh and try again. If it persists, the site proving keys may be out of sync with the deployed Groth16 verifier.",
  FeeExceedsDenomination: "Relayer fee exceeds the pool denomination.",
  FeeWithoutRelayer: "A relayer fee was set but no relayer address was provided.",
};

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
  if (name) return `Withdraw reverted: ${name}.`;
  if (raw.includes("reverted")) {
    return (
      "The withdrawal would revert on-chain. Wait for the full privacy delay, refresh the page, " +
      "and try again. If the note is from an older pool deployment, deposit again for a fresh note."
    );
  }
  return "The withdrawal transaction would fail.";
}

async function submitWithdraw(publicClient, walletClient, account, pool, args) {
  try {
    const { request } = await publicClient.simulateContract({
      account,
      address: pool,
      abi: poolAbi,
      functionName: "withdraw",
      args,
    });
    return walletClient.writeContract(request);
  } catch (simErr) {
    // fhEVM confidential transfers sometimes fail eth_call simulation even when the tx succeeds.
    const simName = revertName(simErr);
    if (simName && REVERT_MESSAGES[simName]) throw simErr;

    try {
      await publicClient.estimateContractGas({
        account,
        address: pool,
        abi: poolAbi,
        functionName: "withdraw",
        args,
      });
    } catch (gasErr) {
      throw gasErr;
    }

    return walletClient.writeContract({
      account,
      address: pool,
      abi: poolAbi,
      functionName: "withdraw",
      args,
    });
  }
}

export function getRelayerInfo() {
  const { account } = getClients();
  return {
    relayer: account.address,
    chainId: sepolia.id,
    feeBasisPoints: Number(FEE_BASIS_POINTS),
  };
}

export async function handleRelay(body) {
  const { pool, proof, root, nullifierHash, recipient, fee } = body ?? {};
  const { account, publicClient, walletClient } = getClients();

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
    const txHash = await submitWithdraw(
      publicClient,
      walletClient,
      account,
      pool,
      args,
    );
    console.log(`relayed withdraw → ${txHash} (pool ${pool})`);
    return [200, { txHash }];
  } catch (err) {
    const message = relayErrorMessage(err);
    console.error(`relay rejected: ${message}`);
    return [400, { error: message }];
  }
}

export const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
