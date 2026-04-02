import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  /* ===================================================== */
  /* FEATURE 1 — ENV VARIABLES                             */
  /* ===================================================== */
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,

      /* ===================================================== */
      /* FEATURE 2 — AUTO OPEN BROWSER                        */
      /* ===================================================== */
      open: true,

      /* ===================================================== */
      /* FEATURE 4 — PROXY (API HANDLING)                     */
      /* ===================================================== */
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },

    plugins: [
      react(),
      isDev && componentTagger(),

      /* ===================================================== */
      /* FEATURE 5 — BUNDLE ANALYZER                          */
      /* ===================================================== */
      !isDev &&
        visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          filename: "dist/stats.html",
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    /* ===================================================== */
    /* FEATURE 3 — BUILD OPTIMIZATION                        */
    /* ===================================================== */
    build: {
      sourcemap: isDev,
      minify: "esbuild",

      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },

    /* ===================================================== */
    /* EXTRA — GLOBAL VARIABLES                              */
    /* ===================================================== */
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
  };
});
