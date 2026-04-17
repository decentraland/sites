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
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer']
      })
    ],
    build: {
      target: 'esnext',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          /* eslint-disable @typescript-eslint/naming-convention */
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
            'vendor-intl': ['@formatjs/icu-messageformat-parser', '@formatjs/intl'],
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
        },
        '/api/cms': {
          target: 'https://cms-api.decentraland.org',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/api\/cms/, '/spaces/ea2ybdmmn1kv/environments/master')
        }
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    }
  }
})
