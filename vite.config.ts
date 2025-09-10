import build from '@hono/vite-build/node'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/node'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      entry: 'src/index.tsx',
      outputDir: 'dist'
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'src/index.tsx',
      output: {
        entryFileNames: '_worker.js',
        format: 'es'
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
})