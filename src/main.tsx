// ============================================================
// main.tsx — Enhanced Version
// ============================================================

import React, { StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/* ============================================================ */
/* ERROR BOUNDARY (NEW FEATURE)                                 */
/* ============================================================ */

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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: "center" }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ============================================================ */
/* APP INITIALIZER                                              */
/* ============================================================ */

function initializeApp(): void {
  const startTime = performance.now();

  const container: HTMLElement | null = document.getElementById('root');

  if (!container) {
    console.error("Root element missing");
    throw new Error("Root element with id 'root' not found.");
  }

  const root: Root = createRoot(container);

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );

  /* ============================================================ */
  /* PERFORMANCE LOGGING (NEW FEATURE)                            */
  /* ============================================================ */

  window.addEventListener('load', () => {
    const endTime = performance.now();
    console.log(`App loaded in ${(endTime - startTime).toFixed(2)} ms`);
  });
}

/* ============================================================ */
/* SAFE INITIALIZATION                                           */
/* ============================================================ */

try {
  initializeApp();
} catch (error) {
  console.error("Failed to initialize app:", error);
}
