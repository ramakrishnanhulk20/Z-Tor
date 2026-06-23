// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleTreeWithHistory} from "../MerkleTreeWithHistory.sol";

/// @notice Test-only harness exposing _insert.
contract MerkleTreeMock is MerkleTreeWithHistory {
    constructor(uint32 _levels) MerkleTreeWithHistory(_levels) {}

    function insert(bytes32 leaf) external returns (uint32) {
        return _insert(leaf);
    }
}
