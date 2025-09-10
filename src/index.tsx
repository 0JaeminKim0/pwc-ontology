import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Use renderer for HTML pages
app.use(renderer)

// API Routes
app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// PwC 시드 온톨로지 데이터
import { generateSeedOntology } from './data/pwc-taxonomy'

// 시드 온톨로지 생성
const { nodes: seedNodes, links: seedLinks } = generateSeedOntology()

// 런타임 온톨로지 상태 (추가 노드/링크 저장)
let runtimeNodes = [...seedNodes]
let runtimeLinks = [...seedLinks]

app.get('/api/ontology/nodes', (c) => {
  return c.json(runtimeNodes)
})

app.get('/api/ontology/links', (c) => {
  return c.json(runtimeLinks)
})

// 시드 온톨로지 리셋
app.post('/api/ontology/reset', (c) => {
  runtimeNodes = [...seedNodes]
  runtimeLinks = [...seedLinks]
  return c.json({ success: true, message: '시드 온톨로지로 리셋되었습니다.' })
})

// 온톨로지 상태 조회
app.get('/api/ontology/status', (c) => {
  return c.json({
    totalNodes: runtimeNodes.length,
    totalLinks: runtimeLinks.length,
    seedNodes: seedNodes.length,
    seedLinks: seedLinks.length,
    addedNodes: runtimeNodes.length - seedNodes.length,
    addedLinks: runtimeLinks.length - seedLinks.length,
    categories: {
      organization: runtimeNodes.filter(n => n.type === 'organization').length,
      industry: runtimeNodes.filter(n => n.type === 'industry').length,
      capability: runtimeNodes.filter(n => n.type === 'capability').length,
      technology: runtimeNodes.filter(n => n.type === 'technology').length,
      deliverable: runtimeNodes.filter(n => n.type === 'deliverable').length,
      kpi: runtimeNodes.filter(n => n.type === 'kpi').length
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

// 고급 문서 업로드 및 자동 처리 API (PDF 페이지 지원)
app.post('/api/documents/upload', async (c) => {
  try {
    const body = await c.req.json()
    const { fileName, fileContent, fileSize, processingMode = 'ontology' } = body
    
    // PDF 파일인지 확인
    const isPDF = fileName.toLowerCase().endsWith('.pdf')
    
    if (isPDF && processingMode === 'pages') {
      // PDF 페이지별 처리 모드
      const pdfResult = await processPDFByPages(fileName, fileSize)
      
      // PDF 페이지들을 그래프에 추가
      pdfResult.pageNodes.forEach(pageNode => {
        runtimeNodes.push(pageNode)
      })
      
      // 페이지 간 관계를 링크에 추가
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
    document: '#95a5a6'
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

// PDF 페이지별 처리 함수
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
