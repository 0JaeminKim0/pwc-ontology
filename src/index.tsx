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

// 고급 문서 업로드 및 자동 처리 API
app.post('/api/documents/upload', async (c) => {
  try {
    // 실제 구현에서는 multipart/form-data 파싱 필요
    const body = await c.req.json()
    const { fileName, fileContent, fileSize } = body
    
    // Mock 문서 처리 - DocumentProcessor 시뮬레이션
    const processedDoc = await simulateDocumentProcessing(fileName, fileContent)
    
    // 신뢰도 기준으로 자동 승인/검토 필요 분류
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
  } catch (error) {
    return c.json({ success: false, error: '문서 처리 중 오류 발생' }, 500)
  }
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
