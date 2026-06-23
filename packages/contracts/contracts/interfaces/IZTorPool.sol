// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ZTorPool interface
/// @notice Fixed-denomination deposit/withdraw with note-backed unlink proofs.
interface IZTorPool {
    event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
    event Withdrawal(
        address indexed recipient,
        bytes32 nullifierHash,
        address relayer,
        uint256 fee
    );

    function denomination() external view returns (uint256);

    function deposit(bytes32 commitment) external payable;

    /// @param relayer Address paid `fee` out of the denomination; zero when
    /// the recipient submits the transaction themselves.
    function withdraw(
        bytes calldata proof,
        bytes32 root,
        bytes32 nullifierHash,
        address payable recipient,
        address payable relayer,
        uint256 fee
    ) external;
}
