// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ZTorPool} from "./ZTorPool.sol";
import {IZTorLiquidityStats} from "./interfaces/IZTorLiquidityStats.sol";
import {IZTorVerifier} from "./interfaces/IZTorVerifier.sol";

/// @title Native ETH privacy pool
contract ZTorETHPool is ZTorPool {
    error WrongDepositValue();
    error EthTransferFailed();

    constructor(
        IZTorVerifier _verifier,
        IZTorLiquidityStats _stats,
        uint256 _denomination,
        uint256 _anonymityDelay,
        uint32 _levels
    ) ZTorPool(_verifier, _stats, _denomination, _anonymityDelay, _levels) {}

    function _processDeposit() internal override {
        if (msg.value != denomination) revert WrongDepositValue();
    }

    function _processWithdraw(
        address payable recipient,
        address payable relayer,
        uint256 fee
    ) internal override {
        // solhint-disable-next-line avoid-low-level-calls
        (bool ok, ) = recipient.call{value: denomination - fee}("");
        if (!ok) revert EthTransferFailed();
        if (fee > 0) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool feeOk, ) = relayer.call{value: fee}("");
            if (!feeOk) revert EthTransferFailed();
        }
    }
}
