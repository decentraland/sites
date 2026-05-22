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
      // Vite preloads every chunk transitively reachable from the entry,
      // including dynamic imports. The vendors below are only consumed inside
      // already-lazy chunks (Sentry/crypto on form submit, ajv inside RTK
      // schema validation, ua-parser inside analytics, LiveKit only inside
      // the /cast/* routes). Stripping them from the modulepreload list keeps
      // the homepage and /whats-on critical path free of ~350 KB of gzipped
      // JS that would otherwise be eagerly fetched.
      modulePreload: {
        resolveDependencies: (_filename, deps) => deps.filter(dep => !/vendor-(sentry|crypto|schemas|ua|livekit)/.test(dep))
      },
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
            // Keep the livekit JS deps grouped but let CSS (@livekit/components-styles)
            // ride with the importing cast chunk. When CSS sits inside a manualChunk
            // Vite injects a top-level <link rel="stylesheet"> for it on every page,
            // even though the JS is lazy — which would render-block /, /brand, /terms…
            if (id.includes('node_modules/livekit-client') || id.includes('node_modules/@livekit/components-react')) {
              return 'vendor-livekit'
            }
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
