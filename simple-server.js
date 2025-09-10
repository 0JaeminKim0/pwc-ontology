// Railway용 초간단 정적 파일 서버
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

const port = parseInt(process.env.PORT || '3000')

// Content-Type 매핑
const mimeTypes = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
}

// 정적 파일 맵 (빌드 시점에 메모리에 로드)
const staticFiles = new Map()

// 파일 로드 함수
function loadStaticFiles() {
  console.log('📁 정적 파일 로딩 중...')
  const files = [
    'public/static/app.js',
    'public/static/styles.css',
    'public/static/style.css',
    'public/favicon.ico'
  ]
  
  files.forEach(file => {
    const fullPath = join(process.cwd(), file)
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath)
        staticFiles.set(file.replace('public', ''), content)
        console.log(`✅ ${file} 로드됨 (${content.length} bytes)`)
      } catch (error) {
        console.error(`❌ ${file} 로드 실패:`, error.message)
      }
    } else {
      console.warn(`⚠️ ${file} 파일이 없음`)
    }
  })
  
  console.log(`📊 총 ${staticFiles.size}개 정적 파일 로드 완료`)
}

// 동적 Hono 앱 import
let honoApp
try {
  const module = await import('./dist/_worker.js')
  honoApp = module.default
  console.log('✅ Hono 앱 로드 성공')
} catch (error) {
  console.error('❌ Hono 앱 로드 실패:', error)
}

// 서버 시작
loadStaticFiles()

const server = createServer(async (req, res) => {
  const url = req.url || '/'
  
  console.log(`📥 ${req.method} ${url}`)
  
  // 정적 파일 처리
  if (staticFiles.has(url)) {
    const content = staticFiles.get(url)
    const ext = extname(url)
    const contentType = mimeTypes[ext] || 'text/plain'
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Content-Length': content.length
    })
    res.end(content)
    return
  }
  
  // favicon 특별 처리
  if (url === '/favicon.ico') {
    res.writeHead(200, {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=86400'
    })
    res.end(Buffer.alloc(0))
    return
  }
  
  // Hono 앱으로 전달
  if (honoApp) {
    try {
      const request = new Request(`http://localhost:${port}${url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? 
          await new Promise(resolve => {
            let body = ''
            req.on('data', chunk => body += chunk)
            req.on('end', () => resolve(body))
          }) : undefined
      })
      
      const response = await honoApp.fetch(request)
      const body = await response.text()
      
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(body)
    } catch (error) {
      console.error('Hono 처리 오류:', error)
      res.writeHead(500)
      res.end('Internal Server Error')
    }
  } else {
    res.writeHead(500)
    res.end('Service Unavailable')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 간단 서버가 http://0.0.0.0:${port}에서 실행 중`)
  console.log(`📁 정적 파일: ${Array.from(staticFiles.keys()).join(', ')}`)
})

// 에러 핸들링
server.on('error', (error) => {
  console.error('서버 오류:', error)
})

process.on('uncaughtException', (error) => {
  console.error('처리되지 않은 예외:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('처리되지 않은 Promise 거부:', reason)
  process.exit(1)
})