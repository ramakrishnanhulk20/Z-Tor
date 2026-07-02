import { createPublicClient, http, isAddress, isHex } from "viem";
import { sepolia } from "viem/chains";
import { resolvePoolWitness } from "@/lib/withdraw";
import { toBytes32 } from "@/lib/poseidon";

export const runtime = "nodejs";
export const maxDuration = 60;

function sepoliaRpc(): string | undefined {
  return process.env.RPC_URL ?? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
}

export async function POST(req: Request) {
  const rpc = sepoliaRpc();
  if (!rpc) {
    return Response.json(
      { error: "Server RPC is not configured." },
      { status: 503 },
    );
  }

  let body: { pool?: string; commitment?: string };
  try {
    body = (await req.json()) as { pool?: string; commitment?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { pool, commitment } = body;
  if (!isAddress(pool ?? "") || !isHex(commitment ?? "")) {
    return Response.json({ error: "Invalid pool or commitment." }, { status: 400 });
  }

  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpc),
  });

  const result = await resolvePoolWitness(
    client,
    pool as `0x${string}`,
    BigInt(commitment as `0x${string}`),
  );

  if (result.status === "out-of-sync") {
    return Response.json(
      { error: "Could not rebuild the pool Merkle tree from deposit events." },
      { status: 503 },
    );
  }
  if (result.status === "not-found") {
    return Response.json({ error: "Commitment not found in pool." }, { status: 404 });
  }

  return Response.json({
    root: toBytes32(result.root),
    pathElements: result.path.pathElements.map((x) => toBytes32(x)),
    pathIndices: result.path.pathIndices,
    leafIndex: result.leafIndex,
  });
}
