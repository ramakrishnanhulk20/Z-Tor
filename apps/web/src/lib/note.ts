import { keccak256 } from "viem";
import { isValidPoolId } from "@/lib/pools";
import { getPoseidon, poseidonHash } from "@/lib/poseidon";

const NOTE_VERSION = "v1";

/** ztor-v1-<poolId>-<124 hex payload>-<8 hex checksum> */
const NOTE_REGEX = /^ztor-v1-([a-z0-9.-]+?)-([0-9a-f]{124})-([0-9a-f]{8})$/;

export type ParsedNote = {
  poolId: string;
  nullifier: bigint;
  secret: bigint;
  raw: string;
};

function checksumOf(payloadHex: string): string {
  return keccak256(`0x${payloadHex}`).slice(2, 10);
}

/** 31 random bytes — always below the BN254 field modulus. */
function randomFieldElement(): bigint {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  return BigInt(
    `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`,
  );
}

function toPayloadHex(value: bigint): string {
  return value.toString(16).padStart(62, "0");
}

export type GeneratedNote = {
  note: string;
  poolId: string;
  nullifier: bigint;
  secret: bigint;
};

export function generateNote(poolId: string): GeneratedNote {
  const nullifier = randomFieldElement();
  const secret = randomFieldElement();
  const payload = toPayloadHex(nullifier) + toPayloadHex(secret);
  const note = `ztor-${NOTE_VERSION}-${poolId}-${payload}-${checksumOf(payload)}`;
  return { note, poolId, nullifier, secret };
}

export function parseNote(raw: string): ParsedNote | null {
  const trimmed = raw.trim().toLowerCase();
  const match = NOTE_REGEX.exec(trimmed);
  if (!match) return null;

  const [, poolId, payload, checksum] = match;
  if (checksumOf(payload) !== checksum) return null;
  if (!isValidPoolId(poolId)) return null;

  return {
    poolId,
    nullifier: BigInt(`0x${payload.slice(0, 62)}`),
    secret: BigInt(`0x${payload.slice(62)}`),
    raw: trimmed,
  };
}

export function isValidNoteShape(raw: string): boolean {
  return parseNote(raw) !== null;
}

export async function computeCommitment(nullifier: bigint, secret: bigint): Promise<bigint> {
  const poseidon = await getPoseidon();
  return poseidonHash(poseidon, [nullifier, secret]);
}

export async function computeNullifierHash(nullifier: bigint): Promise<bigint> {
  const poseidon = await getPoseidon();
  return poseidonHash(poseidon, [nullifier]);
}

export function formatNotePreview(poolId: string): string {
  return `ztor-${NOTE_VERSION}-${poolId}-<124 hex characters>-<checksum>`;
}
