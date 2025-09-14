import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  // Cloudflare 서비스 바인딩이 필요한 경우 여기 추가
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// 파일 업로드 API (Cloudflare에서는 FormData API 사용)
app.post('/api/documents/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const processingMode = formData.get('processingMode') as string
    
    console.log('📁 Cloudflare에서 파일 수신:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      processingMode
    })
    
    if (!file) {
      return c.json({ 
        success: false, 
        error: 'No file found in upload' 
      }, 400)
    }
    
    // Cloudflare에서는 파일을 ArrayBuffer로 읽기
    const fileBuffer = await file.arrayBuffer()
    console.log('📄 파일 데이터 읽기 완료:', fileBuffer.byteLength, 'bytes')
    
    // PDF 텍스트 추출 (pdf-parse는 Cloudflare에서 작동하지 않음)
    // 대신 실제 텍스트 기반 분석 또는 외부 API 호출 필요
    
    // 목업 응답 (실제로는 PDF 분석 로직 구현)
    const mockNodes = [
      {
        id: `pdf_page_1_${Date.now()}`,
        type: 'pdf_page',
        title: `${file.name} - 페이지 1`,
        content: `Cloudflare에서 성공적으로 처리된 파일: ${file.name}`,
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
        z: Math.random() * 400 - 200,
        color: '#4f46e5',
        isNew: true,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          uploadTime: new Date().toISOString(),
          processingMode
        }
      }
    ]
    
    return c.json({
      success: true,
      message: `파일 업로드 성공: ${file.name} (${file.size} bytes)`,
      newNodes: mockNodes,
      newLinks: [],
      processingMode,
      processedDocument: {
        filename: file.name,
        size: file.size,
        pages: 1,
        uploadTime: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Cloudflare 파일 업로드 오류:', error)
    return c.json({ 
      success: false, 
      error: `Upload failed: ${error.message}` 
    }, 500)
  }
})

// 기존 API 엔드포인트들
app.get('/api/ontology/nodes', (c) => {
  return c.json([])
})

app.get('/api/ontology/links', (c) => {
  return c.json([])
})

// 메인 HTML 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PwC 온톨로지 자동 구축 서비스 - Cloudflare</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/three@0.158.0/build/three.min.js"></script>
        <style>
          .control-panel {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 400px;
            max-height: 80vh;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 24px;
            z-index: 1000;
            overflow-y: auto;
          }
          
          .control-panel.collapsed {
            width: 60px;
            height: 60px;
            padding: 0;
            overflow: hidden;
          }
          
          #app {
            width: 100%;
            height: 100vh;
            position: relative;
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app