// Railway 배포용 서버 진입점
import { serve } from '@hono/node-server'
import app from './dist/_worker.js'

const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 PwC 온톨로지 서버 시작 중... 포트: ${port}`)

serve({
  fetch: app.fetch,
  port: port
}, () => {
  console.log(`✅ 서버가 포트 ${port}에서 실행 중입니다`)
  console.log(`🌐 URL: http://localhost:${port}`)
  console.log(`💊 Health Check: http://localhost:${port}/api/health`)
})