// Railway용 정적 파일 인라인 빌드 스크립트
import { readFileSync, writeFileSync } from 'fs'

console.log('🔧 인라인 빌드 시작...')

try {
  // app.js 파일 읽기
  const appJs = readFileSync('public/static/app.js', 'utf8')
  console.log(`📄 app.js 로드됨: ${appJs.length} 문자`)

  // styles.css 파일 읽기  
  const stylesCss = readFileSync('public/static/styles.css', 'utf8')
  console.log(`🎨 styles.css 로드됨: ${stylesCss.length} 문자`)

  // 인라인 HTML 생성
  const inlineHtml = `
<!DOCTYPE html>
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
${stylesCss}

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

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.glow {
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 5px #e74c3c; }
  to { box-shadow: 0 0 20px #e74c3c, 0 0 30px #e74c3c; }
}

.slide-in {
  animation: slideIn 0.5s ease-out;
}

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

  // 인라인 HTML 저장
  writeFileSync('dist/inline.html', inlineHtml)
  console.log('✅ 인라인 HTML 생성 완료: dist/inline.html')
  
  console.log('🚀 인라인 빌드 성공!')

} catch (error) {
  console.error('❌ 인라인 빌드 실패:', error)
  process.exit(1)
}