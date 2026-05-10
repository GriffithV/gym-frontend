import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useMock = env.VITE_USE_MOCK !== "false";
  const apiTarget = env.VITE_API_TARGET ?? "http://localhost:8080";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      host: true,
      // When NOT using MSW, proxy /api to the real Spring Boot backend.
      // Same-origin from the browser's POV — cookies work without CORS.
      proxy: useMock
        ? undefined
        : {
            "/api": {
              target: apiTarget,
              changeOrigin: true,
              secure: false,
              cookieDomainRewrite: "localhost",
            },
          },
    },
  };
});
