# Z-Tor — Security review checklist

Status as of Phase 2 on Sepolia. Re-run this checklist before any new
deployment and before any mainnet conversation (Phase 3).

## Contracts — unlink layer

- [x] Withdraw requires a valid Groth16 proof bound to (root, nullifierHash, recipient)
- [x] Nullifier hash marked spent before funds move (`ZTorPool.withdraw`)
- [x] Double-spend rejected (covered by Hardhat tests)
- [x] Reentrancy guard on `deposit` and `withdraw`
- [x] Commitment uniqueness enforced; commitment checked against field size
- [x] Anonymity delay enforced on **root age**, never on an individual deposit
- [x] Recipient is a public input of the ZK proof (front-running a withdrawal
      tx cannot redirect funds)
- [ ] Trusted setup: Phase 1 used a dev ceremony — acceptable for testnet,
      **must** be replaced by a proper multi-party ceremony before mainnet
- [ ] Independent audit of `MerkleTreeWithHistory` + circuit (mainnet gate)

## Contracts — FHE layer

- [x] No `FHE.decrypt` on-chain; no branching on encrypted values
- [x] ACL re-granted after every `FHE.add`/`FHE.sub` (`ZTorLiquidityStats`)
- [x] No encrypted values emitted in events
- [x] Decryption rights scoped to stats owner, aggregates only — no per-user data
- [x] `fhevm-lint` clean on all FHE contracts
- [ ] Review owner key custody for the stats contract (currently the deployer)

## Web app

- [x] Note generation uses `crypto.getRandomValues` (31 bytes, below BN254 modulus)
- [x] Notes, secrets, and proofs never leave the browser; no server, no telemetry
- [x] No secrets in client code or `NEXT_PUBLIC_*` vars (registry address only)
- [x] Note checksum catches copy/paste corruption before any transaction
- [x] Disclosure reports include the note preimage **only for spent notes**
- [ ] Pin proving-asset integrity (hash check on the downloaded wasm/zkey)

## Operational

- [x] Deployer key treated as compromised (documented in `DEPLOYMENTS.md`);
      Sepolia only, never to hold real funds
- [x] `.env` / mnemonics gitignored
- [ ] Etherscan verification of deployed contracts (pending API key)
- [ ] Monitoring / incident response plan (Phase 3)

## Known accepted risks (testnet)

- Dev trusted setup for the Groth16 circuit
- Anonymity sets are small while usage is low — the UI should keep
  communicating that privacy grows with pool usage
- Stats owner can decrypt aggregate liquidity counters (by design, documented)
