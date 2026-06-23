"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ZamaProvider,
  RelayerWeb,
  indexedDBStorage,
  SepoliaConfig,
} from "@zama-fhe/react-sdk";
import { ViemSigner } from "@zama-fhe/sdk/viem";
import type { EIP1193Provider, WalletClient } from "viem";
import { createPublicClient, http } from "viem";
import { useMemo, useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http as wagmiHttp, useWalletClient } from "wagmi";
import { injected } from "wagmi/connectors";
import { TARGET_CHAIN } from "@/config/chains";

const sepoliaRpc =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim() || SepoliaConfig.network;

export const wagmiConfig = createConfig({
  chains: [TARGET_CHAIN],
  connectors: [injected()],
  transports: {
    [TARGET_CHAIN.id]: wagmiHttp(sepoliaRpc),
  },
  ssr: true,
});

function ZamaBridge({ children }: { children: ReactNode }) {
  const { data: walletClient } = useWalletClient();

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: TARGET_CHAIN,
        transport: http(sepoliaRpc),
      }),
    [],
  );

  const signer = useMemo(() => {
    return new ViemSigner({
      publicClient,
      walletClient: (walletClient as unknown as WalletClient | undefined) ?? undefined,
      ethereum:
        typeof window !== "undefined"
          ? (window.ethereum as EIP1193Provider | undefined)
          : undefined,
    });
  }, [publicClient, walletClient]);

  const relayer = useMemo(
    () =>
      new RelayerWeb({
        getChainId: () => signer?.getChainId() ?? Promise.resolve(TARGET_CHAIN.id),
        transports: {
          [SepoliaConfig.chainId]: {
            ...SepoliaConfig,
            network: sepoliaRpc,
          },
        },
      }),
    [signer],
  );

  return (
    <ZamaProvider relayer={relayer} signer={signer} storage={indexedDBStorage}>
      {children}
    </ZamaProvider>
  );
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaBridge>{children}</ZamaBridge>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
