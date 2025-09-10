// Railway용 초간단 정적 파일 서버
import { createServer } from 'http'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const port = parseInt(process.env.PORT || '3000')

console.log('🐛 [DEBUG] 서버 초기화')
console.log('🐛 [DEBUG] __filename:', __filename)
console.log('🐛 [DEBUG] __dirname:', __dirname)
console.log('🐛 [DEBUG] process.cwd():', process.cwd())
console.log('🐛 [DEBUG] PORT:', port)

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
  console.log('📁 정적 파일 로딩 시작...')
  
  // 현재 디렉토리 구조 확인
  console.log('🐛 [DEBUG] 현재 디렉토리 내용:')
  try {
    const currentDir = readdirSync(process.cwd())
    console.log('🐛 [DEBUG] Root:', currentDir.join(', '))
    
    if (existsSync('public')) {
      const publicDir = readdirSync('public')
      console.log('🐛 [DEBUG] public/:', publicDir.join(', '))
      
      if (existsSync('public/static')) {
        const staticDir = readdirSync('public/static')
        console.log('🐛 [DEBUG] public/static/:', staticDir.join(', '))
      }
    }
  } catch (error) {
    console.error('🐛 [DEBUG] 디렉토리 조사 실패:', error)
  }
  
  const files = [
    'public/static/app.js',
    'public/static/styles.css', 
    'public/static/style.css',
    'public/favicon.ico'
  ]
  
  files.forEach(file => {
    const fullPath = join(process.cwd(), file)
    console.log(`🐛 [DEBUG] 시도: ${file} -> ${fullPath}`)
    
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath)
        const key = file.replace('public', '')
        staticFiles.set(key, content)
        console.log(`✅ ${file} -> ${key} 로드됨 (${content.length} bytes)`)
      } catch (error) {
        console.error(`❌ ${file} 로드 실패:`, error.message)
        console.error(`❌ 전체 오류:`, error)
      }
    } else {
      console.warn(`⚠️ ${file} 파일이 존재하지 않음: ${fullPath}`)
    }
  })
  
  console.log(`📊 총 ${staticFiles.size}개 정적 파일 로드 완료`)
  console.log('🐛 [DEBUG] 로드된 키들:', Array.from(staticFiles.keys()))
}

// 동적 Hono 앱 import
let honoApp
try {
  console.log('🐛 [DEBUG] Hono 앱 로딩 시도...')
  
  // dist 폴더 확인
  if (existsSync('./dist')) {
    console.log('🐛 [DEBUG] dist 폴더 존재')
    const distFiles = readdirSync('./dist')
    console.log('🐛 [DEBUG] dist 내용:', distFiles.join(', '))
  } else {
    console.error('🐛 [DEBUG] dist 폴더가 존재하지 않음!')
  }
  
  const module = await import('./dist/_worker.js')
  honoApp = module.default
  console.log('✅ Hono 앱 로드 성공')
} catch (error) {
  console.error('❌ Hono 앱 로드 실패:', error.message)
  console.error('❌ 전체 Hono 오류:', error)
}

// 서버 시작
loadStaticFiles()

const server = createServer(async (req, res) => {
  const url = req.url || '/'
  
  console.log(`📥 ${req.method} ${url}`)
  
  try {
    // 정적 파일 처리
    if (staticFiles.has(url)) {
      console.log(`🎯 정적 파일 제공: ${url}`)
      const content = staticFiles.get(url)
      const ext = extname(url)
      const contentType = mimeTypes[ext] || 'text/plain'
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': content.length
      })
      res.end(content)
      console.log(`✅ 정적 파일 제공 완료: ${url} (${content.length} bytes)`)
      return
    }
    
    // favicon 특별 처리
    if (url === '/favicon.ico') {
      console.log('🎯 favicon 제공')
      if (staticFiles.has('/favicon.ico')) {
        const content = staticFiles.get('/favicon.ico')
        res.writeHead(200, {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': content.length
        })
        res.end(content)
      } else {
        res.writeHead(200, {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=86400'
        })
        res.end(Buffer.alloc(0))
      }
      console.log('✅ favicon 제공 완료')
      return
    }
    
    // Hono 앱으로 전달
    if (honoApp) {
      console.log(`🎯 Hono 앱으로 전달: ${url}`)
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
        console.log(`✅ Hono 응답 완료: ${url} (${response.status})`)
      } catch (error) {
        console.error('❌ Hono 처리 오류:', error.message)
        console.error('❌ 전체 Hono 오류:', error)
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end(`Hono Error: ${error.message}`)
      }
    } else {
      console.error('❌ Hono 앱이 로드되지 않음')
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Hono App Not Available')
    }
  } catch (error) {
    console.error('❌ 서버 요청 처리 오류:', error.message)
    console.error('❌ 전체 서버 오류:', error)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(`Server Error: ${error.message}`)
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