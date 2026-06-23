import { NoCiphertextError } from "@zama-fhe/react-sdk";
import type { ZamaSDK } from "@zama-fhe/react-sdk";
import { toFunctionSelector } from "viem";
import type { PublicClient, WalletClient } from "viem";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import {
  confidentialTransferAndCallAbi,
  confidentialWrapperAbi,
  mintableErc20Abi,
} from "@/config/contracts";
import { CONFIDENTIAL_SYMBOL } from "@/config/display";
import type { PoolAsset } from "@/config/pools";
import { confidentialWrapper, underlyingToken } from "@/config/zama";
import { isEncryptedHandle } from "@/lib/decrypt-balance";
import {
  buildEncryptedDepositArgs,
  buildEncryptedTransferArgs,
} from "@/lib/encrypt";
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

const OPERATOR_UNTIL = Math.min(Math.floor(Date.now() / 1000) + 86400 * 365, 2 ** 48 - 1);

/** Legacy operator pull — only needed for pre-callback pool deployments. */
export async function ensureConfidentialOperator(
  sdk: ZamaSDK,
  asset: PoolAsset,
  userAddress: `0x${string}`,
  poolAddress: `0x${string}`,
  tracker?: TxTracker,
) {
  const token = confidentialToken(sdk, asset);
  const approved = await token.isApproved(poolAddress, userAddress);
  if (approved) return;

  const authorize = async () => {
    const { txHash } = await token.approve(poolAddress, OPERATOR_UNTIL);
    return txHash;
  };

  if (tracker) {
    await tracker.run(
      {
        pendingTitle: "Authorize pool",
        pendingDetail: "One-time permission so the pool can receive your deposit.",
        successTitle: "Pool authorized",
        successDetail: "You can deposit confidential tokens now.",
        errorTitle: "Authorization failed",
      },
      authorize,
    );
    return;
  }

  await authorize();
}

/**
 * Preferred deposit: one token tx via `confidentialTransferAndCall`.
 * Matches Zama SDK encryption (userAddress = wallet) — no operator approval.
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
) {
  const token = confidentialToken(sdk, asset);
  await token.allow();

  const tokenAddress = confidentialWrapper(asset);
  const encrypted = await buildEncryptedTransferArgs(
    sdk,
    tokenAddress,
    userAddress,
    confidentialAmount,
  );
  const callData = encodeAbiParameters(parseAbiParameters("bytes32"), [
    toBytes32(commitment),
  ]);

  const send = () =>
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
    return tracker.run(
      {
        pendingTitle: "Depositing confidential tokens",
        pendingDetail: "Sending cUSDC/cWETH to the pool in one step.",
        successTitle: "Deposit confirmed",
        successDetail: "Your note is live. Save it somewhere safe.",
        errorTitle: "Deposit failed",
      },
      send,
    );
  }

  const hash = await send();
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/** Legacy pool-pull deposit for contracts without the callback receiver. */
export async function depositViaPoolPull(
  sdk: ZamaSDK,
  publicClient: PublicClient,
  walletClient: WalletClient,
  asset: PoolAsset,
  userAddress: `0x${string}`,
  poolAddress: `0x${string}`,
  commitment: bigint,
  confidentialAmount: bigint,
  tracker?: TxTracker,
) {
  await ensureConfidentialOperator(sdk, asset, userAddress, poolAddress, tracker);

  const tokenAddress = confidentialWrapper(asset);
  const encrypted = await buildEncryptedDepositArgs(
    sdk,
    tokenAddress,
    poolAddress,
    confidentialAmount,
  );

  const send = () =>
    writeWalletContract({
      walletClient,
      publicClient,
      account: userAddress,
      address: poolAddress,
      abi: [
        {
          type: "function",
          name: "deposit",
          stateMutability: "nonpayable",
          inputs: [
            { name: "commitment", type: "bytes32" },
            { name: "encryptedAmount", type: "bytes32" },
            { name: "inputProof", type: "bytes" },
          ],
          outputs: [],
        },
      ],
      functionName: "deposit",
      args: [toBytes32(commitment), encrypted.handle, encrypted.inputProof],
      gasCap: FHE_GAS_CAP,
    });

  if (tracker) {
    return tracker.run(
      {
        pendingTitle: "Depositing confidential tokens",
        pendingDetail: "Pool is pulling your encrypted balance.",
        successTitle: "Deposit confirmed",
        successDetail: "Your note is live. Save it somewhere safe.",
        errorTitle: "Deposit failed",
      },
      send,
    );
  }

  const hash = await send();
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export { buildEncryptedDepositArgs, buildEncryptedTransferArgs };

const CALLBACK_SELECTOR = toFunctionSelector(
  "onConfidentialTransferReceived(address,address,bytes32,bytes)",
);

/** True when the pool implements the ERC-7984 deposit callback (Phase 3+ redeploy). */
export async function poolSupportsTransferAndCall(
  publicClient: PublicClient,
  poolAddress: `0x${string}`,
): Promise<boolean> {
  const code = await publicClient.getBytecode({ address: poolAddress });
  if (!code || code === "0x") return false;
  return code.toLowerCase().includes(CALLBACK_SELECTOR.slice(2).toLowerCase());
}

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
) {
  // transferAndCall enabled on Phase 3c+ (deposit callback + withdraw payout ACL fixed).
  const useCallback =
    process.env.NEXT_PUBLIC_CONFIDENTIAL_DEPOSIT !== "poolPull" &&
    (process.env.NEXT_PUBLIC_CONFIDENTIAL_DEPOSIT === "transferAndCall" ||
      (await poolSupportsTransferAndCall(publicClient, poolAddress)));

  if (useCallback) {
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
    );
  }

  return depositViaPoolPull(
    sdk,
    publicClient,
    walletClient,
    asset,
    userAddress,
    poolAddress,
    commitment,
    confidentialAmount,
    tracker,
  );
}
