import { transformAsync } from '@babel/core'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// decentraland-ui2 ships compiled `.styled.js` files that use Emotion component
// selectors (e.g. `[`${StyledX}`]: { ... }`) but were NOT compiled with
// `@emotion/babel-plugin`, so the runtime call to `String(styledComponent)`
// returns `'NO_COMPONENT_SELECTOR'` and Emotion throws at first render. This
// project's React plugin is oxc-based (no babel), so we run `@emotion/babel-plugin`
// surgically on those files via a Vite transform hook that fires in both
// dev (Rolldown prebundle) and build (Rollup).
const emotionUi2StyledRegex = /decentraland-ui2[/\\]dist[/\\].+\.styled\.js$/

async function transformEmotionStyled(code: string, filename: string): Promise<{ code: string; map: unknown } | null> {
  const result = await transformAsync(code, {
    filename,
    plugins: ['@emotion/babel-plugin'],
    babelrc: false,
    configFile: false,
    sourceMaps: true
  })
  if (!result?.code) return null
  return { code: result.code, map: result.map ?? null }
}

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
      },
      {
        name: 'emotion-ui2-styled-transform',
        enforce: 'pre',
        async transform(code, id) {
          if (!emotionUi2StyledRegex.test(id)) return null
          return transformEmotionStyled(code, id)
        }
      }
    ],
    // Vite 8 prebundles deps with Rolldown — top-level plugins do not run on
    // that pipeline. We register the same Emotion babel-plugin transform here
    // so the styled files inside ui2 also get the `target` identifiers needed
    // for component selectors at runtime.
    optimizeDeps: {
      rolldownOptions: {
        plugins: [
          {
            name: 'emotion-ui2-styled-prebundle',
            async transform(code: string, id: string) {
              if (!emotionUi2StyledRegex.test(id)) return null
              return transformEmotionStyled(code, id)
            }
          }
        ]
      }
    },
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
