import type { NextConfig } from "next";

const docsUrl = (
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://rams-4.gitbook.io/rams-docs"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.31.250"],
  transpilePackages: ["framer-motion", "@zama-fhe/react-sdk", "@zama-fhe/sdk", "@z-tor/relayer"],
  async redirects() {
    return [
      { source: "/shield", destination: "/app/shield", permanent: false },
      { source: "/deposit", destination: "/app/deposit", permanent: false },
      { source: "/withdraw", destination: "/app/withdraw", permanent: false },
      { source: "/stats", destination: "/app/stats", permanent: false },
      { source: "/disclose", destination: "/app/disclose", permanent: false },
      { source: "/faq", destination: `${docsUrl}/faq`, permanent: false },
      {
        source: "/how-it-works",
        destination: `${docsUrl}/how_it_works`,
        permanent: false,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    if (!isServer) {
      config.experiments = { ...config.experiments, asyncWebAssembly: true };
    }
    return config;
  },
};

export default nextConfig;
