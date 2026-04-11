import React, { StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const APP_CONFIG = {
  name: "THRYLOS Dashboard",
  version: "1.0.0",
  env: import.meta.env.MODE,
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("App crashed:", error);
    logEvent("APP_CRASH", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: "center" }}>
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function logEvent(event: string, data?: any) {
  console.log(`[EVENT]: ${event}`, data || "");
}

function initializeTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");

  if (saved) {
    root.classList.toggle("dark", saved === "dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}

function monitorNetwork() {
  window.addEventListener("online", () => {
    console.log("🟢 Back Online");
    logEvent("ONLINE");
  });

  window.addEventListener("offline", () => {
    console.warn("🔴 Offline");
    logEvent("OFFLINE");
  });
}

function trackPerformance(startTime: number) {
  window.addEventListener("load", () => {
    const endTime = performance.now();
    console.log(`⚡ App loaded in ${(endTime - startTime).toFixed(2)} ms`);
    logEvent("APP_LOAD_TIME", endTime - startTime);
  });

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name === "first-contentful-paint") {
        console.log("🎨 FCP:", entry.startTime);
        logEvent("FCP", entry.startTime);
      }
    });
  });

  observer.observe({ type: "paint", buffered: true });
}

function initializeApp(): void {
  const startTime = performance.now();

  console.log(`🚀 Starting ${APP_CONFIG.name} v${APP_CONFIG.version}`);
  console.log(`🌍 Environment: ${APP_CONFIG.env}`);

  initializeTheme();
  monitorNetwork();

  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Root element not found.");
  }

  const root: Root = createRoot(container);

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );

  trackPerformance(startTime);
}

try {
  initializeApp();
  logEvent("APP_STARTED");
} catch (error) {
  console.error("❌ Failed to initialize app:", error);
}
