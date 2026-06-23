// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IZTorVerifier} from "../interfaces/IZTorVerifier.sol";

/// @notice Test-only verifier with a settable result. Replaced by the
/// snarkjs-generated Groth16Verifier for real deployments.
contract MockVerifier is IZTorVerifier {
    bool public result = true;

    function setResult(bool value) external {
        result = value;
    }

    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[5] calldata
    ) external view override returns (bool) {
        return result;
    }
}
