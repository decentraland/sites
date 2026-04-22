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
      }),
      // @mui/icons-material@5 has no `exports` field, so subpath imports like
      // `@mui/icons-material/ChevronLeft` resolve to the CJS file. Vite 8's
      // pre-bundler emits `export default require_X()` for those, leaking the
      // whole CJS exports object (`{ __esModule, default }`) instead of the
      // icon component. Rewrite to the ESM build that ships in the same package.
      {
        name: 'mui-icons-esm-redirect',
        enforce: 'pre',
        resolveId(source) {
          if (source.startsWith('@mui/icons-material/') && !source.startsWith('@mui/icons-material/esm/')) {
            return this.resolve(source.replace('@mui/icons-material/', '@mui/icons-material/esm/'))
          }
          return null
        }
      }
    ],
    build: {
      target: 'esnext',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (
              id.includes('node_modules/@sentry/browser') ||
              id.includes('node_modules/@sentry/core') ||
              id.includes('node_modules/@sentry-internal/replay') ||
              id.includes('node_modules/@sentry-internal/browser-utils') ||
              id.includes('node_modules/@sentry-internal/feedback')
            ) {
              return 'vendor-sentry'
            }
            if (id.includes('node_modules/ajv')) return 'vendor-schemas'
            if (id.includes('node_modules/@dcl/crypto') || id.includes('node_modules/eth-connect')) return 'vendor-crypto'
            if (id.includes('node_modules/@formatjs/icu-messageformat-parser') || id.includes('node_modules/@formatjs/intl'))
              return 'vendor-intl'
            if (id.includes('node_modules/ua-parser-js')) return 'vendor-ua'
            if (id.includes('node_modules/react-router')) return 'vendor-router'
            return null
          }
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
