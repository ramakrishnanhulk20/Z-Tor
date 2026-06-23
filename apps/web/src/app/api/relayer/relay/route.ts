import { corsHeaders, handleRelay, isRelayerConfigured } from "@z-tor/relayer/src/relay.mjs";

export const runtime = "nodejs";
/** FHE withdraw simulation + submit can exceed the default 10s on Hobby. */
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isRelayerConfigured()) {
    return Response.json(
      { error: "Relayer is not configured on this deployment." },
      { status: 503, headers: corsHeaders },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers: corsHeaders });
  }

  const [status, payload] = await handleRelay(body);
  return Response.json(payload, { status: status as number, headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
