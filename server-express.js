// Railway 배포용 Express + Hono 하이브리드 서버
import express from 'express'
import { serve } from '@hono/node-server'
import app from './dist/_worker.js'
import { existsSync, readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 PwC 온톨로지 Express + Hono 서버 시작 중... 포트: ${port}`)

// 디버그: 파일 시스템 확인
console.log('📁 현재 작업 디렉토리:', process.cwd())
console.log('📁 __dirname:', __dirname)
console.log('📁 public 폴더 존재 여부:', existsSync('./public'))
if (existsSync('./public')) {
  console.log('📄 public 폴더 내용:', readdirSync('./public'))
  if (existsSync('./public/static')) {
    console.log('📄 public/static 폴더 내용:', readdirSync('./public/static'))
  }
}

// Express 앱 생성
const expressApp = express()

// 정적 파일 서빙 (Express 사용)
expressApp.use('/static', express.static(path.join(__dirname, 'public/static')))
expressApp.use('/favicon.ico', express.static(path.join(__dirname, 'public/favicon.ico')))

// 나머지 모든 요청은 Hono 앱으로 처리
expressApp.use('*', async (req, res) => {
  try {
    const response = await app.fetch(new Request(`http://localhost:${port}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    }))
    
    const body = await response.text()
    res.status(response.status)
    
    // 헤더 복사
    for (const [key, value] of response.headers) {
      res.set(key, value)
    }
    
    res.send(body)
  } catch (error) {
    console.error('Hono 앱 처리 중 오류:', error)
    res.status(500).send('Internal Server Error')
  }
})

expressApp.listen(port, '0.0.0.0', () => {
  console.log(`✅ Express + Hono 서버가 포트 ${port}에서 실행 중입니다`)
  console.log(`🌐 URL: http://0.0.0.0:${port}`)
  console.log(`💊 Health Check: http://0.0.0.0:${port}/api/health`)
})