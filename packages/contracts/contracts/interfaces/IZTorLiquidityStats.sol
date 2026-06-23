// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Encrypted pool statistics hook (FHE layer)
/// @notice Pools report plaintext-free lifecycle events; the implementation
/// keeps encrypted aggregates. Kept behind an interface so the unlink layer
/// stays independent of the FHE layer.
interface IZTorLiquidityStats {
    function recordDeposit() external;

    function recordWithdraw() external;
}
