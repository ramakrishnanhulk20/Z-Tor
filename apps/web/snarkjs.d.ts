declare module "snarkjs" {
  export type Groth16Proof = {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
  };

  export namespace groth16 {
    function fullProve(
      input: Record<string, unknown>,
      wasmFile: string,
      zkeyFile: string,
    ): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
  }
}
