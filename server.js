// Railway 배포용 서버 진입점
import { serve } from '@hono/node-server'
import app from './dist/_worker.js'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 PwC 온톨로지 서버 시작 중... 포트: ${port}`)

// 디버그: 파일 시스템 확인
console.log('📁 현재 작업 디렉토리:', process.cwd())
console.log('📁 public 폴더 존재 여부:', existsSync('./public'))
if (existsSync('./public')) {
  console.log('📄 public 폴더 내용:', readdirSync('./public'))
  if (existsSync('./public/static')) {
    console.log('📄 public/static 폴더 내용:', readdirSync('./public/static'))
  }
}

serve({
  fetch: app.fetch,
  port: port
}, () => {
  console.log(`✅ 서버가 포트 ${port}에서 실행 중입니다`)
  console.log(`🌐 URL: http://0.0.0.0:${port}`)
  console.log(`💊 Health Check: http://0.0.0.0:${port}/api/health`)
})