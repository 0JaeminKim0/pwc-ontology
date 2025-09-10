// Railway 전용 완전 독립 서버 (Hono 의존성 제거)
import { createServer } from 'http'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const port = parseInt(process.env.PORT || '3000')

console.log('🚀 Railway 전용 독립 서버 시작...')

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

// 정적 파일 및 HTML 템플릿 로드
const content = new Map()

function loadContent() {
  console.log('📁 콘텐츠 로딩...')
  
  // 정적 파일들
  const staticFiles = [
    'public/static/app.js',
    'public/static/styles.css',
    'public/favicon.ico'
  ]
  
  staticFiles.forEach(file => {
    const fullPath = join(process.cwd(), file)
    if (existsSync(fullPath)) {
      try {
        const fileContent = readFileSync(fullPath)
        const key = file.replace('public', '')
        content.set(key, fileContent)
        console.log(`✅ ${key} 로드됨 (${fileContent.length} bytes)`)
      } catch (error) {
        console.error(`❌ ${file} 로드 실패:`, error.message)
      }
    }
  })
  
  // 인라인 HTML을 runtime에 생성
  try {
    const inlineHtml = generateInlineHTML()
    content.set('/inline', inlineHtml)
    console.log(`✅ 인라인 HTML 생성됨 (${inlineHtml.length} 문자)`)
  } catch (error) {
    console.error('❌ 인라인 HTML 생성 실패:', error.message)
  }
  
  console.log(`📊 총 ${content.size}개 콘텐츠 로드 완료`)
}

// 인라인 HTML 생성 (모든 JS/CSS 포함)
function generateInlineHTML() {
  try {
    let appJs = ''
    let stylesCSS = ''
    
    // 정적 파일들에서 내용 읽기
    if (content.has('/static/app.js')) {
      appJs = content.get('/static/app.js').toString('utf8')
    }
    if (content.has('/static/styles.css')) {
      stylesCSS = content.get('/static/styles.css').toString('utf8')
    }
    
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PwC 온톨로지 자동 구축 서비스</title>
  
  <!-- TailwindCSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- FontAwesome Icons -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  
  <!-- React & ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <!-- Three.js -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
  
  <!-- D3.js -->
  <script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
  
  <!-- GSAP for animations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  
  <!-- 인라인 스타일 -->
  <style>
${stylesCSS}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

.graph-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  min-width: 300px;
}

.insight-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  min-width: 280px;
  max-height: 60vh;
  overflow-y: auto;
}

.status-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulse { animation: pulse 2s infinite; }
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.glow { animation: glow 2s ease-in-out infinite alternate; }
@keyframes glow {
  from { box-shadow: 0 0 5px #e74c3c; }
  to { box-shadow: 0 0 20px #e74c3c, 0 0 30px #e74c3c; }
}

.slide-in { animation: slideIn 0.5s ease-out; }
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- 인라인 JavaScript -->
  <script>
${appJs}
  </script>
</body>
</html>`
  } catch (error) {
    console.error('인라인 HTML 생성 오류:', error)
    return '<html><body><h1>인라인 HTML 생성 오류</h1></body></html>'
  }
}

// 메인 HTML 템플릿 생성
function getMainHTML() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PwC 온톨로지 자동 구축 서비스</title>
  
  <!-- TailwindCSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- FontAwesome Icons -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  
  <!-- React & ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <!-- Three.js -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
  
  <!-- D3.js -->
  <script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
  
  <!-- GSAP for animations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  
  <!-- Custom styles -->
  <link href="/static/styles.css" rel="stylesheet" />
  
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }
    
    .graph-container {
      width: 100vw;
      height: 100vh;
      position: relative;
      background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
      cursor: grab;
      user-select: none;
    }
    
    .graph-container:active {
      cursor: grabbing;
    }
    
    .control-panel {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      min-width: 300px;
      animation: fadeInLeft 0.6s ease-out;
    }
    
    .insight-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      min-width: 280px;
      max-height: 60vh;
      overflow-y: auto;
      animation: fadeInRight 0.6s ease-out;
    }
    
    .status-bar {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.8s ease-out;
    }
    
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .pulse { animation: pulse 2s infinite; }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .glow { animation: glow 2s ease-in-out infinite alternate; }
    @keyframes glow {
      from { box-shadow: 0 0 5px #e74c3c; }
      to { box-shadow: 0 0 20px #e74c3c, 0 0 30px #e74c3c; }
    }
    
    button { transition: all 0.3s ease; }
    button:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); 
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- Main React App Script -->
  <script src="/static/app.js"></script>
</body>
</html>`
}

// Mock API 데이터
const mockNodes = []
const mockLinks = []

// 서버 시작
loadContent()

const server = createServer(async (req, res) => {
  const url = req.url || '/'
  
  console.log(`📥 ${req.method} ${url}`)
  
  try {
    // 정적 파일 처리
    if (content.has(url)) {
      console.log(`🎯 정적 파일 제공: ${url}`)
      const fileContent = content.get(url)
      const ext = extname(url)
      const contentType = mimeTypes[ext] || 'text/plain'
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': Buffer.byteLength(fileContent)
      })
      res.end(fileContent)
      return
    }
    
    // 인라인 HTML 처리
    if (url === '/inline' && content.has('/inline')) {
      console.log('🎯 인라인 HTML 제공')
      const html = content.get('/inline')
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html, 'utf8')
      })
      res.end(html)
      return
    }
    
    // API 라우트들
    if (url === '/api/health') {
      const healthData = JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      })
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(healthData)
      })
      res.end(healthData)
      return
    }
    
    if (url === '/api/ontology/nodes') {
      const nodesData = JSON.stringify(mockNodes)
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(nodesData)
      })
      res.end(nodesData)
      return
    }
    
    if (url === '/api/ontology/links') {
      const linksData = JSON.stringify(mockLinks)
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(linksData)
      })
      res.end(linksData)
      return
    }
    
    // 메인 HTML 페이지
    if (url === '/' || url === '/index.html') {
      console.log('🎯 메인 HTML 제공')
      const html = getMainHTML()
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html, 'utf8')
      })
      res.end(html)
      return
    }
    
    // 404 처리
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
    
  } catch (error) {
    console.error('❌ 서버 오류:', error.message)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(`Server Error: ${error.message}`)
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Railway 독립 서버가 http://0.0.0.0:${port}에서 실행 중`)
  console.log(`🎯 메인 페이지: http://0.0.0.0:${port}/`)
  console.log(`🎯 인라인 페이지: http://0.0.0.0:${port}/inline`)
  console.log(`💊 Health Check: http://0.0.0.0:${port}/api/health`)
})

// 에러 핸들링
server.on('error', (error) => {
  console.error('서버 오류:', error)
})

process.on('uncaughtException', (error) => {
  console.error('처리되지 않은 예외:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('처리되지 않은 Promise 거부:', reason)
})