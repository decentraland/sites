import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
  const envVariables = loadEnv(mode, process.cwd())

  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer']
      })
    ],
    ...(command === 'build' ? { base: envVariables.VITE_BASE_URL } : undefined),
    server: {
      proxy: {
        '/api/cms': {
          target: 'https://cms.decentraland.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cms/, '')
        }
      }
    }
  }
})
