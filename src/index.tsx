import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files manually for Railway compatibility
app.get('/static/*', async (c) => {
  const path = c.req.path.replace('/static/', '')
  const filePath = join(process.cwd(), 'public', 'static', path)
  
  console.log(`[Static] Requested: ${c.req.path} -> ${filePath}`)
  
  if (!existsSync(filePath)) {
    console.log(`[Static] File not found: ${filePath}`)
    return c.text('File not found', 404)
  }
  
  try {
    const content = readFileSync(filePath)
    const contentType = getContentType(path)
    
    return c.body(content, 200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    })
  } catch (error) {
    console.error(`[Static] Error reading ${filePath}:`, error)
    return c.text('Error reading file', 500)
  }
})

// Serve favicon explicitly
app.get('/favicon.ico', async (c) => {
  const faviconPath = join(process.cwd(), 'public', 'favicon.ico')
  
  if (!existsSync(faviconPath)) {
    return c.body(new Uint8Array([0]), 200, {
      'Content-Type': 'image/x-icon'
    })
  }
  
  try {
    const content = readFileSync(faviconPath)
    return c.body(content, 200, {
      'Content-Type': 'image/x-icon'
    })
  } catch (error) {
    console.error('Error serving favicon:', error)
    return c.body(new Uint8Array([0]), 200, {
      'Content-Type': 'image/x-icon'
    })
  }
})

// Helper function to determine content type
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'js':
      return 'application/javascript'
    case 'css':
      return 'text/css'
    case 'html':
      return 'text/html'
    case 'json':
      return 'application/json'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'ico':
      return 'image/x-icon'
    default:
      return 'text/plain'
  }
}

// Use renderer for HTML pages
app.use(renderer)

// API Routes
app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// PwC 시드 온톨로지 데이터 (필요시에만 로드)
import { generateSeedOntology } from './data/pwc-taxonomy'

// 초기에는 빈 그래프로 시작
let runtimeNodes: any[] = []
let runtimeLinks: any[] = []

// 시드 온톨로지 생성 함수 (필요시 호출)
const initializeSeedOntology = () => {
  const { nodes: seedNodes, links: seedLinks } = generateSeedOntology()
  return { seedNodes, seedLinks }
}

app.get('/api/ontology/nodes', (c) => {
  return c.json(runtimeNodes)
})

app.get('/api/ontology/links', (c) => {
  return c.json(runtimeLinks)
})

// 온톨로지 리셋/초기화
app.post('/api/ontology/reset', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { loadSeed = false } = body
  
  if (loadSeed) {
    // PwC 시드 온톨로지 로드
    const { seedNodes, seedLinks } = initializeSeedOntology()
    runtimeNodes = [...seedNodes]
    runtimeLinks = [...seedLinks]
    return c.json({ 
      success: true, 
      message: 'PwC 시드 온톨로지로 리셋되었습니다.',
      nodeCount: runtimeNodes.length,
      linkCount: runtimeLinks.length
    })
  } else {
    // 빈 그래프로 리셋
    runtimeNodes = []
    runtimeLinks = []
    return c.json({ 
      success: true, 
      message: '빈 그래프로 리셋되었습니다.',
      nodeCount: 0,
      linkCount: 0
    })
  }
})

// 온톨로지 상태 조회
app.get('/api/ontology/status', (c) => {
  const { seedNodes, seedLinks } = initializeSeedOntology()
  return c.json({
    totalNodes: runtimeNodes.length,
    totalLinks: runtimeLinks.length,
    seedNodes: seedNodes.length,
    seedLinks: seedLinks.length,
    addedNodes: Math.max(0, runtimeNodes.length - (runtimeNodes.length > 0 ? seedNodes.length : 0)),
    addedLinks: Math.max(0, runtimeLinks.length - (runtimeLinks.length > 0 ? seedLinks.length : 0)),
    categories: {
      organization: runtimeNodes.filter(n => n.type === 'organization').length,
      industry: runtimeNodes.filter(n => n.type === 'industry').length,
      capability: runtimeNodes.filter(n => n.type === 'capability').length,
      technology: runtimeNodes.filter(n => n.type === 'technology').length,
      deliverable: runtimeNodes.filter(n => n.type === 'deliverable').length,
      kpi: runtimeNodes.filter(n => n.type === 'kpi').length,
      pdf_page: runtimeNodes.filter(n => n.type === 'pdf_page').length,
      pdf_page_image: runtimeNodes.filter(n => n.type === 'pdf_page_image').length
    }
  })
})

// Search API
app.post('/api/search', async (c) => {
  const { query } = await c.req.json()
  
  // Mock search results
  const mockResults = {
    nodes: [
      { id: 'digital', score: 0.95 },
      { id: 'ai', score: 0.8 },
      { id: 'analytics', score: 0.7 }
    ],
    path: ['digital', 'analytics', 'ai'],
    insights: [
      'Found 3 related capabilities',
      'Strong connection between Digital Services and AI',
      'Recommended next step: Explore AI use cases'
    ]
  }
  
  return c.json(mockResults)
})

// 고급 문서 업로드 및 자동 처리 API (통합 처리 지원)
app.post('/api/documents/upload', async (c) => {
  try {
    const body = await c.req.json()
    const { fileName, fileContent, fileSize, processingMode = 'unified' } = body
    
    // PDF 파일인지 확인
    const isPDF = fileName.toLowerCase().endsWith('.pdf')
    
    if (isPDF && processingMode === 'unified') {
      // 🔥 통합 처리 모드: 온톨로지 + 페이지 + 이미지를 동시에 처리
      const startTime = Date.now()
      
      // 1️⃣ 온톨로지 처리 (엔티티 추출)
      const processedDoc = await simulateDocumentProcessing(fileName, fileContent)
      const updateResult = await simulateOntologyUpdate(processedDoc)
      
      // 2️⃣ PDF 페이지별 처리 (텍스트)
      const pdfResult = await processPDFByPages(fileName, fileSize)
      
      // 3️⃣ PDF 이미지 처리 (비주얼)
      const pdfImageResult = await processPDFAsImages(fileName, fileSize)
      
      // 🔄 모든 결과를 통합하여 그래프에 추가
      const newNodes: any[] = []
      const newLinks: any[] = []
      
      // 온톨로지 엔티티 추가
      updateResult.autoApproved.forEach(item => {
        if (item.type === 'entity') {
          const newNode = {
            id: item.data.id,
            label: item.data.text,
            type: item.data.type,
            category: item.data.category,
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            z: Math.random() * 200 - 100,
            color: getNodeColor(item.data.type),
            isNew: true,
            confidence: item.data.confidence,
            source: processedDoc.id,
            processingType: 'ontology'
          }
          runtimeNodes.push(newNode)
          newNodes.push(newNode)
        } else if (item.type === 'relationship') {
          const newLink = {
            source: item.data.source,
            target: item.data.target,
            type: item.data.type,
            strength: item.data.confidence,
            evidence: item.data.evidence,
            source_doc: processedDoc.id,
            processingType: 'ontology'
          }
          runtimeLinks.push(newLink)
          newLinks.push(newLink)
        }
      })
      
      // PDF 페이지 노드 추가 (텍스트)
      pdfResult.pageNodes.forEach(pageNode => {
        const nodeWithType = { ...pageNode, processingType: 'pages', isNew: true }
        runtimeNodes.push(nodeWithType)
        newNodes.push(nodeWithType)
      })
      
      // PDF 페이지 이미지 노드 추가 (비주얼)
      pdfImageResult.pageImages.forEach(pageImage => {
        const nodeWithType = { ...pageImage, processingType: 'images', isNew: true }
        runtimeNodes.push(nodeWithType)
        newNodes.push(nodeWithType)
      })
      
      // 모든 관계 링크 추가
      pdfResult.pageRelationships.forEach(rel => {
        const linkWithType = {
          source: rel.source,
          target: rel.target,
          type: rel.type,
          strength: rel.strength,
          evidence: rel.evidence,
          processingType: 'pages'
        }
        runtimeLinks.push(linkWithType)
        newLinks.push(linkWithType)
      })
      
      pdfImageResult.pageRelationships.forEach(rel => {
        const linkWithType = {
          source: rel.source,
          target: rel.target,
          type: rel.type,
          strength: rel.strength,
          evidence: rel.evidence,
          processingType: 'images'
        }
        runtimeLinks.push(linkWithType)
        newLinks.push(linkWithType)
      })
      
      const totalProcessingTime = Date.now() - startTime
      
      return c.json({
        success: true,
        processingMode: 'unified',
        processedDocument: {
          id: processedDoc.id,
          filename: fileName,
          title: pdfResult.title || processedDoc.title,
          totalPages: pdfResult.totalPages,
          mainTopics: [...new Set([...pdfResult.mainTopics, ...pdfImageResult.mainTopics])],
          summary: `통합 처리: ${pdfResult.documentSummary}`,
          aiKeywordCount: pdfImageResult.aiKeywordCount || 0,
          consultingInsightCount: pdfImageResult.consultingInsightCount || 0
        },
        // 온톨로지 분석 결과
        ontologyAnalysis: {
          entities: updateResult.autoApproved.filter(i => i.type === 'entity').length,
          relationships: updateResult.autoApproved.filter(i => i.type === 'relationship').length,
          needsReview: updateResult.needsReview.length,
          processingTime: processedDoc.metadata?.processingTime || 0
        },
        // PDF 페이지 분석 결과 (텍스트)
        pdfAnalysis: {
          pages: pdfResult.totalPages,
          pageNodes: pdfResult.pageNodes.length,
          pageRelationships: pdfResult.pageRelationships.length,
          mainTopics: pdfResult.mainTopics,
          processingTime: pdfResult.metadata.processingTime
        },
        // PDF 이미지 분석 결과 (비주얼)
        pdfImageAnalysis: {
          pages: pdfImageResult.totalPages,
          pageImages: pdfImageResult.pageImages.length,
          pageRelationships: pdfImageResult.pageRelationships.length,
          mainTopics: pdfImageResult.mainTopics,
          processingTime: pdfImageResult.metadata.processingTime
        },
        // 검토 필요 항목
        needsReview: {
          count: updateResult.needsReview.length,
          topCandidates: updateResult.needsReview.slice(0, 5).map(item => ({
            type: item.type,
            text: item.data.text || `${item.data.source} → ${item.data.target}`,
            confidence: item.data.confidence,
            reason: item.reason
          }))
        },
        // 새로 추가된 노드와 링크
        newNodes,
        newLinks,
        // 통합 처리 결과 메시지
        message: `📊 통합 처리 완료!\n` +
                 `🧠 온톨로지: ${updateResult.autoApproved.length}개 엔티티/관계\n` +
                 `📄 페이지 텍스트: ${pdfResult.totalPages}개 페이지\n` +
                 `🖼️ 페이지 이미지: ${pdfImageResult.totalPages}개 이미지\n` +
                 `⏱️ 총 처리시간: ${totalProcessingTime}ms`,
        totalProcessingTime
      })
    } else if (isPDF && processingMode === 'pages') {
      // PDF 페이지별 처리 모드 (기존)
      const pdfResult = await processPDFByPages(fileName, fileSize)
      
      pdfResult.pageNodes.forEach(pageNode => {
        runtimeNodes.push(pageNode)
      })
      
      pdfResult.pageRelationships.forEach(rel => {
        runtimeLinks.push({
          source: rel.source,
          target: rel.target,
          type: rel.type,
          strength: rel.strength,
          evidence: rel.evidence
        })
      })
      
      return c.json({
        success: true,
        processingMode: 'pages',
        processedDocument: {
          id: pdfResult.id,
          filename: pdfResult.filename,
          title: pdfResult.title,
          totalPages: pdfResult.totalPages,
          mainTopics: pdfResult.mainTopics,
          summary: pdfResult.documentSummary
        },
        pdfAnalysis: {
          pages: pdfResult.totalPages,
          pageNodes: pdfResult.pageNodes.length,
          pageRelationships: pdfResult.pageRelationships.length,
          mainTopics: pdfResult.mainTopics,
          processingTime: pdfResult.metadata.processingTime
        },
        newNodes: pdfResult.pageNodes.map(page => ({...page, isNew: true})),
        newLinks: pdfResult.pageRelationships,
        message: `PDF 페이지별 분석 완료: ${pdfResult.totalPages}개 페이지, ${pdfResult.pageRelationships.length}개 관계 생성`
      })
    } else if (isPDF && processingMode === 'images') {
      // PDF → 이미지 변환 모드 (신규)
      const pdfImageResult = await processPDFAsImages(fileName, fileSize)
      
      // PDF 페이지 이미지들을 그래프에 추가
      pdfImageResult.pageImages.forEach(pageImage => {
        runtimeNodes.push(pageImage)
      })
      
      // 페이지 간 관계를 링크에 추가
      pdfImageResult.pageRelationships.forEach(rel => {
        runtimeLinks.push({
          source: rel.source,
          target: rel.target,
          type: rel.type,
          strength: rel.strength,
          evidence: rel.evidence
        })
      })
      
      return c.json({
        success: true,
        processingMode: 'images',
        processedDocument: {
          id: pdfImageResult.id,
          filename: pdfImageResult.filename,
          title: pdfImageResult.title,
          totalPages: pdfImageResult.totalPages,
          mainTopics: pdfImageResult.mainTopics,
          summary: pdfImageResult.documentSummary
        },
        pdfImageAnalysis: {
          pages: pdfImageResult.totalPages,
          pageImages: pdfImageResult.pageImages.length,
          pageRelationships: pdfImageResult.pageRelationships.length,
          mainTopics: pdfImageResult.mainTopics,
          processingTime: pdfImageResult.metadata.processingTime
        },
        newNodes: pdfImageResult.pageImages.map(page => ({...page, isNew: true})),
        newLinks: pdfImageResult.pageRelationships,
        message: `PDF 이미지 변환 완료: ${pdfImageResult.totalPages}개 페이지 이미지, ${pdfImageResult.pageRelationships.length}개 관계 생성`
      })
    } else {
      // 기존 온톨로지 모드
      const processedDoc = await simulateDocumentProcessing(fileName, fileContent)
      const updateResult = await simulateOntologyUpdate(processedDoc)
      
      // 자동 승인된 항목들을 런타임 온톨로지에 추가
      const newNodes: any[] = []
      const newLinks: any[] = []
      
      updateResult.autoApproved.forEach(item => {
        if (item.type === 'entity') {
          const newNode = {
            id: item.data.id,
            label: item.data.text,
            type: item.data.type,
            category: item.data.category,
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            z: Math.random() * 200 - 100,
            color: getNodeColor(item.data.type),
            isNew: true,
            confidence: item.data.confidence,
            source: processedDoc.id
          }
          runtimeNodes.push(newNode)
          newNodes.push(newNode)
        } else if (item.type === 'relationship') {
          const newLink = {
            source: item.data.source,
            target: item.data.target,
            type: item.data.type,
            strength: item.data.confidence,
            evidence: item.data.evidence,
            source_doc: processedDoc.id
          }
          runtimeLinks.push(newLink)
          newLinks.push(newLink)
        }
      })
      
      return c.json({
        success: true,
        processingMode: 'ontology',
        processedDocument: {
          id: processedDoc.id,
          filename: processedDoc.filename,
          confidence: processedDoc.confidence,
          documentType: processedDoc.metadata.documentType,
          client: processedDoc.metadata.client,
          tags: processedDoc.metadata.tags
        },
        autoApproved: {
          entities: updateResult.autoApproved.filter(i => i.type === 'entity').length,
          relationships: updateResult.autoApproved.filter(i => i.type === 'relationship').length
        },
        needsReview: {
          count: updateResult.needsReview.length,
          topCandidates: updateResult.needsReview.slice(0, 5).map(item => ({
            type: item.type,
            text: item.data.text || `${item.data.source} → ${item.data.target}`,
            confidence: item.data.confidence,
            reason: item.reason
          }))
        },
        newNodes,
        newLinks,
        message: `문서 처리 완료: ${updateResult.autoApproved.length}개 자동 승인, ${updateResult.needsReview.length}개 검토 필요`
      })
    }
  } catch (error) {
    return c.json({ success: false, error: '문서 처리 중 오류 발생' }, 500)
  }
})

// PDF 페이지 상세 정보 조회
app.get('/api/pdf/page/:pageId', (c) => {
  const pageId = c.req.param('pageId')
  const pageNode = runtimeNodes.find(node => node.id === pageId && node.type === 'pdf_page')
  
  if (!pageNode) {
    return c.json({ error: '페이지를 찾을 수 없습니다' }, 404)
  }
  
  return c.json({
    page: pageNode,
    relatedPages: runtimeLinks
      .filter(link => link.source === pageId || link.target === pageId)
      .map(link => ({
        relationshipType: link.type,
        relatedPageId: link.source === pageId ? link.target : link.source,
        strength: link.strength,
        evidence: link.evidence
      }))
  })
})

// PDF 문서별 페이지 목록 조회
app.get('/api/pdf/document/:docId/pages', (c) => {
  const docId = c.req.param('docId')
  const pages = runtimeNodes
    .filter(node => node.type === 'pdf_page' && node.documentId === docId)
    .sort((a, b) => a.pageNumber - b.pageNumber)
  
  return c.json({
    documentId: docId,
    totalPages: pages.length,
    pages: pages.map(page => ({
      id: page.id,
      pageNumber: page.pageNumber,
      title: page.title,
      summary: page.summary,
      keywords: page.keywords,
      wordCount: page.wordCount,
      imageCount: page.images?.length || 0,
      tableCount: page.tables?.length || 0
    }))
  })
})

// 검토 필요 항목들 조회
app.get('/api/review/pending', (c) => {
  // Mock 데이터 - 실제로는 DB에서 조회
  const pendingItems = [
    {
      id: 'review-1',
      type: 'entity',
      text: 'Quantum Computing',
      confidence: 0.65,
      context: '차세대 컴퓨팅 기술인 Quantum Computing을 활용한...',
      suggestedType: 'technology',
      reason: '새로운 기술 용어, 확신도 검증 필요'
    },
    {
      id: 'review-2', 
      type: 'relationship',
      text: 'AI → 자동화율',
      confidence: 0.58,
      evidence: 'AI 도입으로 자동화율이 90% 향상되었다',
      suggestedType: 'improves',
      reason: '관계 강도 불분명'
    }
  ]
  
  return c.json(pendingItems)
})

// 검토 승인/거절 처리
app.post('/api/review/:id/decision', async (c) => {
  const reviewId = c.req.param('id')
  const { decision, feedback } = await c.req.json() // 'approve' | 'reject'
  
  // Mock 처리 - 실제로는 학습 데이터로 활용
  return c.json({
    success: true,
    reviewId,
    decision,
    feedback,
    message: decision === 'approve' ? '승인되어 온톨로지에 추가되었습니다' : '거절되었습니다',
    learningUpdate: `피드백이 학습 모델에 반영되어 다음 처리 정확도가 향상됩니다`
  })
})

// 유틸리티 함수들
function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    organization: '#e74c3c',
    division: '#c0392b', 
    practice: '#e67e22',
    industry: '#3498db',
    client: '#2980b9',
    capability: '#2ecc71',
    technology: '#9b59b6',
    deliverable: '#f39c12',
    kpi: '#1abc9c',
    document: '#95a5a6',
    pdf_page_image: '#ffffff',      // 페이지 이미지 (흰색)
    ai_keyword: '#e74c3c',          // AI 키워드 (빨간색)
    consulting_insight: '#f39c12',  // 컨설팅 인사이트 (주황색)
    pdf_page: '#3498db'            // PDF 페이지 텍스트 (파란색)
  }
  return colors[type] || '#34495e'
}

async function simulateDocumentProcessing(fileName: string, content?: string): Promise<any> {
  // DocumentProcessor 시뮬레이션
  return {
    id: `doc-${Date.now()}`,
    filename: fileName,
    title: '삼성DS S&OP 최적화 프로젝트',
    confidence: 0.87,
    metadata: {
      documentType: 'proposal',
      client: 'samsung',
      tags: ['digital', 'ai', 'supply-chain'],
      uploadTime: new Date().toISOString()
    },
    extractedEntities: [
      {
        id: 'extracted-entity-1',
        text: 'Quantum Computing', 
        type: 'technology',
        category: 'discovered',
        confidence: 0.65
      },
      {
        id: 'extracted-entity-2',
        text: 'Edge Computing',
        type: 'technology', 
        category: 'discovered',
        confidence: 0.82
      }
    ],
    extractedRelationships: [
      {
        id: 'extracted-rel-1',
        source: 'samsung',
        target: 'extracted-entity-2',
        type: 'adopts',
        confidence: 0.78,
        evidence: '삼성은 Edge Computing 기술을 적극 도입하고 있다'
      }
    ]
  }
}

// PDF 이미지 처리 함수 (페이지를 이미지로 변환)
async function processPDFAsImages(fileName: string, fileSize: number): Promise<any> {
  const startTime = Date.now()
  
  // 🔥 실제 삼성전자 DX SCM 제안서 기반 데이터
  const mockPageImages = [
    {
      id: `page-img-${Date.now()}-1`,
      documentId: `pdf-doc-${Date.now()}`,
      pageNumber: 1,
      imageDataUrl: generateMockPageImage(1),
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      type: 'pdf_page_image',
      category: 'document_page_image',
      x: Math.cos(0) * 400,
      y: Math.sin(0) * 400,
      z: 0,
      color: '#ffffff',
      label: '제안서 표지',
      pageTitle: '삼성전자 DX SCM 생성형 AI 제안서',
      isNew: true,
      metadata: {
        pageNumber: 1,
        title: '삼성전자 DX SCM 생성형 AI 기반 SCM 데이터 조회 MVP 구축',
        extractedText: '삼성전자 DX SCM 생성형 AI 기반 SCM 데이터 조회 MVP 구축 Workflow 기반 활용 방안 수립',
        wordCount: 32,
        hasTitle: true,
        hasImages: true,
        hasTables: false,
        hasCharts: false,
        pageType: 'cover',
        keywords: ['삼성전자', 'DX', 'SCM', '생성형 AI', 'MVP', 'Workflow', 'PwC'],
        summary: 'PwC의 삼성전자 DX SCM 생성형 AI 기반 데이터 조회 서비스 PoC 제안서 표지',
        aiKeywords: ['Generative AI', 'SCM', 'Data Analytics', 'Digital Transformation'],
        consultingInsights: ['PoC 구축', '업무 프로세스 최적화', 'AI 도입 전략', '사용성 제고'],
        fonts: [{ family: 'Arial', sizes: [24, 36, 48], usage: 1.0 }],
        colors: [
          { hex: '#0066cc', rgb: [0, 102, 204], usage: 0.4, role: 'primary' },
          { hex: '#2c3e50', rgb: [44, 62, 80], usage: 0.4, role: 'text' },
          { hex: '#ffffff', rgb: [255, 255, 255], usage: 0.2, role: 'background' }
        ],
        textBlocks: [],
        images: [{ id: 'img-1-1', type: 'logo', description: 'PwC 로고' }],
        confidence: 0.98
      }
    },
    {
      id: `page-img-${Date.now()}-2`,
      documentId: `pdf-doc-${Date.now()}`,
      pageNumber: 2,
      imageDataUrl: generateMockPageImage(2),
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      type: 'pdf_page_image',
      category: 'document_page_image',
      x: Math.cos((1/5) * 2 * Math.PI) * 400,
      y: Math.sin((1/5) * 2 * Math.PI) * 400,
      z: 20,
      color: '#ffffff',
      label: 'Agenda',
      pageTitle: 'Agenda',
      isNew: true,
      metadata: {
        pageNumber: 2,
        title: 'Agenda',
        extractedText: 'I. 제안 개요 II. 수행 범위 III. 사업 관리 IV. 제안사 소개',
        wordCount: 18,
        hasTitle: true,
        hasImages: false,
        hasTables: false,
        hasCharts: false,
        pageType: 'agenda',
        keywords: ['제안개요', '수행범위', '사업관리', '제안사소개', 'Agenda'],
        summary: '제안서의 전체 구성과 진행 순서를 나타내는 아젠다 페이지',
        aiKeywords: ['Project Scope', 'Service Delivery', 'Implementation'],
        consultingInsights: ['프로젝트 구조화', '단계별 접근법', '체계적 제안'],
        fonts: [{ family: 'Arial', sizes: [16, 24, 36], usage: 1.0 }],
        colors: [
          { hex: '#0066cc', rgb: [0, 102, 204], usage: 0.4, role: 'accent' },
          { hex: '#2c3e50', rgb: [44, 62, 80], usage: 0.5, role: 'text' }
        ],
        confidence: 0.95
      }
    },
    {
      id: `page-img-${Date.now()}-3`,
      documentId: `pdf-doc-${Date.now()}`,
      pageNumber: 3,
      imageDataUrl: generateMockPageImage(3),
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      type: 'pdf_page_image',
      category: 'document_page_image',
      x: Math.cos((2/5) * 2 * Math.PI) * 400,
      y: Math.sin((2/5) * 2 * Math.PI) * 400,
      z: 40,
      color: '#ffffff',
      label: '프로젝트 추진 목표',
      pageTitle: 'I. 제안 개요 - 프로젝트 추진 목표',
      isNew: true,
      metadata: {
        pageNumber: 3,
        title: 'Gen AI 기반 내/외부 데이터 활용 추진 방향성',
        extractedText: 'Gen AI 기반 내/외부 데이터의 업무 활용을 극대화하여 NSCM 시스템의 사용성 제고를 목표로 함. SCM 통합 AI Orchestrator를 통한 Multi Agent 시스템 구축',
        wordCount: 62,
        hasTitle: true,
        hasImages: true,
        hasTables: false,
        hasCharts: true,
        pageType: 'strategy',
        keywords: ['Gen AI', 'NSCM', 'AI Orchestrator', 'Multi Agent', 'SCM', '데이터 활용'],
        summary: '생성형 AI를 활용한 SCM 데이터 조회 서비스의 핵심 목표와 추진 방향성',
        aiKeywords: ['Generative AI', 'Multi-Agent System', 'AI Orchestration', 'Natural Language Processing'],
        consultingInsights: ['시스템 통합 전략', 'AI 활용 극대화', '사용성 중심 설계', '업무 효율성 향상'],
        fonts: [{ family: 'Arial', sizes: [16, 24, 36], usage: 1.0 }],
        colors: [
          { hex: '#2ecc71', rgb: [46, 204, 113], usage: 0.3, role: 'accent' },
          { hex: '#3498db', rgb: [52, 152, 219], usage: 0.3, role: 'primary' },
          { hex: '#9b59b6', rgb: [155, 89, 182], usage: 0.2, role: 'accent' }
        ],
        confidence: 0.97
      }
    },
    {
      id: `page-img-${Date.now()}-4`,
      documentId: `pdf-doc-${Date.now()}`,
      pageNumber: 4,
      imageDataUrl: generateMockPageImage(4),
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      type: 'pdf_page_image',
      category: 'document_page_image',
      x: Math.cos((3/5) * 2 * Math.PI) * 400,
      y: Math.sin((3/5) * 2 * Math.PI) * 400,
      z: 60,
      color: '#ffffff',
      label: '구현 계획',
      pageTitle: '구현 계획',
      isNew: true,
      metadata: {
        pageNumber: 4,
        title: '구현 계획',
        extractedText: '3. 구현 계획 Phase 1 데이터 플랫폼 Phase 2 AI 모델 Phase 3 전사 적용',
        wordCount: 52,
        hasTitle: true,
        hasImages: false,
        hasTables: true,
        hasCharts: false,
        pageType: 'content',
        keywords: ['구현계획', 'Phase', '데이터플랫폼', 'AI모델', '전사적용'],
        summary: '3단계 Phase별 구현 계획 및 일정',
        fonts: [{ family: 'Arial', sizes: [14, 16, 24], usage: 1.0 }],
        colors: [
          { hex: '#f39c12', rgb: [243, 156, 18], usage: 0.4, role: 'accent' }
        ],
        confidence: 0.90
      }
    },
    {
      id: `page-img-${Date.now()}-5`,
      documentId: `pdf-doc-${Date.now()}`,
      pageNumber: 5,
      imageDataUrl: generateMockPageImage(5),
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      type: 'pdf_page_image',
      category: 'document_page_image',
      x: Math.cos((4/5) * 2 * Math.PI) * 400,
      y: Math.sin((4/5) * 2 * Math.PI) * 400,
      z: 80,
      color: '#ffffff',
      label: '기대 효과',
      pageTitle: '기대 효과',
      isNew: true,
      metadata: {
        pageNumber: 5,
        title: '기대 효과 및 ROI',
        extractedText: '4. 기대 효과 ROI 150% 연간 50억원 절감 1년차 120% 2년차 180%',
        wordCount: 42,
        hasTitle: true,
        hasImages: true,
        hasTables: true,
        hasCharts: true,
        pageType: 'chart',
        keywords: ['ROI', '150%', '50억원', '절감', '기대효과'],
        summary: 'ROI 150% 달성과 연간 50억원 절감 효과 분석',
        fonts: [{ family: 'Arial', sizes: [16, 24, 36], usage: 1.0 }],
        colors: [
          { hex: '#e74c3c', rgb: [231, 76, 60], usage: 0.3, role: 'accent' },
          { hex: '#f39c12', rgb: [243, 156, 18], usage: 0.2, role: 'accent' },
          { hex: '#2ecc71', rgb: [46, 204, 113], usage: 0.2, role: 'accent' }
        ],
        confidence: 0.96
      }
    }
  ]
  
  // 🔥 AI 키워드 및 컨설팅 인사이트를 별도 노드로 생성
  const aiKeywordNodes: any[] = []
  const consultingInsightNodes: any[] = []
  
  // 각 페이지에서 AI 키워드 및 컨설팅 인사이트 노드 추출
  mockPageImages.forEach((page, pageIndex) => {
    const baseRadius = 700 + pageIndex * 100
    
    // AI 키워드 노드 생성
    page.metadata.aiKeywords?.forEach((keyword: string, keywordIndex: number) => {
      const angle = (pageIndex * 2 + keywordIndex * 0.5) * Math.PI / 3
      aiKeywordNodes.push({
        id: `ai-keyword-${Date.now()}-${pageIndex}-${keywordIndex}`,
        label: keyword,
        type: 'ai_keyword',
        category: 'ai_concept',
        x: Math.cos(angle) * baseRadius,
        y: Math.sin(angle) * baseRadius,
        z: 200 + keywordIndex * 40,
        color: '#e74c3c',
        size: 8,
        isNew: true,
        sourcePageId: page.id,
        confidence: 0.9 + Math.random() * 0.1,
        metadata: {
          keyword: keyword,
          category: 'AI Technology',
          relevance: 'High',
          extractedFrom: page.metadata.title
        }
      })
    })
    
    // 컨설팅 인사이트 노드 생성
    page.metadata.consultingInsights?.forEach((insight: string, insightIndex: number) => {
      const angle = (pageIndex * 2 + insightIndex * 0.7 + Math.PI) * Math.PI / 3
      consultingInsightNodes.push({
        id: `consulting-${Date.now()}-${pageIndex}-${insightIndex}`,
        label: insight,
        type: 'consulting_insight',
        category: 'business_insight',
        x: Math.cos(angle) * (baseRadius + 160),
        y: Math.sin(angle) * (baseRadius + 160),
        z: 160 + insightIndex * 50,
        color: '#f39c12',
        size: 10,
        isNew: true,
        sourcePageId: page.id,
        confidence: 0.85 + Math.random() * 0.1,
        metadata: {
          insight: insight,
          category: 'Business Strategy',
          impact: 'Medium',
          extractedFrom: page.metadata.title
        }
      })
    })
  })
  
  // 모든 노드 통합
  const allNodes = [...mockPageImages, ...aiKeywordNodes, ...consultingInsightNodes]
  
  // 페이지 간 관계 생성
  const relationships = []
  
  for (let i = 0; i < mockPageImages.length - 1; i++) {
    relationships.push({
      source: mockPageImages[i].id,
      target: mockPageImages[i + 1].id,
      type: 'next_page',
      strength: 1.0,
      evidence: '순차적 페이지'
    })
  }
  
  // 페이지와 AI 키워드 간 관계
  aiKeywordNodes.forEach(aiNode => {
    relationships.push({
      source: aiNode.sourcePageId,
      target: aiNode.id,
      type: 'contains_ai_concept',
      strength: 0.8,
      evidence: 'AI 개념 추출'
    })
  })
  
  // 페이지와 컨설팅 인사이트 간 관계
  consultingInsightNodes.forEach(consultingNode => {
    relationships.push({
      source: consultingNode.sourcePageId,
      target: consultingNode.id,
      type: 'generates_insight',
      strength: 0.7,
      evidence: '컨설팅 인사이트 도출'
    })
  })
  
  // 주제 연관 관계
  if (mockPageImages.length >= 3) {
    relationships.push({
      source: mockPageImages[1].id, // Agenda
      target: mockPageImages[2].id, // 제안 개요  
      type: 'leads_to',
      strength: 0.9,
      evidence: '아젠다 → 제안 개요 연결'
    })
  }
  
  const processingTime = Date.now() - startTime
  
  return {
    id: `pdf-doc-${Date.now()}`,
    filename: fileName,
    title: fileName.replace('.pdf', ''),
    totalPages: mockPageImages.length,
    pageImages: allNodes, // 페이지 + AI 키워드 + 컨설팅 인사이트 모든 노드
    pageRelationships: relationships,
    documentSummary: `삼성전자 DX SCM 생성형 AI 제안서: ${mockPageImages.length}개 페이지, ${aiKeywordNodes.length}개 AI 키워드, ${consultingInsightNodes.length}개 컨설팅 인사이트`,
    mainTopics: ['Gen AI', 'SCM', 'Multi Agent', 'NSCM', 'AI Orchestrator', 'Digital Transformation'],
    aiKeywordCount: aiKeywordNodes.length,
    consultingInsightCount: consultingInsightNodes.length,
    metadata: {
      fileSize,
      processingTime,
      createdDate: new Date().toISOString(),
      aiKeywordCount: aiKeywordNodes.length,
      consultingInsightCount: consultingInsightNodes.length
    }
  }
}

// Mock 페이지 이미지 생성 함수
function generateMockPageImage(pageNumber: number): string {
  // URL-encoded SVG 방식 사용 (btoa 없이 Cloudflare Workers에서 동작)
  const svgImages: Record<number, string> = {
    1: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
        <rect x="20" y="20" width="60" height="25" fill="#0066cc"/>
        <text x="50" y="37" fill="white" font-family="Arial" font-size="11" text-anchor="middle" font-weight="bold">PwC</text>
        <rect x="320" y="20" width="60" height="25" fill="#1f4e79"/>
        <text x="350" y="37" fill="white" font-family="Arial" font-size="8" text-anchor="middle">삼성전자</text>
        <text x="200" y="80" fill="#0066cc" font-family="Arial" font-size="14" text-anchor="middle" font-weight="bold">추가 Proposal</text>
        <text x="200" y="130" fill="#2c3e50" font-family="Arial" font-size="12" text-anchor="middle" font-weight="bold">삼성전자 DX SCM</text>
        <text x="200" y="150" fill="#2c3e50" font-family="Arial" font-size="12" text-anchor="middle" font-weight="bold">생성형 AI 기반 SCM 데이터 조회</text>
        <text x="200" y="170" fill="#2c3e50" font-family="Arial" font-size="12" text-anchor="middle" font-weight="bold">MVP 구축 Workflow</text>
        <text x="200" y="210" fill="#e74c3c" font-family="Arial" font-size="10" text-anchor="middle">Confidential</text>
        <text x="200" y="260" fill="#7f8c8d" font-family="Arial" font-size="12" text-anchor="middle">2025.2</text>
      </svg>
    `)}`,
    
    2: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
        <text x="200" y="40" fill="#0066cc" font-family="Arial" font-size="18" text-anchor="middle" font-weight="bold">Agenda</text>
        <line x1="50" y1="60" x2="350" y2="60" stroke="#0066cc" stroke-width="2"/>
        <circle cx="30" cy="90" r="4" fill="#2c3e50"/>
        <text x="50" y="95" fill="#2c3e50" font-family="Arial" font-size="14" font-weight="bold">I. 제안 개요</text>
        <circle cx="30" cy="130" r="4" fill="#2c3e50"/>
        <text x="50" y="135" fill="#2c3e50" font-family="Arial" font-size="14" font-weight="bold">II. 수행 범위</text>
        <circle cx="30" cy="170" r="4" fill="#2c3e50"/>
        <text x="50" y="175" fill="#2c3e50" font-family="Arial" font-size="14" font-weight="bold">III. 사업 관리</text>
        <circle cx="30" cy="210" r="4" fill="#2c3e50"/>
        <text x="50" y="215" fill="#2c3e50" font-family="Arial" font-size="14" font-weight="bold">IV. 제안사 소개</text>
        <rect x="300" y="250" width="80" height="30" fill="#0066cc" opacity="0.1"/>
        <text x="340" y="270" fill="#0066cc" font-family="Arial" font-size="10" text-anchor="middle">Structure</text>
      </svg>
    `)}`,
    
    3: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
        <text x="20" y="30" fill="#0066cc" font-family="Arial" font-size="12" font-weight="bold">I. 제안 개요</text>
        <text x="20" y="50" fill="#2c3e50" font-family="Arial" font-size="14" font-weight="bold">프로젝트 추진 목표</text>
        <rect x="20" y="60" width="360" height="50" fill="#e8f4f8" stroke="#0066cc" stroke-width="1"/>
        <text x="200" y="80" fill="#2c3e50" font-family="Arial" font-size="10" text-anchor="middle">Gen AI 기반 내/외부 데이터의 업무 활용을 극대화하여</text>
        <text x="200" y="95" fill="#2c3e50" font-family="Arial" font-size="10" text-anchor="middle">NSCM 시스템의 사용성 제고를 목표로 함</text>
        <rect x="50" y="130" width="80" height="40" fill="#2ecc71" rx="5"/>
        <text x="90" y="145" fill="white" font-family="Arial" font-size="8" text-anchor="middle">내부 정형</text>
        <text x="90" y="157" fill="white" font-family="Arial" font-size="8" text-anchor="middle">Data Agent</text>
        <rect x="160" y="130" width="80" height="40" fill="#e74c3c" rx="5"/>
        <text x="200" y="145" fill="white" font-family="Arial" font-size="8" text-anchor="middle">외부 비정형</text>
        <text x="200" y="157" fill="white" font-family="Arial" font-size="8" text-anchor="middle">Data Agent</text>
        <rect x="270" y="130" width="80" height="40" fill="#9b59b6" rx="5"/>
        <text x="310" y="145" fill="white" font-family="Arial" font-size="8" text-anchor="middle">SCM Workflow</text>
        <text x="310" y="157" fill="white" font-family="Arial" font-size="8" text-anchor="middle">업무 Agent</text>
        <rect x="120" y="200" width="160" height="30" fill="#f39c12" rx="5"/>
        <text x="200" y="218" fill="white" font-family="Arial" font-size="10" text-anchor="middle" font-weight="bold">SCM 통합 AI Orchestrator</text>
        <text x="200" y="250" fill="#7f8c8d" font-family="Arial" font-size="8" text-anchor="middle">Multi Agent System</text>
      </svg>
    `)}`,
    
    4: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
        <text x="20" y="40" fill="#2c3e50" font-family="Arial" font-size="16" font-weight="bold">3. 구현 계획</text>
        <line x1="50" y1="120" x2="350" y2="120" stroke="#f39c12" stroke-width="3"/>
        <circle cx="100" cy="120" r="8" fill="#f39c12"/>
        <circle cx="200" cy="120" r="8" fill="#f39c12"/>
        <circle cx="300" cy="120" r="8" fill="#f39c12"/>
        <text x="85" y="140" fill="#2c3e50" font-family="Arial" font-size="10">Phase 1</text>
        <text x="185" y="140" fill="#2c3e50" font-family="Arial" font-size="10">Phase 2</text>
        <text x="285" y="140" fill="#2c3e50" font-family="Arial" font-size="10">Phase 3</text>
        <text x="75" y="155" fill="#7f8c8d" font-family="Arial" font-size="8">1-3개월</text>
        <text x="175" y="155" fill="#7f8c8d" font-family="Arial" font-size="8">4-6개월</text>
        <text x="275" y="155" fill="#7f8c8d" font-family="Arial" font-size="8">7-9개월</text>
      </svg>
    `)}`,
    
    5: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
        <text x="20" y="40" fill="#2c3e50" font-family="Arial" font-size="16" font-weight="bold">4. 기대 효과</text>
        <rect x="50" y="140" width="40" height="60" fill="#e74c3c"/>
        <rect x="130" y="120" width="40" height="80" fill="#f39c12"/>
        <rect x="210" y="100" width="40" height="100" fill="#2ecc71"/>
        <text x="65" y="215" fill="#2c3e50" font-family="Arial" font-size="10" text-anchor="middle">1년차</text>
        <text x="145" y="215" fill="#2c3e50" font-family="Arial" font-size="10" text-anchor="middle">2년차</text>
        <text x="225" y="215" fill="#2c3e50" font-family="Arial" font-size="10" text-anchor="middle">3년차</text>
        <text x="280" y="80" fill="#2c3e50" font-family="Arial" font-size="14" font-weight="bold">ROI: 150%</text>
        <text x="280" y="100" fill="#2c3e50" font-family="Arial" font-size="12">연간 50억원 절감</text>
      </svg>
    `)}`
  }
  
  return svgImages[pageNumber] || svgImages[1]
}

// PDF 페이지별 처리 함수 (기존)
async function processPDFByPages(fileName: string, fileSize: number): Promise<any> {
  // PDFPageProcessor 시뮬레이션
  const startTime = Date.now()
  
  // Mock PDF 페이지 생성 (실제로는 PDFPageProcessor 사용)
  const mockPages = [
    {
      id: `page-${Date.now()}-1`,
      documentId: `pdf-doc-${Date.now()}`,
      documentTitle: fileName.replace('.pdf', ''),
      pageNumber: 1,
      title: '삼성DS 사업부 S&OP 최적화 프로젝트 제안서',
      content: 'Executive Summary 내용...',
      summary: '삼성 DS 사업부의 S&OP 프로세스 최적화를 통한 운영 효율성 증대 방안 제시',
      keywords: ['삼성', 'DS', 'S&OP', '최적화', 'Executive Summary'],
      images: [{ id: 'img-1-1', description: 'PwC 로고', type: 'logo' }],
      tables: [],
      type: 'pdf_page',
      category: 'document_page',
      x: Math.cos(0) * 200,
      y: Math.sin(0) * 200,
      z: 0,
      color: '#e74c3c',
      wordCount: 89,
      confidence: 0.9
    },
    {
      id: `page-${Date.now()}-2`,
      documentId: `pdf-doc-${Date.now()}`,
      documentTitle: fileName.replace('.pdf', ''),
      pageNumber: 2,
      title: '1. 현황 분석',
      content: 'AS-IS 프로세스 분석 및 벤치마킹...',
      summary: '현재 S&OP 프로세스의 한계점 분석 및 글로벌 벤치마킹 결과',
      keywords: ['현황분석', 'AS-IS', '벤치마킹', '한계점', '프로세스'],
      images: [{ id: 'img-2-1', description: 'AS-IS vs TO-BE 비교 차트', type: 'chart' }],
      tables: [{ id: 'table-2-1', headers: ['구분', 'AS-IS', 'TO-BE'], rows: [] }],
      type: 'pdf_page',
      category: 'document_page',
      x: Math.cos((1/5) * 2 * Math.PI) * 200,
      y: Math.sin((1/5) * 2 * Math.PI) * 200,
      z: 20,
      color: '#3498db',
      wordCount: 156,
      confidence: 0.9
    },
    {
      id: `page-${Date.now()}-3`,
      documentId: `pdf-doc-${Date.now()}`,
      documentTitle: fileName.replace('.pdf', ''),
      pageNumber: 3,
      title: '2. 제안 솔루션',
      content: 'AI 기반 수요 예측 모델 및 Palantir 플랫폼...',
      summary: 'AI 기반 수요 예측과 Palantir Foundry를 활용한 통합 플랫폼 솔루션',
      keywords: ['AI', '예측모델', 'Palantir', 'Foundry', '솔루션'],
      images: [{ id: 'img-3-1', description: 'AI 모델 아키텍처', type: 'diagram' }],
      tables: [],
      type: 'pdf_page',
      category: 'document_page',
      x: Math.cos((2/5) * 2 * Math.PI) * 200,
      y: Math.sin((2/5) * 2 * Math.PI) * 200,
      z: 40,
      color: '#2ecc71',
      wordCount: 134,
      confidence: 0.9
    },
    {
      id: `page-${Date.now()}-4`,
      documentId: `pdf-doc-${Date.now()}`,
      documentTitle: fileName.replace('.pdf', ''),
      pageNumber: 4,
      title: '3. 구현 계획 및 일정',
      content: '3단계 Phase별 구현 계획...',
      summary: '데이터 플랫폼 구축부터 전사 적용까지 3단계 구현 로드맵',
      keywords: ['구현계획', 'Phase', '일정', '로드맵', '적용'],
      images: [],
      tables: [{ id: 'table-4-1', headers: ['Phase', '기간', '주요활동'], rows: [] }],
      type: 'pdf_page',
      category: 'document_page',
      x: Math.cos((3/5) * 2 * Math.PI) * 200,
      y: Math.sin((3/5) * 2 * Math.PI) * 200,
      z: 60,
      color: '#f39c12',
      wordCount: 178,
      confidence: 0.9
    },
    {
      id: `page-${Date.now()}-5`,
      documentId: `pdf-doc-${Date.now()}`,
      documentTitle: fileName.replace('.pdf', ''),
      pageNumber: 5,
      title: '4. 기대 효과 및 ROI',
      content: '연간 50억원 비용 절감, ROI 150%...',
      summary: '정량적/정성적 효과 분석 및 3년간 ROI 150% 달성 계획',
      keywords: ['ROI', '비용절감', '50억원', '150%', '기대효과'],
      images: [{ id: 'img-5-1', description: 'ROI 추이 그래프', type: 'chart' }],
      tables: [{ id: 'table-5-1', headers: ['구분', '1년차', '2년차', '3년차'], rows: [] }],
      type: 'pdf_page',
      category: 'document_page',
      x: Math.cos((4/5) * 2 * Math.PI) * 200,
      y: Math.sin((4/5) * 2 * Math.PI) * 200,
      z: 80,
      color: '#9b59b6',
      wordCount: 145,
      confidence: 0.9
    }
  ]
  
  // 페이지 간 관계 생성
  const relationships = []
  
  // 순차적 관계
  for (let i = 0; i < mockPages.length - 1; i++) {
    relationships.push({
      source: mockPages[i].id,
      target: mockPages[i + 1].id,
      type: 'next_page',
      strength: 1.0,
      evidence: '순차적 페이지'
    })
  }
  
  // 주제 연관 관계
  relationships.push({
    source: mockPages[1].id, // 현황 분석
    target: mockPages[2].id, // 제안 솔루션  
    type: 'similar_topic',
    strength: 0.8,
    evidence: '현황 분석 → 솔루션 연결'
  })
  
  relationships.push({
    source: mockPages[2].id, // 제안 솔루션
    target: mockPages[4].id, // 기대 효과
    type: 'similar_topic',
    strength: 0.7,
    evidence: '솔루션 → 효과 연결'
  })
  
  const processingTime = Date.now() - startTime
  
  return {
    id: `pdf-doc-${Date.now()}`,
    filename: fileName,
    title: fileName.replace('.pdf', ''),
    totalPages: mockPages.length,
    pageNodes: mockPages,
    pageRelationships: relationships,
    documentSummary: `${mockPages.length}페이지 제안서: S&OP 최적화를 통한 연간 50억원 절감 및 ROI 150% 달성 계획`,
    mainTopics: ['S&OP', 'AI', 'Palantir', 'ROI', '최적화'],
    metadata: {
      fileSize,
      processingTime,
      createdDate: new Date().toISOString()
    }
  }
}

async function simulateOntologyUpdate(processedDoc: any): Promise<any> {
  // OntologyUpdateManager 시뮬레이션
  const autoApproved = processedDoc.extractedEntities
    .filter((e: any) => e.confidence >= 0.75)
    .map((e: any) => ({ type: 'entity', data: e }))
  
  const autoApprovedRels = processedDoc.extractedRelationships
    .filter((r: any) => r.confidence >= 0.75)
    .map((r: any) => ({ type: 'relationship', data: r }))
  
  const needsReview = [
    ...processedDoc.extractedEntities.filter((e: any) => e.confidence < 0.75 && e.confidence >= 0.5),
    ...processedDoc.extractedRelationships.filter((r: any) => r.confidence < 0.75 && r.confidence >= 0.5)
  ].map(item => ({ 
    type: item.source ? 'relationship' : 'entity', 
    data: item, 
    reason: `신뢰도 ${item.confidence.toFixed(2)} - 검토 필요` 
  }))
  
  return {
    autoApproved: [...autoApproved, ...autoApprovedRels],
    needsReview,
    rejected: []
  }
}

// Main application route
app.get('/', (c) => {
  return c.render(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div id="root"></div>
    </div>
  )
})

export default app
