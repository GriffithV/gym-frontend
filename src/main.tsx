import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

async function bootstrap() {
  // Mock layer is on by default in dev, OFF when VITE_USE_MOCK=false.
  // When off, requests pass through to the real backend via Vite's /api proxy.
  const useMock =
    import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== "false";

  if (useMock) {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: { url: "/mockServiceWorker.js" },
    });
    console.info("[gym-ops] mock backend (MSW) aktif");
  } else {
    console.info("[gym-ops] gerçek backend modunda — /api proxy üzerinden");
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
