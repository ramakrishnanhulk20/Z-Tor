/** Superseded pool contracts keyed by pool id. Notes deposited there cannot
 * withdraw on the current registry pools. Empty: all prior deployments retired. */
export const LEGACY_POOL_ADDRESSES: Partial<
  Record<string, readonly `0x${string}`[]>
> = {};
