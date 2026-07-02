import crypto from "node:crypto";
import fs from "node:fs";
import { buildPoseidon } from "circomlibjs";
import {
  createPublicClient,
  decodeAbiParameters,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  http,
  keccak256,
  stringToBytes,
} from "viem";
import { sepolia } from "viem/chains";

const snarkjs = await import("snarkjs");
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webZk = join(here, "../../../apps/web/public/zk");
const WASM = join(webZk, "withdraw.wasm");
const ZKEY = join(webZk, "withdraw_final.zkey");
const VK = JSON.parse(fs.readFileSync(join(webZk, "verification_key.json"), "utf8"));

const FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const ZERO_VALUE = BigInt(keccak256(stringToBytes("z-tor"))) % FIELD;
const LEVELS = 20;

function poseidonHash(poseidon, inputs) {
  return poseidon.F.toObject(poseidon(inputs));
}

function randField() {
  return BigInt(`0x${crypto.randomBytes(31).toString("hex")}`);
}

class MerkleTree {
  constructor(levels, poseidon) {
    this.levels = levels;
    this.poseidon = poseidon;
    this.zeros = [];
    this.layers = Array.from({ length: levels + 1 }, () => []);
    let zero = ZERO_VALUE;
    for (let i = 0; i < levels; i++) {
      this.zeros.push(zero);
      zero = poseidonHash(poseidon, [zero, zero]);
    }
    this.zeros.push(zero);
  }

  insert(leaf) {
    const index = this.layers[0].length;
    this.layers[0].push(leaf);
    let current = leaf;
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const isLeft = currentIndex % 2 === 0;
      const sibling = isLeft
        ? (this.layers[level][currentIndex + 1] ?? this.zeros[level])
        : this.layers[level][currentIndex - 1];
      current = isLeft
        ? poseidonHash(this.poseidon, [current, sibling])
        : poseidonHash(this.poseidon, [sibling, current]);
      currentIndex = Math.floor(currentIndex / 2);
      this.layers[level + 1][currentIndex] = current;
    }
    return index;
  }

  root() {
    return this.layers[this.levels][0] ?? this.zeros[this.levels];
  }

  path(index) {
    const pathElements = [];
    const pathIndices = [];
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const isLeft = currentIndex % 2 === 0;
      const sibling = isLeft
        ? (this.layers[level][currentIndex + 1] ?? this.zeros[level])
        : this.layers[level][currentIndex - 1];
      pathElements.push(sibling);
      pathIndices.push(isLeft ? 0 : 1);
      currentIndex = Math.floor(currentIndex / 2);
    }
    return { pathElements, pathIndices };
  }
}

const verifierAbi = [
  {
    type: "function",
    name: "verifyProof",
    inputs: [
      { name: "_pA", type: "uint256[2]" },
      { name: "_pB", type: "uint256[2][2]" },
      { name: "_pC", type: "uint256[2]" },
      { name: "_pubSignals", type: "uint256[5]" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
];

const poseidon = await buildPoseidon();
const tree = new MerkleTree(LEVELS, poseidon);
const nullifier = randField();
const secret = randField();
const nullifierHash = poseidonHash(poseidon, [nullifier]);
tree.insert(poseidonHash(poseidon, [nullifier, secret]));
const path = tree.path(0);
const root = tree.root();
const recipient = "0x000000000000000000000000000000000000dEaD";
const relayer = "0xd57D8F8A615F35133D8121e58F4ed778A4F612E9";
const fee = 1_000_000n;

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  {
    root: root.toString(),
    nullifierHash: nullifierHash.toString(),
    recipient: BigInt(recipient).toString(),
    relayer: BigInt(relayer).toString(),
    fee: fee.toString(),
    nullifier: nullifier.toString(),
    secret: secret.toString(),
    pathElements: path.pathElements.map((x) => x.toString()),
    pathIndices: path.pathIndices,
  },
  WASM,
  ZKEY,
);

console.log("local vk verify", await snarkjs.groth16.verify(VK, publicSignals, proof));

const pub = publicSignals.map((x) => BigInt(x));

const encodings = {
  swapped: encodeAbiParameters(
    [{ type: "uint256[2]" }, { type: "uint256[2][2]" }, { type: "uint256[2]" }],
    [
      [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
      [
        [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
        [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
      ],
      [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
    ],
  ),
  unswapped: encodeAbiParameters(
    [{ type: "uint256[2]" }, { type: "uint256[2][2]" }, { type: "uint256[2]" }],
    [
      [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
      [
        [BigInt(proof.pi_b[0][0]), BigInt(proof.pi_b[0][1])],
        [BigInt(proof.pi_b[1][0]), BigInt(proof.pi_b[1][1])],
      ],
      [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
    ],
  ),
};

const verifier = "0x04F2ADA900BeCDe03E5306d652049344a6fAdfb5";

async function check(label, a, b, c, signals, rpc) {
  const client = createPublicClient({ chain: sepolia, transport: http(rpc) });
  const data = encodeFunctionData({
    abi: verifierAbi,
    functionName: "verifyProof",
    args: [a, b, c, signals],
  });
  const raw = await client.call({ to: verifier, data });
  const ok = decodeFunctionResult({
    abi: verifierAbi,
    functionName: "verifyProof",
    data: raw.data,
  });
  console.log(label, rpc.split("/")[2].slice(0, 20), ok, raw.data);
}

const rpcs = [
  "https://sepolia.gateway.tenderly.co",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://1rpc.io/sepolia",
];

const [a, b, c] = decodeAbiParameters(
  [{ type: "uint256[2]" }, { type: "uint256[2][2]" }, { type: "uint256[2]" }],
  encodings.swapped,
);

for (const rpc of rpcs) {
  await check("swapped", a, b, c, pub, rpc);
}
