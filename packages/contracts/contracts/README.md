# Contracts

## Overview

Unlink layer (commitments + nullifiers + Merkle proofs):

- `MerkleTreeWithHistory.sol` — incremental Poseidon tree, timestamped root history
- `ZTorPool.sol` — abstract fixed-denomination pool (deposit/withdraw, root-age delay)
- `ZTorConfidentialPool.sol` — ERC-7984 confidential pools (Sepolia); two-step deposit (`transferAndCall` → `finalizeDeposit`) verifies the encrypted amount before a note goes live
- `ZTorETHPool.sol` / `ZTorERC20Pool.sol` — plaintext pools (local tests / reference)
- `ZTorRegistry.sol` — pool id → address directory
- `interfaces/IZTorVerifier.sol` — Groth16 verifier slot (snarkjs signature)

FHE layer (kept separate per `docs/ARCHITECTURE.md`):

- `ZTorLiquidityStats.sol` — encrypted per-pool active-note counter

Test-only: `mocks/` (MockVerifier, MockUSDC, MerkleTreeMock, MockConfidentialToken).

The real `Groth16Verifier.sol` is generated from the withdraw circuit
(`circuits/`) and replaces `MockVerifier` in deployments.

Run `node ../../.tools/fhevm-skill/scripts/fhevm-lint.js contracts/` when
touching FHE contracts.
