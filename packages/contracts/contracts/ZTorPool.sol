// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleTreeWithHistory} from "./MerkleTreeWithHistory.sol";
import {IZTorLiquidityStats} from "./interfaces/IZTorLiquidityStats.sol";
import {IZTorPool} from "./interfaces/IZTorPool.sol";
import {IZTorVerifier} from "./interfaces/IZTorVerifier.sol";

/// @title Fixed-denomination privacy pool (unlink layer)
/// @notice Deposits insert a commitment into the Merkle tree; withdrawals
/// spend a nullifier backed by a Groth16 membership proof. The anonymity
/// delay is enforced on the *root* age, never on an individual deposit, so
/// the contract never learns which note is being spent.
abstract contract ZTorPool is IZTorPool, MerkleTreeWithHistory, ReentrancyGuard {
    IZTorVerifier public immutable verifier;
    IZTorLiquidityStats public immutable stats;
    uint256 public immutable override denomination;
    uint256 public immutable anonymityDelay;

    mapping(bytes32 => bool) public nullifierHashes;
    mapping(bytes32 => bool) public commitments;

    error ZeroDenomination();
    error CommitmentAlreadyUsed();
    error CommitmentNotInField();
    error NoteAlreadySpent();
    error UnknownRoot();
    error RootTooRecent();
    error InvalidProof();
    error FeeExceedsDenomination();
    error FeeWithoutRelayer();

    constructor(
        IZTorVerifier _verifier,
        IZTorLiquidityStats _stats,
        uint256 _denomination,
        uint256 _anonymityDelay,
        uint32 _levels
    ) MerkleTreeWithHistory(_levels) {
        if (_denomination == 0) revert ZeroDenomination();
        verifier = _verifier;
        stats = _stats;
        denomination = _denomination;
        anonymityDelay = _anonymityDelay;
    }

    /// @notice Deposit exactly `denomination`, registering `commitment`.
    /// @param commitment Poseidon(nullifier, secret), computed client-side.
    function deposit(bytes32 commitment) external payable virtual nonReentrant {
        _processDeposit();
        _registerDeposit(commitment);
    }

    /// @dev Shared commitment registration for legacy and confidential deposits.
    function _registerDeposit(bytes32 commitment) internal {
        if (commitments[commitment]) revert CommitmentAlreadyUsed();
        if (uint256(commitment) >= FIELD_SIZE) revert CommitmentNotInField();

        commitments[commitment] = true;
        uint32 leafIndex = _insert(commitment);

        if (address(stats) != address(0)) stats.recordDeposit();

        // solhint-disable-next-line not-rely-on-time
        emit Deposit(commitment, leafIndex, block.timestamp);
    }

    /// @notice Withdraw `denomination` to `recipient` by proving membership.
    /// @param proof abi.encode(uint256[2] a, uint256[2][2] b, uint256[2] c).
    /// @param root A historical Merkle root at least `anonymityDelay` old.
    /// @param nullifierHash Poseidon(nullifier); spent exactly once.
    /// @param relayer Paid `fee` out of the denomination so the recipient
    /// address never needs gas. Both values are bound inside the proof, so a
    /// relayer cannot raise its fee or redirect the payout.
    function withdraw(
        bytes calldata proof,
        bytes32 root,
        bytes32 nullifierHash,
        address payable recipient,
        address payable relayer,
        uint256 fee
    ) external override nonReentrant {
        if (nullifierHashes[nullifierHash]) revert NoteAlreadySpent();
        if (!isKnownRoot(root)) revert UnknownRoot();
        if (fee > denomination) revert FeeExceedsDenomination();
        if (fee > 0 && relayer == address(0)) revert FeeWithoutRelayer();
        // solhint-disable-next-line not-rely-on-time
        if (block.timestamp < rootTimestamps[root] + anonymityDelay) revert RootTooRecent();

        (uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c) = abi.decode(
            proof,
            (uint256[2], uint256[2][2], uint256[2])
        );
        uint256[5] memory pubSignals = [
            uint256(root),
            uint256(nullifierHash),
            uint256(uint160(address(recipient))),
            uint256(uint160(address(relayer))),
            fee
        ];
        if (!verifier.verifyProof(a, b, c, pubSignals)) revert InvalidProof();

        nullifierHashes[nullifierHash] = true;
        _processWithdraw(recipient, relayer, fee);

        if (address(stats) != address(0)) stats.recordWithdraw();

        emit Withdrawal(recipient, nullifierHash, relayer, fee);
    }

    function _processDeposit() internal virtual;

    function _processWithdraw(
        address payable recipient,
        address payable relayer,
        uint256 fee
    ) internal virtual;
}
