// Local dev server for the relayer. On Vercel, use Next.js routes at /api/relayer/* instead.
import http from "node:http";
import { corsHeaders, getRelayerInfo, handleRelay, isRelayerConfigured } from "./relay.mjs";

const PORT = Number(process.env.PORT ?? 8787);

if (!isRelayerConfigured()) {
  console.error("RELAYER_PRIVATE_KEY and ZTOR_REGISTRY must be set (see .env.example)");
  process.exit(1);
}

function send(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json", ...corsHeaders });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});
    if (req.method === "GET" && req.url === "/info") {
      return send(res, 200, getRelayerInfo());
    }
    if (req.method === "POST" && req.url === "/relay") {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 100_000) return send(res, 413, { error: "Body too large." });
      }
      const [status, payload] = await handleRelay(JSON.parse(raw));
      return send(res, status, payload);
    }
    return send(res, 404, { error: "Not found." });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Relayer error." });
  }
});

server.listen(PORT, () => {
  const info = getRelayerInfo();
  console.log(`z-tor relayer listening on :${PORT}`);
  console.log(`relayer address: ${info.relayer} (fee ${info.feeBasisPoints} bps)`);
});
