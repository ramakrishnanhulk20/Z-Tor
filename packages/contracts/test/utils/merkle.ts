import { buildPoseidon, type PoseidonFn } from "circomlibjs";
import { ethers } from "ethers";

export const FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export const ZERO_VALUE = BigInt(ethers.keccak256(ethers.toUtf8Bytes("z-tor"))) % FIELD_SIZE;

let poseidonSingleton: PoseidonFn | undefined;

export async function getPoseidon(): Promise<PoseidonFn> {
  if (!poseidonSingleton) poseidonSingleton = await buildPoseidon();
  return poseidonSingleton;
}

export function poseidonHash(poseidon: PoseidonFn, inputs: bigint[]): bigint {
  return poseidon.F.toObject(poseidon(inputs));
}

/** Random element of the BN254 scalar field (31 bytes keeps it in range). */
export function randomFieldElement(): bigint {
  return BigInt(ethers.hexlify(ethers.randomBytes(31)));
}

export type NoteData = {
  nullifier: bigint;
  secret: bigint;
  commitment: bigint;
  nullifierHash: bigint;
};

export async function createNoteData(): Promise<NoteData> {
  const poseidon = await getPoseidon();
  const nullifier = randomFieldElement();
  const secret = randomFieldElement();
  return {
    nullifier,
    secret,
    commitment: poseidonHash(poseidon, [nullifier, secret]),
    nullifierHash: poseidonHash(poseidon, [nullifier]),
  };
}

export function toBytes32(value: bigint): string {
  return ethers.zeroPadValue(ethers.toBeHex(value), 32);
}

/** Reference incremental Merkle tree mirroring MerkleTreeWithHistory.sol. */
export class MerkleTree {
  private readonly levels: number;
  private readonly poseidon: PoseidonFn;
  private readonly zeros: bigint[] = [];
  private readonly layers: bigint[][];

  constructor(levels: number, poseidon: PoseidonFn) {
    this.levels = levels;
    this.poseidon = poseidon;
    this.layers = Array.from({ length: levels + 1 }, () => []);

    let zero = ZERO_VALUE;
    for (let i = 0; i < levels; i++) {
      this.zeros.push(zero);
      zero = poseidonHash(poseidon, [zero, zero]);
    }
    this.zeros.push(zero);
  }

  insert(leaf: bigint): number {
    const index = this.layers[0].length;
    this.layers[0].push(leaf);
    let current = leaf;
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const isLeft = currentIndex % 2 === 0;
      const sibling = isLeft
        ? this.layers[level][currentIndex + 1] ?? this.zeros[level]
        : this.layers[level][currentIndex - 1];
      current = isLeft
        ? poseidonHash(this.poseidon, [current, sibling])
        : poseidonHash(this.poseidon, [sibling, current]);
      currentIndex = Math.floor(currentIndex / 2);
      this.layers[level + 1][currentIndex] = current;
    }
    return index;
  }

  root(): bigint {
    return this.layers[this.levels][0] ?? this.zeros[this.levels];
  }

  /** Sibling path for the leaf at `index` (for the withdraw circuit). */
  path(index: number): { pathElements: bigint[]; pathIndices: number[] } {
    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const isLeft = currentIndex % 2 === 0;
      const sibling = isLeft
        ? this.layers[level][currentIndex + 1] ?? this.zeros[level]
        : this.layers[level][currentIndex - 1];
      pathElements.push(sibling);
      pathIndices.push(isLeft ? 0 : 1);
      currentIndex = Math.floor(currentIndex / 2);
    }
    return { pathElements, pathIndices };
  }
}

/** abi-encoded dummy Groth16 proof for MockVerifier-based tests. */
export function dummyProof(): string {
  const coder = ethers.AbiCoder.defaultAbiCoder();
  return coder.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]"],
    [
      [0n, 0n],
      [
        [0n, 0n],
        [0n, 0n],
      ],
      [0n, 0n],
    ],
  );
}
