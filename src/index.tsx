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

// Mock ontology data for initial development
app.get('/api/ontology/nodes', (c) => {
  const mockNodes = [
    { id: 'pwc', label: 'PwC', type: 'organization', x: 0, y: 0, z: 0, color: '#e74c3c' },
    { id: 'consulting', label: 'Consulting', type: 'service', x: 100, y: 0, z: 0, color: '#3498db' },
    { id: 'digital', label: 'Digital Services', type: 'capability', x: 200, y: 50, z: 0, color: '#2ecc71' },
    { id: 'analytics', label: 'Analytics', type: 'capability', x: 150, y: 100, z: 50, color: '#f39c12' },
    { id: 'ai', label: 'AI/ML', type: 'technology', x: 250, y: 150, z: 100, color: '#9b59b6' },
    { id: 'ontology', label: 'Ontology', type: 'deliverable', x: 300, y: 100, z: 50, color: '#e67e22' }
  ]
  
  return c.json(mockNodes)
})

app.get('/api/ontology/links', (c) => {
  const mockLinks = [
    { source: 'pwc', target: 'consulting', type: 'offers', strength: 1 },
    { source: 'consulting', target: 'digital', type: 'includes', strength: 0.8 },
    { source: 'digital', target: 'analytics', type: 'provides', strength: 0.9 },
    { source: 'analytics', target: 'ai', type: 'uses', strength: 0.7 },
    { source: 'ai', target: 'ontology', type: 'generates', strength: 0.6 }
  ]
  
  return c.json(mockLinks)
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

// Document upload API (mock)
app.post('/api/documents/upload', async (c) => {
  // In real implementation, this would process the uploaded document
  // For now, return mock response showing new nodes being added
  
  const mockNewNodes = [
    { id: 'blockchain', label: 'Blockchain', type: 'technology', x: 350, y: 200, z: 150, color: '#1abc9c', isNew: true },
    { id: 'supply-chain', label: 'Supply Chain', type: 'industry', x: 400, y: 150, z: 100, color: '#34495e', isNew: true }
  ]
  
  const mockNewLinks = [
    { source: 'digital', target: 'blockchain', type: 'implements', strength: 0.8 },
    { source: 'blockchain', target: 'supply-chain', type: 'optimizes', strength: 0.9 }
  ]
  
  return c.json({
    success: true,
    newNodes: mockNewNodes,
    newLinks: mockNewLinks,
    message: 'Document processed successfully. Added 2 new entities and 2 relationships.'
  })
})

// Main application route
app.get('/', (c) => {
  return c.render(
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div id="root"></div>
    </div>
  )
})

export default app
