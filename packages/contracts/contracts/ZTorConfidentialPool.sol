// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";
import {ZTorPool} from "./ZTorPool.sol";
import {IZTorLiquidityStats} from "./interfaces/IZTorLiquidityStats.sol";
import {IZTorVerifier} from "./interfaces/IZTorVerifier.sol";

/// @title Fixed-denomination pool backed by ERC-7984 confidential tokens
contract ZTorConfidentialPool is ZTorPool, ZamaEthereumConfig, IERC7984Receiver {
    IERC7984 public immutable confidentialToken;

    struct PendingDeposit {
        bool exists;
        bytes32 acceptedHandle;
    }

    /// @dev Commitments whose tokens arrived but whose amount is not yet confirmed.
    mapping(bytes32 => PendingDeposit) public pendingDeposits;

    event DepositPending(bytes32 indexed commitment, bytes32 acceptedHandle);
    event DepositRejected(bytes32 indexed commitment);

    error EthNotAccepted();
    error UseConfidentialDeposit();
    error ZeroToken();
    error InvalidCommitmentPayload();
    error CommitmentAlreadyPending();
    error NoPendingDeposit();

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

    /// @notice ERC-7984 transfer callback used as the deposit entrypoint. Records the
    /// commitment as pending and publishes an encrypted `amount == denomination` check;
    /// the returned bool also drives the token's refund when the amount is wrong. Only
    /// the confidential token may call it, so the `amount` handle cannot be spoofed.
    function onConfidentialTransferReceived(
        address,
        address,
        euint64 amount,
        bytes calldata data
    ) external returns (ebool) {
        if (msg.sender != address(confidentialToken)) revert ZeroToken();
        if (data.length != 32) revert InvalidCommitmentPayload();
        bytes32 commitment = abi.decode(data, (bytes32));
        if (commitments[commitment]) revert CommitmentAlreadyUsed();
        if (pendingDeposits[commitment].exists) revert CommitmentAlreadyPending();
        if (uint256(commitment) >= FIELD_SIZE) revert CommitmentNotInField();

        ebool accepted = FHE.eq(amount, FHE.asEuint64(uint64(denomination)));
        FHE.allowThis(accepted);
        FHE.makePubliclyDecryptable(accepted);
        FHE.allowTransient(accepted, msg.sender);

        bytes32 handle = FHE.toBytes32(accepted);
        pendingDeposits[commitment] = PendingDeposit({exists: true, acceptedHandle: handle});
        emit DepositPending(commitment, handle);

        return accepted;
    }

    /// @notice Finalize a pending deposit from the verified public decryption of its
    /// amount check. The commitment becomes a spendable note only if the amount matched.
    /// Permissionless: KMS signatures are verified on-chain so the result cannot be forged.
    function finalizeDeposit(
        bytes32 commitment,
        bytes calldata abiEncodedAccepted,
        bytes calldata decryptionProof
    ) external nonReentrant {
        PendingDeposit memory pending = pendingDeposits[commitment];
        if (!pending.exists) revert NoPendingDeposit();

        bytes32[] memory handles = new bytes32[](1);
        handles[0] = pending.acceptedHandle;
        FHE.checkSignatures(handles, abiEncodedAccepted, decryptionProof);
        bool accepted = abi.decode(abiEncodedAccepted, (bool));

        delete pendingDeposits[commitment];

        if (accepted) {
            _registerDeposit(commitment);
        } else {
            emit DepositRejected(commitment);
        }
    }

    /// @dev Unused; confidential deposits enter through the ERC-7984 callback.
    // solhint-disable-next-line no-empty-blocks
    function _processDeposit() internal override {}

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
