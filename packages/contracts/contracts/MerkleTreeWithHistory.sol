// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";

/// @title Incremental Poseidon Merkle tree with root history
/// @notice Stores commitments as leaves. Recent roots are kept in a ring
/// buffer and timestamped, so pools can require a root to be older than the
/// anonymity delay without learning which deposit a withdrawal spends.
contract MerkleTreeWithHistory {
    /// @dev BN254 scalar field — all leaves and hashes live in this field.
    uint256 public constant FIELD_SIZE =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint32 public constant ROOT_HISTORY_SIZE = 100;

    uint32 public immutable levels;

    /// @dev Filled left-subtree hash per level (incremental insertion state).
    mapping(uint256 => bytes32) public filledSubtrees;
    /// @dev Zero-subtree hash per level, derived from ZERO_VALUE.
    mapping(uint256 => bytes32) public zeros;
    /// @dev Ring buffer of recent roots.
    mapping(uint256 => bytes32) public roots;
    /// @dev First time each root was observed; never overwritten.
    mapping(bytes32 => uint256) public rootTimestamps;

    uint32 public currentRootIndex;
    uint32 public nextIndex;

    error LevelsOutOfRange();
    error MerkleTreeFull();

    constructor(uint32 _levels) {
        if (_levels == 0 || _levels > 31) revert LevelsOutOfRange();
        levels = _levels;

        // Unspendable placeholder leaf: keccak256("z-tor") reduced to the field.
        bytes32 currentZero = bytes32(uint256(keccak256("z-tor")) % FIELD_SIZE);
        for (uint32 i = 0; i < _levels; i++) {
            zeros[i] = currentZero;
            filledSubtrees[i] = currentZero;
            currentZero = hashLeftRight(currentZero, currentZero);
        }
        roots[0] = currentZero;
        // solhint-disable-next-line not-rely-on-time
        rootTimestamps[currentZero] = block.timestamp;
    }

    function hashLeftRight(bytes32 left, bytes32 right) public pure returns (bytes32) {
        return bytes32(PoseidonT3.hash([uint256(left), uint256(right)]));
    }

    function getLastRoot() public view returns (bytes32) {
        return roots[currentRootIndex];
    }

    /// @notice Whether `root` is one of the last ROOT_HISTORY_SIZE roots.
    function isKnownRoot(bytes32 root) public view returns (bool) {
        if (root == bytes32(0)) return false;
        uint32 i = currentRootIndex;
        do {
            if (root == roots[i]) return true;
            if (i == 0) i = ROOT_HISTORY_SIZE;
            i--;
        } while (i != currentRootIndex);
        return false;
    }

    function _insert(bytes32 leaf) internal returns (uint32 index) {
        uint32 insertIndex = nextIndex;
        if (insertIndex == uint32(2) ** levels) revert MerkleTreeFull();

        uint32 currentIndex = insertIndex;
        bytes32 currentLevelHash = leaf;

        for (uint32 i = 0; i < levels; i++) {
            if (currentIndex % 2 == 0) {
                filledSubtrees[i] = currentLevelHash;
                currentLevelHash = hashLeftRight(currentLevelHash, zeros[i]);
            } else {
                currentLevelHash = hashLeftRight(filledSubtrees[i], currentLevelHash);
            }
            currentIndex /= 2;
        }

        uint32 newRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        currentRootIndex = newRootIndex;
        roots[newRootIndex] = currentLevelHash;
        // solhint-disable-next-line not-rely-on-time
        rootTimestamps[currentLevelHash] = block.timestamp;
        nextIndex = insertIndex + 1;
        return insertIndex;
    }
}
