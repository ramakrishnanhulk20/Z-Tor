/// Circle Sepolia USDC — verify before production deploys.
/// https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
export const SEPOLIA_USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_SEPOLIA_USDC as `0x${string}` | undefined) ??
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export const ZTOR_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_ZTOR_REGISTRY as `0x${string}` | undefined;
