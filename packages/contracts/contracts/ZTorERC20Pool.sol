// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ZTorPool} from "./ZTorPool.sol";
import {IZTorLiquidityStats} from "./interfaces/IZTorLiquidityStats.sol";
import {IZTorVerifier} from "./interfaces/IZTorVerifier.sol";

/// @title ERC20 privacy pool (Sepolia USDC in v1)
contract ZTorERC20Pool is ZTorPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    error EthNotAccepted();
    error ZeroToken();

    constructor(
        IZTorVerifier _verifier,
        IZTorLiquidityStats _stats,
        IERC20 _token,
        uint256 _denomination,
        uint256 _anonymityDelay,
        uint32 _levels
    ) ZTorPool(_verifier, _stats, _denomination, _anonymityDelay, _levels) {
        if (address(_token) == address(0)) revert ZeroToken();
        token = _token;
    }

    function _processDeposit() internal override {
        if (msg.value != 0) revert EthNotAccepted();
        token.safeTransferFrom(msg.sender, address(this), denomination);
    }

    function _processWithdraw(
        address payable recipient,
        address payable relayer,
        uint256 fee
    ) internal override {
        token.safeTransfer(recipient, denomination - fee);
        if (fee > 0) {
            token.safeTransfer(relayer, fee);
        }
    }
}
