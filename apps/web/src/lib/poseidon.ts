import type { PoseidonFn } from "circomlibjs";
import { keccak256, stringToBytes } from "viem";

export const FIELD_SIZE =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/** Must match MerkleTreeWithHistory.sol: keccak256("z-tor") % FIELD_SIZE. */
export const ZERO_VALUE = BigInt(keccak256(stringToBytes("z-tor"))) % FIELD_SIZE;

let poseidonPromise: Promise<PoseidonFn> | undefined;

export async function getPoseidon(): Promise<PoseidonFn> {
  if (!poseidonPromise) {
    poseidonPromise = import("circomlibjs").then((m) => m.buildPoseidon());
  }
  return poseidonPromise;
}

export function poseidonHash(poseidon: PoseidonFn, inputs: bigint[]): bigint {
  return poseidon.F.toObject(poseidon(inputs));
}

export type MerklePath = {
  pathElements: bigint[];
  pathIndices: number[];
};

/** Mirror of the on-chain incremental Merkle tree, built from Deposit events. */
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

  indexOf(leaf: bigint): number {
    return this.layers[0].indexOf(leaf);
  }

  path(index: number): MerklePath {
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

export function toBytes32(value: bigint): `0x${string}` {
  return `0x${value.toString(16).padStart(64, "0")}` as `0x${string}`;
}
