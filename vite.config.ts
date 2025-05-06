import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// Use import.meta.dirname for ES modules (replacing __dirname)
const rootDir = import.meta.dirname;

export default defineConfig({
  // Root directory for the frontend (where index.html resides)
  root: path.resolve(rootDir, 'client'),

  // Plugins for React and Replit-specific functionality
  plugins: [
    react(), // Enables React JSX/TSX support
    runtimeErrorOverlay(), // Replit error modal for debugging
    // Conditionally include cartographer plugin for Replit in non-production
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID
      ? [
          await import('@replit/vite-plugin-cartographer')
            .then((m) => m.cartographer())
            .catch((err) => {
              console.warn('Failed to load cartographer plugin:', err);
              return [];
            }),
        ]
      : []),
  ],

  // Resolve aliases for imports
  resolve: {
    alias: {
      '@db': path.resolve(rootDir, 'db'), // Database files (e.g., db/seed.ts)
      '@': path.resolve(rootDir, 'client/src'), // Frontend source
      '@shared': path.resolve(rootDir, 'shared'), // Shared utilities/types
      '@assets': path.resolve(rootDir, 'attached_assets'), // Static assets
    },
  },

  // Build configuration
  build: {
    outDir: path.resolve(rootDir, 'dist/public'), // Output frontend assets to dist/public/
    emptyOutDir: true, // Clear outDir before building
    assetsDir: 'assets', // Subdirectory for JS/CSS assets
    sourcemap: process.env.NODE_ENV !== 'production', // Generate sourcemaps in non-production
  },

  // Server configuration for development
  server: {
    host: '0.0.0.0', // Allow external access (needed for Render/Dev)
    port: 5000, // Match backend port in server/index.ts
    strictPort: true, // Fail if port is unavailable
  },

  // Optimize dependencies for faster development
  optimizeDeps: {
    include: ['react', 'react-dom'], // Pre-bundle common dependencies
  },
});