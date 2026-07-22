import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["styled-jsx/babel", { "plugins": ["styled-jsx-plugin-sass"] }]
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },

  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // manualChunks should be a FUNCTION, not an object
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React vendor
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            // UI vendors
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            // Chart vendors
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-chart';
            }
            // Three.js vendors
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            // Other vendors
            return 'vendor-other';
          }
        },
      },
    },
  },

  css: {
    postcss: './postcss.config.js',
  },
});