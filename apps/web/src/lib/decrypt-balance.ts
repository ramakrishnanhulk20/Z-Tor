import { isZeroHandle } from "@zama-fhe/react-sdk";

export function isEncryptedHandle(handle: string | undefined): handle is `0x${string}` {
  return Boolean(handle && handle.length === 66 && !isZeroHandle(handle as `0x${string}`));
}
