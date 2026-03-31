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
      ...(envVariables.VITE_WHATS_ON_REMOTE_URL
        ? [
            federation({
              name: 'landing_host',
              remotes: {
                whats_on: envVariables.VITE_WHATS_ON_REMOTE_URL
              },
              shared: {
                react: { singleton: true, requiredVersion: '^18.3.0' },
                'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
                'react-router-dom': { singleton: true, requiredVersion: '^7.9.0' },
                '@emotion/react': { singleton: true, requiredVersion: '^11.14.0' },
                '@emotion/styled': { singleton: true, requiredVersion: '^11.14.0' },
                '@reduxjs/toolkit': { singleton: true, requiredVersion: '^2.9.0' },
                'react-redux': { singleton: true, requiredVersion: '^9.2.0' },
                wagmi: { singleton: true, requiredVersion: '^2.19.0' },
                viem: { singleton: true, requiredVersion: '^2.44.0' },
                '@dcl/hooks': { singleton: true, requiredVersion: '^1.2.0' },
                'decentraland-ui2': { singleton: true, requiredVersion: '^1.6.0' },
                '@dcl/schemas': { singleton: true, requiredVersion: '^25.2.0' }
              } as Record<string, { singleton: boolean; requiredVersion: string }>
            })
          ]
        : [])
      /* eslint-enable @typescript-eslint/naming-convention */
    ],
    build: {
      target: 'esnext',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          /* eslint-disable @typescript-eslint/naming-convention */
          manualChunks: {
            // Sentry (~900KB source) is pulled in transitively by @dcl/hooks but
            // is NOT needed for First Contentful Paint or LCP.
            'vendor-sentry': [
              '@sentry/browser',
              '@sentry/core',
              '@sentry-internal/replay',
              '@sentry-internal/browser-utils',
              '@sentry-internal/feedback'
            ],
            // Schema validation (~510KB) is only needed when API responses arrive.
            'vendor-schemas': ['@dcl/schemas', 'ajv'],
            // @dcl/crypto + eth-connect are used for wallet signing, not rendering.
            'vendor-crypto': ['@dcl/crypto', 'eth-connect'],
            // Redux + RTK (~240KB source) — not needed for first paint.
            'vendor-redux': ['@reduxjs/toolkit', 'react-redux', 'immer', 'reselect'],
            // i18n + date formatting (~175KB source) — not needed for static shell.
            'vendor-intl': ['@formatjs/icu-messageformat-parser', '@formatjs/intl', 'date-fns'],
            // UA detection (~100KB source) — async hook, not needed for first paint.
            'vendor-ua': ['ua-parser-js'],
            // React Router (~340KB source) — route matching happens after React mounts,
            // not during the static shell paint.
            'vendor-router': ['react-router', 'react-router-dom']
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
