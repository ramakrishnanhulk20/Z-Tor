// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Groth16 withdraw-proof verifier (snarkjs-compatible signature)
/// @notice Public signals order: [merkleRoot, nullifierHash, recipient, relayer, fee].
interface IZTorVerifier {
    function verifyProof(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[5] calldata pubSignals
    ) external view returns (bool);
}
