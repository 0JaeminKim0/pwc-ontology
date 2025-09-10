import build from '@hono/vite-build/node'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/node'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    build({
      entry: 'src/index.tsx',
      outputDir: 'dist',
      // Railway/Node.js 환경 설정
      minify: mode === 'production',
      external: []
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  define: {
    // Cloudflare Workers 전용 변수를 Node.js에서 정의
    '__STATIC_CONTENT_MANIFEST': 'undefined',
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
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