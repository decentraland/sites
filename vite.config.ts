import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
  const envVariables = loadEnv(mode, process.cwd())
  return {
    define: {
      /* eslint-disable @typescript-eslint/naming-convention */
      'process.env': {
        VITE_BASE_URL: envVariables.VITE_BASE_URL
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    },
    resolve: {
      dedupe: ['@emotion/react', '@emotion/styled', '@mui/material']
    },
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer']
      }),
      /* eslint-disable @typescript-eslint/naming-convention */
      federation({
        name: 'landing_host',
        // At least one remote must be declared so the plugin emits proper host
        // code (share scope initialisation). Without it, the generated virtual
        // module contains an unresolved `__rf_placeholder__shareScope` reference
        // and the 54 top-level `await` calls that resolve shared packages hang
        // silently, preventing React from mounting.
        // The actual URL is overridden at runtime by the worker via
        // `window.__REMOTE_URLS__` + `__federation_method_setRemote`.
        remotes: {
          explore: envVariables.VITE_EXPLORE_REMOTE_URL || 'https://placeholder.decentraland.org/assets/remoteEntry.js',
          blog_site: envVariables.VITE_BLOG_SITE_REMOTE_URL || 'https://placeholder.decentraland.org/assets/remoteEntry.js'
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
          'react-router-dom': { singleton: true, requiredVersion: '^7.9.0' },
          '@emotion/react': { singleton: true, requiredVersion: '^11.14.0' },
          '@emotion/styled': { singleton: true, requiredVersion: '^11.14.0' },
          '@reduxjs/toolkit': { singleton: true, requiredVersion: '^2.10.0' },
          'react-redux': { singleton: true, requiredVersion: '^9.2.0' },
          wagmi: { singleton: true, requiredVersion: '^2.19.0' },
          viem: { singleton: true, requiredVersion: '^2.44.0' },
          '@dcl/core-web3': { singleton: true, requiredVersion: '^0.11.0' },
          '@dcl/hooks': { singleton: true, requiredVersion: '^1.3.0' },
          'decentraland-ui2': { singleton: true, requiredVersion: '^3.4.0' },
          '@dcl/schemas': { singleton: true, requiredVersion: '^26.1.0' }
        } as Record<string, { singleton: boolean; requiredVersion: string }>
      })
      /* eslint-enable @typescript-eslint/naming-convention */
    ],
    build: {
      target: 'esnext',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          /* eslint-disable @typescript-eslint/naming-convention */
          // Packages listed in federation `shared` MUST NOT appear in
          // manualChunks. The federation plugin wraps shared imports with
          // async loaders that emit `__federation_shared_<pkg>` chunks.
          // If a shared package is forced into the same chunk as code that
          // consumes it via the async wrapper, a circular top-level-await
          // deadlock occurs (the chunk awaits its own shared wrapper, which
          // re-imports the chunk).
          manualChunks: {
            'vendor-sentry': [
              '@sentry/browser',
              '@sentry/core',
              '@sentry-internal/replay',
              '@sentry-internal/browser-utils',
              '@sentry-internal/feedback'
            ],
            'vendor-schemas': ['ajv'],
            'vendor-crypto': ['@dcl/crypto', 'eth-connect'],
            'vendor-redux': ['immer', 'reselect'],
            'vendor-intl': ['@formatjs/icu-messageformat-parser', '@formatjs/intl', 'date-fns'],
            'vendor-ua': ['ua-parser-js'],
            'vendor-router': ['react-router']
          }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
      }
    },
    ...(command === 'build' ? { base: envVariables.VITE_BASE_URL || '/' } : undefined),
    server: {
      /* eslint-disable @typescript-eslint/naming-convention */
      proxy: {
        '/auth': {
          target: 'https://decentraland.zone',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    }
  }
})
