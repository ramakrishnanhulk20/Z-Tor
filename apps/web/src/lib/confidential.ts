import { NoCiphertextError } from "@zama-fhe/react-sdk";
import type { ZamaSDK } from "@zama-fhe/react-sdk";
import type { PublicClient, WalletClient } from "viem";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import {
  confidentialTransferAndCallAbi,
  confidentialWrapperAbi,
  mintableErc20Abi,
  poolAbi,
} from "@/config/contracts";
import { CONFIDENTIAL_SYMBOL } from "@/config/display";
import type { PoolAsset } from "@/config/pools";
import { confidentialWrapper, underlyingToken } from "@/config/zama";
import { isEncryptedHandle } from "@/lib/decrypt-balance";
import { buildEncryptedTransferArgs } from "@/lib/encrypt";
import { toBytes32 } from "@/lib/poseidon";
import type { TxTracker } from "@/lib/track-tx";
import { FHE_GAS_CAP, STANDARD_GAS_CAP, writeWalletContract } from "@/lib/wallet-write";

/** Zama SDK expects the ERC-7984 wrapper address (cUSDC / cWETH), not the underlying ERC-20. */
function confidentialToken(sdk: ZamaSDK, asset: PoolAsset) {
  return sdk.createToken(confidentialWrapper(asset));
}

export async function ensureUnderlyingBalance(
  publicClient: PublicClient,
  walletClient: WalletClient,
  asset: PoolAsset,
  userAddress: `0x${string}`,
  underlyingAmount: bigint,
  tracker?: TxTracker,
) {
  const underlying = underlyingToken(asset);
  const balance = await publicClient.readContract({
    address: underlying,
    abi: mintableErc20Abi,
    functionName: "balanceOf",
    args: [userAddress],
  });
  if (balance >= underlyingAmount) return;

  const mintAmount = underlyingAmount - balance;
  const plain = asset === "ETH" ? "WETH" : "USDC";

  const mint = () =>
    writeWalletContract({
      walletClient,
      publicClient,
      account: userAddress,
      address: underlying,
      abi: mintableErc20Abi,
      functionName: "mint",
      args: [userAddress, mintAmount],
      gasCap: STANDARD_GAS_CAP,
    });

  if (tracker) {
    await tracker.run(
      {
        pendingTitle: `Minting test ${plain}`,
        pendingDetail: "Zama test tokens, free on Ethereum.",
        successTitle: `${plain} minted`,
        successDetail: "Ready to shield into confidential form.",
        errorTitle: "Mint failed",
      },
      mint,
    );
    return;
  }

  const hash = await mint();
  await publicClient.waitForTransactionReceipt({ hash });
}

export async function wrapToConfidential(
  sdk: ZamaSDK,
  asset: PoolAsset,
  underlyingAmount: bigint,
  tracker?: TxTracker,
) {
  const token = confidentialToken(sdk, asset);
  const symbol = CONFIDENTIAL_SYMBOL[asset];

  const shield = async () => {
    const { txHash } = await token.shield(underlyingAmount);
    return txHash;
  };

  if (tracker) {
    await tracker.run(
      {
        pendingTitle: `Shielding to ${symbol}`,
        pendingDetail: "Encrypting your balance on-chain.",
        successTitle: `${symbol} shielded`,
        successDetail: "Your confidential balance is ready.",
        errorTitle: "Shield failed",
      },
      shield,
    );
    return;
  }

  await shield();
}

/** Mint/shield until the wallet holds at least `confidentialAmount` cUSDC/cWETH. */
export type BalancePrepStep = "checking" | "minting" | "shielding" | "ready";

export type BalancePrepResult = {
  alreadyHadBalance: boolean;
  minted: boolean;
  shielded: boolean;
};

export async function ensureConfidentialBalance(
  sdk: ZamaSDK,
  publicClient: PublicClient,
  walletClient: WalletClient,
  asset: PoolAsset,
  userAddress: `0x${string}`,
  underlyingAmount: bigint,
  confidentialAmount: bigint,
  tracker?: TxTracker,
  onStep?: (step: BalancePrepStep) => void,
): Promise<BalancePrepResult> {
  onStep?.("checking");
  const wrapper = confidentialWrapper(asset);
  const handle = await publicClient.readContract({
    address: wrapper,
    abi: confidentialWrapperAbi,
    functionName: "confidentialBalanceOf",
    args: [userAddress],
  });

  if (isEncryptedHandle(handle as `0x${string}` | undefined)) {
    try {
      const balance = await confidentialToken(sdk, asset).balanceOf(userAddress);
      if (balance >= confidentialAmount) {
        onStep?.("ready");
        return { alreadyHadBalance: true, minted: false, shielded: false };
      }
    } catch (err) {
      if (!(err instanceof NoCiphertextError)) throw err;
    }
  }

  const underlying = underlyingToken(asset);
  const plainBalance = await publicClient.readContract({
    address: underlying,
    abi: mintableErc20Abi,
    functionName: "balanceOf",
    args: [userAddress],
  });

  let minted = false;
  let shielded = false;

  if (plainBalance < underlyingAmount) {
    onStep?.("minting");
    await ensureUnderlyingBalance(
      publicClient,
      walletClient,
      asset,
      userAddress,
      underlyingAmount,
      tracker,
    );
    minted = true;
  }

  onStep?.("shielding");
  await wrapToConfidential(sdk, asset, underlyingAmount, tracker);
  shielded = true;
  onStep?.("ready");

  return { alreadyHadBalance: false, minted, shielded };
}

type PendingDepositInfo = { exists: boolean; acceptedHandle: `0x${string}` };

async function readPendingDeposit(
  publicClient: PublicClient,
  poolAddress: `0x${string}`,
  commitmentHex: `0x${string}`,
): Promise<PendingDepositInfo> {
  const result = (await publicClient.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "pendingDeposits",
    args: [commitmentHex],
  })) as readonly [boolean, `0x${string}`] | PendingDepositInfo;
  return Array.isArray(result)
    ? { exists: result[0], acceptedHandle: result[1] }
    : (result as PendingDepositInfo);
}

export type DepositPhase = "depositing" | "confirming";

/**
 * Deposit via `confidentialTransferAndCall`, then finalize once the encrypted
 * amount check has been publicly decrypted. Wrong amounts are auto-refunded by the
 * token and never finalize; an interrupted run resumes from confirmation.
 */
export async function depositViaTransferAndCall(
  sdk: ZamaSDK,
  publicClient: PublicClient,
  walletClient: WalletClient,
  asset: PoolAsset,
  userAddress: `0x${string}`,
  poolAddress: `0x${string}`,
  commitment: bigint,
  confidentialAmount: bigint,
  tracker?: TxTracker,
  onPhase?: (phase: DepositPhase) => void,
) {
  const token = confidentialToken(sdk, asset);
  await token.allow();

  const tokenAddress = confidentialWrapper(asset);
  const commitmentHex = toBytes32(commitment);
  const callData = encodeAbiParameters(parseAbiParameters("bytes32"), [commitmentHex]);

  const alreadyPending = (await readPendingDeposit(publicClient, poolAddress, commitmentHex))
    .exists;

  // Step 1 — move encrypted tokens into the pool (records a pending deposit).
  if (!alreadyPending) {
    const encrypted = await buildEncryptedTransferArgs(
      sdk,
      tokenAddress,
      userAddress,
      confidentialAmount,
    );
    onPhase?.("depositing");
    const sendDeposit = () =>
      writeWalletContract({
        walletClient,
        publicClient,
        account: userAddress,
        address: tokenAddress,
        abi: confidentialTransferAndCallAbi,
        functionName: "confidentialTransferAndCall",
        args: [poolAddress, encrypted.handle, encrypted.inputProof, callData],
        gasCap: FHE_GAS_CAP,
      });
    if (tracker) {
      await tracker.run(
        {
          pendingTitle: "Depositing confidential tokens",
          pendingDetail: "Sending cUSDC/cWETH into the pool.",
          successTitle: "Deposit sent",
          successDetail: "Now confirming the amount.",
          errorTitle: "Deposit failed",
        },
        sendDeposit,
      );
    } else {
      const depositHash = await sendDeposit();
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
    }
  }

  // Step 2 — verify the encrypted amount via Zama public decryption, then finalize
  // so the note becomes spendable.
  onPhase?.("confirming");
  const pending = await readPendingDeposit(publicClient, poolAddress, commitmentHex);
  const { abiEncodedClearValues, decryptionProof } = await sdk.relayer.publicDecrypt([
    pending.acceptedHandle,
  ]);

  const sendFinalize = () =>
    writeWalletContract({
      walletClient,
      publicClient,
      account: userAddress,
      address: poolAddress,
      abi: poolAbi,
      functionName: "finalizeDeposit",
      args: [commitmentHex, abiEncodedClearValues, decryptionProof],
      gasCap: FHE_GAS_CAP,
    });

  if (tracker) {
    return tracker.run(
      {
        pendingTitle: "Confirming your deposit",
        pendingDetail: "Zama verifies the amount, then your note goes live.",
        successTitle: "Deposit confirmed",
        successDetail: "Your note is live. Save it somewhere safe.",
        errorTitle: "Confirmation failed",
      },
      sendFinalize,
    );
  }

  const finalizeHash = await sendFinalize();
  await publicClient.waitForTransactionReceipt({ hash: finalizeHash });
  return finalizeHash;
}

export { buildEncryptedTransferArgs };

/**
 * Confidential deposit for the current pools: the two-step `transferAndCall` +
 * `finalizeDeposit` flow that verifies the encrypted amount before the note
 * becomes spendable.
 */
export async function depositConfidential(
  sdk: ZamaSDK,
  publicClient: PublicClient,
  walletClient: WalletClient,
  asset: PoolAsset,
  userAddress: `0x${string}`,
  poolAddress: `0x${string}`,
  commitment: bigint,
  confidentialAmount: bigint,
  tracker?: TxTracker,
  onPhase?: (phase: DepositPhase) => void,
) {
  return depositViaTransferAndCall(
    sdk,
    publicClient,
    walletClient,
    asset,
    userAddress,
    poolAddress,
    commitment,
    confidentialAmount,
    tracker,
    onPhase,
  );
}
