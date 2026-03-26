import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
  const envVariables = loadEnv(mode, process.cwd())
  return {
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
        remotes: {
          ...(envVariables.VITE_WHATS_ON_REMOTE_URL ? { whats_on: envVariables.VITE_WHATS_ON_REMOTE_URL } : {})
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
      /* eslint-enable @typescript-eslint/naming-convention */
    ],
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          // Function-based manualChunks: matches by resolved file path,
          // so it works with transitive deps in nested node_modules
          // (unlike object syntax which tries to resolve module names from root)
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/@mui/') || id.includes('node_modules/@emotion/')) {
              return 'vendor-mui'
            }
            if (id.includes('node_modules/wagmi') || id.includes('node_modules/viem') || id.includes('node_modules/@coinbase/')) {
              return 'vendor-web3'
            }
          }
        }
      }
    },
    ...(command === 'build' ? { base: envVariables.VITE_BASE_URL } : undefined),
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
