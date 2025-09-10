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

// Mock 삼성전자 DX SCM PDF 처리 결과 생성
function generateMockPDFProcessingResult(uploadData) {
  const startTime = Date.now()
  const fileName = uploadData.fileName || 'samsung_dx_scm.pdf'
  
  // PDF 페이지 이미지 노드들 (5개 페이지)
  const pageImageNodes = []
  for (let i = 1; i <= 5; i++) {
    const angle = ((i - 1) / 5) * 2 * Math.PI
    const radius = 400
    
    pageImageNodes.push({
      id: `page-img-${Date.now()}-${i}`,
      documentId: `pdf-doc-${Date.now()}`,
      pageNumber: i,
      imageDataUrl: generateMockPageImageDataURL(i),
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      type: 'pdf_page_image',
      category: 'document_page_image',
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: i * 40,
      color: '#ffffff',
      label: getPageTitle(i),
      pageTitle: getPageTitle(i),
      isNew: true,
      metadata: {
        pageNumber: i,
        title: getPageTitle(i),
        extractedText: getPageText(i),
        wordCount: 50 + i * 20,
        hasTitle: true,
        hasImages: i <= 3,
        hasTables: i >= 3,
        hasCharts: i >= 2,
        pageType: getPageType(i),
        keywords: getPageKeywords(i),
        summary: getPageSummary(i),
        aiKeywords: getAIKeywords(i),
        consultingInsights: getConsultingInsights(i),
        confidence: 0.9 + Math.random() * 0.09
      }
    })
  }
  
  // AI 키워드 노드들 (11개)
  const aiKeywordNodes = []
  const aiKeywords = [
    'Generative AI', 'SCM', 'Multi Agent', 'NSCM', 'AI Orchestrator',
    'Digital Transformation', 'Data Analytics', 'Machine Learning',
    'Process Automation', 'Business Intelligence', 'Cloud Computing'
  ]
  
  aiKeywords.forEach((keyword, index) => {
    const angle = (index / aiKeywords.length) * 2 * Math.PI
    const radius = 700 + index * 20
    
    aiKeywordNodes.push({
      id: `ai-keyword-${Date.now()}-${index}`,
      label: keyword,
      type: 'ai_keyword',
      category: 'ai_concept',
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: 200 + index * 40,
      color: '#e74c3c',
      size: 8,
      isNew: true,
      confidence: 0.9 + Math.random() * 0.1,
      metadata: {
        keyword: keyword,
        category: 'AI Technology',
        relevance: 'High',
        extractedFrom: '삼성전자 DX SCM 제안서'
      }
    })
  })
  
  // 컨설팅 인사이트 노드들 (11개)
  const consultingInsightNodes = []
  const consultingInsights = [
    'PoC 구축', '업무 프로세스 최적화', 'AI 도입 전략', '사용성 제고',
    '프로젝트 구조화', '단계별 접근법', '체계적 제안', '비용 효율성',
    '리스크 관리', '성과 측정', '변화 관리'
  ]
  
  consultingInsights.forEach((insight, index) => {
    const angle = (index / consultingInsights.length + Math.PI) * 2 * Math.PI
    const radius = 800 + index * 30
    
    consultingInsightNodes.push({
      id: `consulting-${Date.now()}-${index}`,
      label: insight,
      type: 'consulting_insight',
      category: 'business_insight',
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: 160 + index * 50,
      color: '#f39c12',
      size: 10,
      isNew: true,
      confidence: 0.85 + Math.random() * 0.1,
      metadata: {
        insight: insight,
        category: 'Business Strategy',
        impact: 'Medium',
        extractedFrom: '삼성전자 DX SCM 제안서'
      }
    })
  })
  
  // 모든 노드 통합
  const allNodes = [...pageImageNodes, ...aiKeywordNodes, ...consultingInsightNodes]
  
  // 관계 생성
  const relationships = []
  
  // 페이지 간 순차 관계
  for (let i = 0; i < pageImageNodes.length - 1; i++) {
    relationships.push({
      source: pageImageNodes[i].id,
      target: pageImageNodes[i + 1].id,
      type: 'next_page',
      strength: 1.0,
      evidence: '순차적 페이지'
    })
  }
  
  // 페이지와 AI 키워드 간 관계
  aiKeywordNodes.forEach((aiNode, index) => {
    const sourcePageIndex = index % pageImageNodes.length
    relationships.push({
      source: pageImageNodes[sourcePageIndex].id,
      target: aiNode.id,
      type: 'contains_ai_concept',
      strength: 0.8,
      evidence: 'AI 개념 추출'
    })
  })
  
  // 페이지와 컨설팅 인사이트 간 관계
  consultingInsightNodes.forEach((consultingNode, index) => {
    const sourcePageIndex = index % pageImageNodes.length
    relationships.push({
      source: pageImageNodes[sourcePageIndex].id,
      target: consultingNode.id,
      type: 'generates_insight',
      strength: 0.7,
      evidence: '컨설팅 인사이트 도출'
    })
  })
  
  const processingTime = Date.now() - startTime
  
  return {
    success: true,
    processingMode: 'unified',
    processedDocument: {
      id: `pdf-doc-${Date.now()}`,
      filename: fileName,
      title: fileName.replace('.pdf', ''),
      aiKeywordCount: aiKeywordNodes.length,
      consultingInsightCount: consultingInsightNodes.length
    },
    pdfAnalysis: {
      pages: pageImageNodes.length,
      pageNodes: pageImageNodes.length,
      pageRelationships: pageImageNodes.length - 1,
      mainTopics: ['Gen AI', 'SCM', 'Multi Agent', 'NSCM', 'AI Orchestrator']
    },
    pdfImageAnalysis: {
      pageImages: pageImageNodes.length,
      pageRelationships: relationships.length,
      mainTopics: ['Digital Transformation', 'AI Strategy', 'Process Optimization']
    },
    ontologyAnalysis: {
      entities: aiKeywordNodes.length + consultingInsightNodes.length,
      relationships: relationships.filter(r => r.type !== 'next_page').length
    },
    totalProcessingTime: processingTime,
    newNodes: allNodes,
    newLinks: relationships,
    message: `삼성전자 DX SCM 생성형 AI 제안서 통합 처리 완료: ${allNodes.length}개 노드, ${relationships.length}개 관계 생성`
  }
}

// PwC 시드 온톨로지 생성
function generatePwCSeedOntology() {
  const nodes = [
    // 조직 노드들
    { id: 'pwc-korea', label: 'PwC Korea', type: 'organization', x: 0, y: 0, z: 0, color: '#e74c3c' },
    { id: 'ds-division', label: 'DS 사업부', type: 'division', x: 100, y: 50, z: 20, color: '#c0392b' },
    { id: 'consulting-practice', label: 'Consulting Practice', type: 'practice', x: -100, y: 50, z: 20, color: '#e67e22' },
    
    // 클라이언트 노드들
    { id: 'samsung', label: '삼성', type: 'client', x: 200, y: 0, z: 0, color: '#2980b9' },
    { id: 'lg', label: 'LG', type: 'client', x: 150, y: 100, z: 0, color: '#2980b9' },
    { id: 'sk', label: 'SK', type: 'client', x: 100, y: 150, z: 0, color: '#2980b9' },
    
    // 서비스 노드들
    { id: 'digital-transformation', label: 'Digital Transformation', type: 'capability', x: 0, y: 100, z: 40, color: '#2ecc71' },
    { id: 'ai-consulting', label: 'AI Consulting', type: 'capability', x: 50, y: 120, z: 40, color: '#2ecc71' },
    { id: 'scm-optimization', label: 'SCM Optimization', type: 'capability', x: -50, y: 120, z: 40, color: '#2ecc71' }
  ]
  
  const links = [
    { source: 'pwc-korea', target: 'ds-division', type: 'contains' },
    { source: 'pwc-korea', target: 'consulting-practice', type: 'contains' },
    { source: 'ds-division', target: 'samsung', type: 'serves' },
    { source: 'consulting-practice', target: 'digital-transformation', type: 'provides' },
    { source: 'consulting-practice', target: 'ai-consulting', type: 'provides' },
    { source: 'consulting-practice', target: 'scm-optimization', type: 'provides' }
  ]
  
  return { nodes, links }
}

// Helper functions for mock data generation
function generateMockPageImageDataURL(pageNumber) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
      <text x="200" y="150" fill="#2c3e50" font-family="Arial" font-size="16" text-anchor="middle" font-weight="bold">
        페이지 ${pageNumber}
      </text>
    </svg>
  `)}`
}

function getPageTitle(pageNumber) {
  const titles = [
    '삼성전자 DX SCM 생성형 AI 제안서',
    'Agenda',
    '프로젝트 추진 목표',
    '구현 계획',
    '기대 효과'
  ]
  return titles[pageNumber - 1] || `페이지 ${pageNumber}`
}

function getPageText(pageNumber) {
  const texts = [
    '삼성전자 DX SCM 생성형 AI 기반 SCM 데이터 조회 MVP 구축',
    'I. 제안 개요 II. 수행 범위 III. 사업 관리 IV. 제안사 소개',
    'Gen AI 기반 내/외부 데이터의 업무 활용을 극대화하여 NSCM 시스템의 사용성 제고',
    '3단계 구현 계획: Phase 1, Phase 2, Phase 3',
    '업무 효율성 향상 및 의사결정 품질 개선'
  ]
  return texts[pageNumber - 1] || `페이지 ${pageNumber} 텍스트`
}

function getPageType(pageNumber) {
  const types = ['cover', 'agenda', 'strategy', 'implementation', 'results']
  return types[pageNumber - 1] || 'content'
}

function getPageKeywords(pageNumber) {
  const keywords = [
    ['삼성전자', 'DX', 'SCM', '생성형 AI', 'MVP'],
    ['제안개요', '수행범위', '사업관리', '제안사소개'],
    ['Gen AI', 'NSCM', 'AI Orchestrator', 'Multi Agent'],
    ['구현계획', 'Phase', '단계별', '로드맵'],
    ['기대효과', '업무효율성', '의사결정', '품질개선']
  ]
  return keywords[pageNumber - 1] || [`키워드${pageNumber}`]
}

function getPageSummary(pageNumber) {
  const summaries = [
    'PwC의 삼성전자 DX SCM 생성형 AI 기반 데이터 조회 서비스 PoC 제안서 표지',
    '제안서의 전체 구성과 진행 순서를 나타내는 아젠다',
    'Gen AI를 활용한 SCM 데이터 활용 극대화 및 NSCM 시스템 사용성 제고 방안',
    '3단계로 구성된 체계적인 구현 계획 및 로드맵',
    '프로젝트 완료 후 예상되는 업무 효율성 향상 및 기대 효과'
  ]
  return summaries[pageNumber - 1] || `페이지 ${pageNumber} 요약`
}

function getAIKeywords(pageNumber) {
  const aiKeywords = [
    ['Generative AI', 'SCM', 'Data Analytics'],
    ['Project Scope', 'Service Delivery', 'Implementation'],
    ['Multi Agent', 'AI Orchestrator', 'NSCM'],
    ['Roadmap', 'Phase Management', 'Milestone'],
    ['ROI', 'Efficiency', 'Optimization']
  ]
  return aiKeywords[pageNumber - 1] || ['AI', 'Technology']
}

function getConsultingInsights(pageNumber) {
  const insights = [
    ['PoC 구축', '업무 프로세스 최적화', 'AI 도입 전략'],
    ['프로젝트 구조화', '단계별 접근법', '체계적 제안'],
    ['사용성 제고', '시스템 통합', '데이터 활용'],
    ['위험 관리', '품질 보증', '성과 측정'],
    ['변화 관리', '지속적 개선', '가치 실현']
  ]
  return insights[pageNumber - 1] || ['컨설팅', '전략']
}

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
    
    // 문서 업로드 API
    if (url === '/api/documents/upload' && req.method === 'POST') {
      console.log('🎯 문서 업로드 요청')
      
      try {
        // 요청 본문 읽기
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const uploadData = JSON.parse(body)
            
            // Mock 삼성전자 DX SCM PDF 처리 결과 생성
            const mockResult = generateMockPDFProcessingResult(uploadData)
            
            // 생성된 노드/링크를 런타임 데이터에 추가
            mockNodes.push(...mockResult.newNodes)
            mockLinks.push(...mockResult.newLinks)
            
            const responseData = JSON.stringify(mockResult)
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(responseData)
            })
            res.end(responseData)
            console.log(`✅ 문서 업로드 처리 완료: ${mockResult.newNodes.length}개 노드, ${mockResult.newLinks.length}개 링크`)
          } catch (parseError) {
            console.error('❌ JSON 파싱 오류:', parseError)
            const errorData = JSON.stringify({ success: false, error: 'Invalid JSON' })
            res.writeHead(400, {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(errorData)
            })
            res.end(errorData)
          }
        })
      } catch (error) {
        console.error('❌ 문서 업로드 오류:', error)
        const errorData = JSON.stringify({ success: false, error: error.message })
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(errorData)
        })
        res.end(errorData)
      }
      return
    }
    
    // 온톨로지 리셋 API
    if (url === '/api/ontology/reset' && req.method === 'POST') {
      console.log('🎯 온톨로지 리셋 요청')
      
      try {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const resetData = JSON.parse(body)
            
            if (resetData.loadSeed) {
              // PwC 시드 온톨로지 로드
              const seedData = generatePwCSeedOntology()
              mockNodes.splice(0, mockNodes.length, ...seedData.nodes)
              mockLinks.splice(0, mockLinks.length, ...seedData.links)
              
              const responseData = JSON.stringify({
                success: true,
                nodeCount: seedData.nodes.length,
                linkCount: seedData.links.length,
                message: 'PwC 시드 온톨로지 로드 완료'
              })
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(responseData)
              })
              res.end(responseData)
            } else {
              // 그래프 완전 초기화
              mockNodes.splice(0, mockNodes.length)
              mockLinks.splice(0, mockLinks.length)
              
              const responseData = JSON.stringify({
                success: true,
                nodeCount: 0,
                linkCount: 0,
                message: '그래프 초기화 완료'
              })
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(responseData)
              })
              res.end(responseData)
            }
            console.log(`✅ 온톨로지 리셋 완료: ${mockNodes.length}개 노드, ${mockLinks.length}개 링크`)
          } catch (parseError) {
            console.error('❌ JSON 파싱 오류:', parseError)
            const errorData = JSON.stringify({ success: false, error: 'Invalid JSON' })
            res.writeHead(400, {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(errorData)
            })
            res.end(errorData)
          }
        })
      } catch (error) {
        console.error('❌ 온톨로지 리셋 오류:', error)
        const errorData = JSON.stringify({ success: false, error: error.message })
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(errorData)
        })
        res.end(errorData)
      }
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