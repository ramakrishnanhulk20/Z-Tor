// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";
import {ZTorPool} from "./ZTorPool.sol";
import {IZTorLiquidityStats} from "./interfaces/IZTorLiquidityStats.sol";
import {IZTorVerifier} from "./interfaces/IZTorVerifier.sol";

/// @title Fixed-denomination pool backed by ERC-7984 confidential tokens
/// @notice Deposits pull encrypted tokens from the user; withdrawals pay out
/// confidential tokens so pool balances stay encrypted on-chain.
contract ZTorConfidentialPool is ZTorPool, ZamaEthereumConfig, IERC7984Receiver {
    IERC7984 public immutable confidentialToken;

    error EthNotAccepted();
    error UseConfidentialDeposit();
    error ZeroToken();
    error InvalidCommitmentPayload();

    constructor(
        IZTorVerifier _verifier,
        IZTorLiquidityStats _stats,
        IERC7984 _token,
        uint256 _denomination,
        uint256 _anonymityDelay,
        uint32 _levels
    ) ZTorPool(_verifier, _stats, _denomination, _anonymityDelay, _levels) {
        if (address(_token) == address(0)) revert ZeroToken();
        confidentialToken = _token;
    }

    /// @inheritdoc ZTorPool
    function deposit(bytes32) external payable override {
        if (msg.value != 0) revert EthNotAccepted();
        revert UseConfidentialDeposit();
    }

    /// @notice Preferred deposit path: user calls confidentialTransferAndCall on the
    /// confidential token with data = abi.encode(commitment). The token invokes
    /// onConfidentialTransferReceived so encryption binds to the user wallet
    /// (msg.sender on the token), matching the Zama SDK transfer flow.
    function onConfidentialTransferReceived(
        address /*operator*/,
        address /*from*/,
        euint64 /*amount*/,
        bytes calldata data
    ) external returns (ebool) {
        FHE.cleanTransientStorage();
        if (msg.sender != address(confidentialToken)) revert ZeroToken();
        if (data.length != 32) revert InvalidCommitmentPayload();
        bytes32 commitment = abi.decode(data, (bytes32));
        _registerDeposit(commitment);
        ebool accepted = FHE.asEbool(true);
        FHE.allowTransient(accepted, msg.sender);
        return accepted;
    }

    /// @notice Legacy pull-deposit: pool calls confidentialTransferFrom as operator.
    /// Prefer onConfidentialTransferReceived via confidentialTransferAndCall.
    function deposit(
        bytes32 commitment,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external nonReentrant {
        confidentialToken.confidentialTransferFrom(
            msg.sender,
            address(this),
            encryptedAmount,
            inputProof
        );
        _registerDeposit(commitment);
    }

    function _processDeposit() internal override {}

    /// @dev ABI alias so the web app can read the confidential token address.
    function token() external view returns (address) {
        return address(confidentialToken);
    }

    function _processWithdraw(
        address payable recipient,
        address payable relayer,
        uint256 fee
    ) internal override {
        uint64 net = uint64(denomination - fee);
        if (net > 0) {
            euint64 payout = FHE.asEuint64(net);
            FHE.allowTransient(payout, address(confidentialToken));
            confidentialToken.confidentialTransfer(recipient, payout);
        }
        if (fee > 0) {
            euint64 relayerFee = FHE.asEuint64(uint64(fee));
            FHE.allowTransient(relayerFee, address(confidentialToken));
            confidentialToken.confidentialTransfer(relayer, relayerFee);
        }
    }
}
