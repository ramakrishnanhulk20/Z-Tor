/** Superseded pool contracts — notes deposited here cannot withdraw on current registry pools. */
export const LEGACY_POOL_ADDRESSES: Partial<
  Record<string, readonly `0x${string}`[]>
> = {
  "eth-0.1": [
    "0xfe8AB6A72A45B34a39a33f0a438Bbd34CEB65df6",
    "0xcaCCB90e6A8AeD0db71373597392F8Ad8C63dad5",
  ],
  "eth-1": [
    "0x209860Ceb7646788029048bbe9eD909D564880d5",
    "0xAb6780B209D12D7a05c742499f3B127e2c37FDA5",
  ],
  "usdc-100": [
    "0x2d9c2b574632Dcb8E295246b93845dA3fC63b36f",
    "0x29Af53608C3E4a93F25093675d4D490b023358Fe",
  ],
  "usdc-1000": [
    "0x76aC8B5597Fc15E84932c7eA574030963422C543",
    "0xF5070aEf9723b4da15355004D85a0FBd00C0A1f6",
  ],
};
