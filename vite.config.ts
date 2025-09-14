import { defineConfig } from 'vite'

// Railway에서는 railway-server.js를 직접 사용하므로 Vite 빌드 불필요
// 단순한 설정으로 빌드 에러 방지
export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['fs', 'path', 'http', 'url']
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
})