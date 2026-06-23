import { corsHeaders, getRelayerInfo, isRelayerConfigured } from "@z-tor/relayer/src/relay.mjs";

export const runtime = "nodejs";

export async function GET() {
  if (!isRelayerConfigured()) {
    return Response.json(
      { error: "Relayer is not configured on this deployment." },
      { status: 503, headers: corsHeaders },
    );
  }
  return Response.json(getRelayerInfo(), { headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
