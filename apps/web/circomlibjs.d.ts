declare module "circomlibjs" {
  export type PoseidonFn = ((inputs: bigint[]) => unknown) & {
    F: {
      toObject(value: unknown): bigint;
    };
  };

  export function buildPoseidon(): Promise<PoseidonFn>;
}
