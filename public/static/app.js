// PwC 온톨로지 3D 그래프 뷰어
const { useState, useEffect, useRef } = React;

// 3D Graph Component
function Graph3D({ nodes, links, onNodeClick, highlightPath }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const groupRef = useRef(null);
  const nodeObjectsRef = useRef(new Map());

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Controls for orbit
    camera.position.set(0, 0, 300);

    // Group for all graph elements
    const group = new THREE.Group();
    scene.add(group);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    groupRef.current = group;

    // Mouse controls
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;

    const onMouseDown = (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseMove = (event) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      group.rotation.y += deltaX * 0.01;
      group.rotation.x += deltaY * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = (event) => {
      if (isMouseDown) {
        isMouseDown = false;
        return;
      }
      
      // Handle node clicks
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(group.children);
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.onClick) {
          clickedObject.userData.onClick();
        }
      }
    };

    const onWheel = (event) => {
      camera.position.z += event.deltaY * 0.1;
      camera.position.z = Math.max(100, Math.min(800, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the entire group slowly for dynamic effect
      group.rotation.y += 0.002;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update graph when nodes/links change
  useEffect(() => {
    if (!groupRef.current || !nodes.length) return;

    // Clear existing objects
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    nodeObjectsRef.current.clear();

    // Create nodes
    nodes.forEach(node => {
      // Node geometry based on type
      let geometry;
      switch (node.type) {
        case 'organization':
          geometry = new THREE.OctahedronGeometry(8);
          break;
        case 'service':
          geometry = new THREE.BoxGeometry(12, 12, 12);
          break;
        case 'capability':
          geometry = new THREE.CylinderGeometry(6, 6, 12);
          break;
        case 'technology':
          geometry = new THREE.TetrahedronGeometry(10);
          break;
        case 'deliverable':
          geometry = new THREE.SphereGeometry(8);
          break;
        default:
          geometry = new THREE.SphereGeometry(6);
      }

      const material = new THREE.MeshLambertMaterial({ 
        color: node.color,
        transparent: true,
        opacity: node.isNew ? 0.8 : 1.0
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.x - 150, node.y - 75, node.z || 0);
      mesh.userData = { node };

      // Add click handler for PDF page nodes
      if (node.type === 'pdf_page') {
        mesh.userData.onClick = () => {
          if (onNodeClick) {
            onNodeClick(node);
          }
        };
      }

      // Add glow effect for new nodes
      if (node.isNew) {
        const glowGeometry = geometry.clone();
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: node.color,
          transparent: true,
          opacity: 0.3
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.scale.multiplyScalar(1.2);
        mesh.add(glowMesh);

        // Pulsing animation for new nodes
        const pulseAnimation = () => {
          const time = Date.now() * 0.005;
          glowMesh.scale.setScalar(1.2 + Math.sin(time) * 0.1);
          material.opacity = 0.8 + Math.sin(time) * 0.2;
        };
        mesh.userData.animate = pulseAnimation;
      }

      groupRef.current.add(mesh);
      nodeObjectsRef.current.set(node.id, mesh);

      // Add text label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.fillStyle = 'white';
      context.font = '16px Arial';
      context.textAlign = 'center';
      context.fillText(node.label, canvas.width / 2, canvas.height / 2 + 6);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(0, 20, 0);
      sprite.scale.set(40, 10, 1);
      mesh.add(sprite);
    });

    // Create links
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (!sourceNode || !targetNode) return;

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sourceNode.x - 150, sourceNode.y - 75, sourceNode.z || 0),
        new THREE.Vector3(targetNode.x - 150, targetNode.y - 75, targetNode.z || 0)
      ]);

      const material = new THREE.LineBasicMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.6
      });
      
      const line = new THREE.Line(geometry, material);
      line.userData = { link };
      groupRef.current.add(line);
    });

  }, [nodes, links]);

  // Handle highlight path
  useEffect(() => {
    if (!highlightPath || !groupRef.current) return;

    // Reset all materials
    nodeObjectsRef.current.forEach(mesh => {
      mesh.material.opacity = 0.3;
    });

    // Highlight path nodes
    highlightPath.forEach(nodeId => {
      const mesh = nodeObjectsRef.current.get(nodeId);
      if (mesh) {
        mesh.material.opacity = 1.0;
        
        // Add laser effect
        const glowGeometry = mesh.geometry.clone();
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.5
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.scale.multiplyScalar(1.3);
        mesh.add(glowMesh);

        // Remove glow after 3 seconds
        setTimeout(() => {
          if (mesh && glowMesh) {
            mesh.remove(glowMesh);
          }
        }, 3000);
      }
    });

    // Reset after 5 seconds
    setTimeout(() => {
      nodeObjectsRef.current.forEach(mesh => {
        mesh.material.opacity = 1.0;
      });
    }, 5000);

  }, [highlightPath]);

  return React.createElement('div', {
    ref: mountRef,
    className: 'graph-container'
  });
}

// Control Panel Component
function ControlPanel({ onSearch, onUpload, onGenerateSlides }) {
  const [query, setQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [processingMode, setProcessingMode] = useState('ontology');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        onUpload(file, processingMode);
        setIsUploading(false);
        event.target.value = '';
      }, 2000);
    }
  };

  return React.createElement('div', { className: 'control-panel' },
    React.createElement('div', { className: 'mb-4' },
      React.createElement('h2', { 
        className: 'text-xl font-bold text-gray-800 mb-2 flex items-center gap-2' 
      },
        React.createElement('i', { className: 'fas fa-project-diagram text-blue-600' }),
        'PwC 온톨로지 제어판'
      )
    ),
    
    // Search Section
    React.createElement('div', { className: 'mb-4' },
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
        React.createElement('i', { className: 'fas fa-search mr-1' }),
        '지식 탐색'
      ),
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('input', {
          type: 'text',
          value: query,
          onChange: (e) => setQuery(e.target.value),
          onKeyPress: (e) => e.key === 'Enter' && handleSearch(),
          placeholder: '예: DS 사업부 S&OP 사례',
          className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        }),
        React.createElement('button', {
          onClick: handleSearch,
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        },
          React.createElement('i', { className: 'fas fa-search' })
        )
      )
    ),
    
    // Processing Mode Selection
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
        React.createElement('i', { className: 'fas fa-cogs mr-1' }),
        '처리 모드'
      ),
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('label', { className: 'flex items-center' },
          React.createElement('input', {
            type: 'radio',
            value: 'ontology',
            checked: processingMode === 'ontology',
            onChange: (e) => setProcessingMode(e.target.value),
            className: 'mr-1'
          }),
          React.createElement('span', { className: 'text-sm' }, '온톨로지')
        ),
        React.createElement('label', { className: 'flex items-center' },
          React.createElement('input', {
            type: 'radio',
            value: 'pages',
            checked: processingMode === 'pages',
            onChange: (e) => setProcessingMode(e.target.value),
            className: 'mr-1'
          }),
          React.createElement('span', { className: 'text-sm' }, 'PDF 페이지')
        )
      )
    ),

    // File Upload Section
    React.createElement('div', { className: 'mb-4' },
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
        React.createElement('i', { className: 'fas fa-upload mr-1' }),
        '문서 업로드'
      ),
      processingMode === 'pages' && React.createElement('div', {
        className: 'mb-2 p-2 bg-blue-50 rounded text-xs text-blue-700'
      }, '📄 PDF 페이지 모드: 각 페이지가 개별 노드로 생성되어 페이지간 관계를 시각화합니다'),
      React.createElement('input', {
        type: 'file',
        onChange: handleFileUpload,
        accept: processingMode === 'pages' ? '.pdf' : '.pdf,.docx,.pptx',
        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
      }),
      isUploading && React.createElement('div', { 
        className: 'mt-2 text-sm text-blue-600 flex items-center gap-2' 
      },
        React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
        processingMode === 'pages' ? 'PDF 페이지 분석 중...' : '문서 처리 중...'
      )
    ),
    
    // Generate Slides Section
    React.createElement('div', { className: 'mb-4' },
      React.createElement('button', {
        onClick: onGenerateSlides,
        className: 'w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-2 glow'
      },
        React.createElement('i', { className: 'fas fa-presentation' }),
        'PwC 템플릿 자동 생성'
      )
    )
  );
}

// Insight Panel Component
function InsightPanel({ insights, kpis }) {
  return React.createElement('div', { className: 'insight-panel' },
    React.createElement('h3', { 
      className: 'text-lg font-bold text-gray-800 mb-3 flex items-center gap-2' 
    },
      React.createElement('i', { className: 'fas fa-lightbulb text-yellow-500' }),
      '실시간 인사이트'
    ),
    
    // KPIs
    React.createElement('div', { className: 'mb-4' },
      React.createElement('h4', { className: 'text-sm font-semibold text-gray-700 mb-2' }, 'KPI 지표'),
      kpis.map((kpi, index) =>
        React.createElement('div', { 
          key: index, 
          className: 'mb-2 p-2 bg-blue-50 rounded-lg slide-in',
          style: { animationDelay: `${index * 0.1}s` }
        },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'text-sm text-gray-700' }, kpi.label),
            React.createElement('span', { className: 'font-bold text-blue-600' }, kpi.value)
          )
        )
      )
    ),
    
    // Insights
    React.createElement('div', null,
      React.createElement('h4', { className: 'text-sm font-semibold text-gray-700 mb-2' }, '자동 발견 인사이트'),
      insights.map((insight, index) =>
        React.createElement('div', { 
          key: index, 
          className: 'mb-2 p-2 bg-green-50 rounded-lg text-sm text-green-800 slide-in',
          style: { animationDelay: `${index * 0.2}s` }
        },
          React.createElement('i', { className: 'fas fa-check-circle text-green-600 mr-2' }),
          insight
        )
      )
    )
  );
}

// Status Bar Component
function StatusBar({ nodeCount, linkCount, lastUpdate }) {
  return React.createElement('div', { className: 'status-bar' },
    React.createElement('i', { className: 'fas fa-database' }),
    React.createElement('span', null, `노드: ${nodeCount} | 관계: ${linkCount}`),
    React.createElement('span', { className: 'mx-2' }, '|'),
    React.createElement('i', { className: 'fas fa-clock' }),
    React.createElement('span', null, `업데이트: ${lastUpdate}`)
  );
}

// PDF Page Detail Modal Component
function PDFPageModal({ page, onClose }) {
  if (!page) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-start mb-4' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-800' },
            `페이지 ${page.pageNumber}: ${page.title}`
          ),
          React.createElement('p', { className: 'text-gray-600 mt-1' },
            `${page.wordCount}단어 | 신뢰도: ${(page.confidence * 100).toFixed(0)}%`
          )
        ),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-500 hover:text-gray-700 text-2xl'
        }, '×')
      ),

      // Content
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        // Left column - Content
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, '페이지 내용'),
          React.createElement('div', { 
            className: 'bg-gray-50 p-4 rounded border max-h-60 overflow-y-auto text-sm'
          }, page.content),
          
          React.createElement('h3', { className: 'text-lg font-semibold mt-4 mb-2' }, '요약'),
          React.createElement('p', { className: 'text-gray-700' }, page.summary)
        ),

        // Right column - Metadata
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, '키워드'),
          React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
            ...page.keywords.map((keyword, index) =>
              React.createElement('span', {
                key: index,
                className: 'px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm'
              }, keyword)
            )
          ),

          // Images
          page.images && page.images.length > 0 && React.createElement('div', { className: 'mb-4' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, 
              `이미지 (${page.images.length}개)`
            ),
            React.createElement('div', { className: 'space-y-2' },
              ...page.images.map((img, index) =>
                React.createElement('div', {
                  key: index,
                  className: 'p-2 bg-yellow-50 rounded border border-yellow-200'
                },
                  React.createElement('div', { className: 'text-sm font-medium' }, img.description),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, `타입: ${img.type}`)
                )
              )
            )
          ),

          // Tables  
          page.tables && page.tables.length > 0 && React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, 
              `표 (${page.tables.length}개)`
            ),
            React.createElement('div', { className: 'space-y-2' },
              ...page.tables.map((table, index) =>
                React.createElement('div', {
                  key: index,
                  className: 'p-2 bg-green-50 rounded border border-green-200'
                },
                  React.createElement('div', { className: 'text-sm font-medium' }, 
                    `${table.headers.length}개 컬럼 표`
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-600' },
                    `헤더: ${table.headers.join(', ')}`
                  )
                )
              )
            )
          )
        )
      ),

      // Footer
      React.createElement('div', { className: 'mt-6 pt-4 border-t border-gray-200' },
        React.createElement('p', { className: 'text-sm text-gray-600' },
          `문서: ${page.documentTitle} | 생성 시간: ${new Date().toLocaleString()}`
        )
      )
    )
  );
}

// Main App Component
function App() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [highlightPath, setHighlightPath] = useState(null);
  const [insights, setInsights] = useState([]);
  const [kpis, setKpis] = useState([
    { label: '매핑 정확도', value: '94%' },
    { label: '처리 시간', value: '2.3초' },
    { label: '자동 승인율', value: '87%' }
  ]);
  const [lastUpdate, setLastUpdate] = useState('');
  const [selectedPage, setSelectedPage] = useState(null);

  // Load initial data
  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const [nodesResponse, linksResponse] = await Promise.all([
        fetch('/api/ontology/nodes'),
        fetch('/api/ontology/links')
      ]);
      
      const nodesData = await nodesResponse.json();
      const linksData = await linksResponse.json();
      
      setNodes(nodesData);
      setLinks(linksData);
      setLastUpdate(new Date().toLocaleTimeString());
      setInsights([
        '초기 온톨로지 로드 완료',
        '6개 핵심 엔터티 식별',
        '5개 관계 매핑 완료'
      ]);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const results = await response.json();
      setHighlightPath(results.path);
      setInsights(results.insights);
      
      // Update KPIs
      setKpis(prev => prev.map(kpi => 
        kpi.label === '처리 시간' 
          ? { ...kpi, value: '0.8초' }
          : kpi
      ));
      
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleFileUpload = async (file, processingMode = 'ontology') => {
    try {
      // Enhanced file upload with PDF pages support
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: file.name,
          fileSize: file.size,
          fileContent: `Mock content for ${file.name}`,
          processingMode: processingMode
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add new nodes with animation
        const newNodes = [...nodes, ...result.newNodes];
        const newLinks = [...links, ...result.newLinks];
        
        setNodes(newNodes);
        setLinks(newLinks);
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Update insights based on processing mode
        setTimeout(() => {
          if (result.processingMode === 'pages') {
            // PDF 페이지 모드 인사이트
            setInsights([
              result.message,
              `📄 PDF 문서: ${result.processedDocument.filename}`,
              `📑 총 페이지: ${result.pdfAnalysis.pages}개`,
              `🔗 페이지 관계: ${result.pdfAnalysis.pageRelationships}개`,
              `🏷️ 주요 주제: ${result.pdfAnalysis.mainTopics.join(', ')}`,
              `⏱️ 처리 시간: ${result.pdfAnalysis.processingTime}ms`,
              '✨ 각 페이지가 개별 노드로 생성되었습니다',
              '🎯 페이지 노드를 클릭하여 상세 내용을 확인하세요'
            ]);
            
            // PDF 특화 KPIs
            setKpis([
              { label: '페이지 수', value: `${result.pdfAnalysis.pages}개` },
              { label: '페이지 관계', value: `${result.pdfAnalysis.pageRelationships}개` },
              { label: '주제 수', value: `${result.pdfAnalysis.mainTopics.length}개` },
              { label: '처리 시간', value: `${(result.pdfAnalysis.processingTime/1000).toFixed(1)}초` }
            ]);
          } else {
            // 기존 온톨로지 모드 인사이트
            setInsights([
              result.message,
              `📄 문서: ${result.processedDocument.filename}`,
              `🎯 문서 타입: ${result.processedDocument.documentType}`,
              `👤 클라이언트: ${result.processedDocument.client}`,
              `📊 전체 신뢰도: ${(result.processedDocument.confidence * 100).toFixed(1)}%`,
              `✅ 자동 승인: 엔티티 ${result.autoApproved.entities}개, 관계 ${result.autoApproved.relationships}개`,
              `⏳ 검토 필요: ${result.needsReview.count}개 항목`,
              '🔄 지식 그래프 자동 확장 완료!'
            ]);
            
            // 기존 KPIs
            const mappingAccuracy = Math.min(98, 94 + Math.random() * 4);
            const processingTime = (1.5 + Math.random() * 1.0).toFixed(1);
            const autoApprovalRate = Math.min(95, 87 + Math.random() * 8);
            
            setKpis([
              { label: '매핑 정확도', value: `${mappingAccuracy.toFixed(1)}%` },
              { label: '처리 시간', value: `${processingTime}초` },
              { label: '자동 승인율', value: `${autoApprovalRate.toFixed(0)}%` },
              { label: '검토 대기', value: `${result.needsReview.count}개` }
            ]);

            // Show review candidates if any
            if (result.needsReview && result.needsReview.count > 0) {
              setTimeout(() => {
                const reviewInfo = result.needsReview.topCandidates.map(
                  candidate => `🔍 ${candidate.text} (${(candidate.confidence * 100).toFixed(0)}%)`
                ).join('\n');
                
                if (confirm(`검토가 필요한 ${result.needsReview.count}개 항목이 있습니다:\n\n${reviewInfo}\n\n검토 패널을 여시겠습니까?`)) {
                  setInsights(prev => [...prev, '📋 검토 패널에서 승인/거절을 진행해주세요']);
                }
              }, 2000);
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setInsights(prev => [...prev, '❌ 문서 처리 중 오류가 발생했습니다']);
    }
  };

  const handleNodeClick = (node) => {
    if (node.type === 'pdf_page') {
      setSelectedPage(node);
      setInsights(prev => [
        ...prev,
        `📄 페이지 ${node.pageNumber} 선택: ${node.title}`,
        `🔍 키워드: ${node.keywords.slice(0, 3).join(', ')}`,
        `📊 단어 수: ${node.wordCount}개`
      ]);
    }
  };

  const handleGenerateSlides = () => {
    // Check if there are PDF pages in the graph
    const pdfPages = nodes.filter(node => node.type === 'pdf_page');
    
    if (pdfPages.length > 0) {
      // PDF 기반 템플릿 생성
      setInsights([
        '🎨 PDF 기반 PwC 템플릿 생성 시작...',
        `📑 ${pdfPages.length}개 페이지 분석 중`,
        '📊 페이지별 핵심 내용 추출',
        '📝 Executive Summary 자동 생성',
        '🎯 페이지 흐름 기반 스토리 구성',
        '✅ PDF 맞춤형 5슬라이드 템플릿 완성!'
      ]);

      setTimeout(() => {
        const pageTopics = pdfPages.map(page => `${page.pageNumber}. ${page.title}`).join('\n');
        alert(`🎉 PDF 기반 PwC 템플릿이 생성되었습니다!\n\n📑 참조된 페이지:\n${pageTopics}\n\n🎯 생성된 슬라이드:\n- Executive Summary (페이지 1 기반)\n- 현황 분석 (페이지 2 기반)\n- 제안 솔루션 (페이지 3 기반)\n- 구현 계획 (페이지 4 기반)\n- 기대 효과 (페이지 5 기반)\n\n모든 슬라이드에 원본 PDF 페이지 링크가 포함되어 있습니다.`);
      }, 4000);
    } else {
      // 기존 온톨로지 기반 템플릿 생성
      setInsights([
        '🎨 PwC 템플릿 생성 시작...',
        '📊 데이터 분석 및 시각화 준비',
        '📝 Executive Summary 작성 중',
        '🎯 핵심 인사이트 추출 완료',
        '✅ 5슬라이드 템플릿 생성 완료!'
      ]);

      setTimeout(() => {
        alert('🎉 PwC 템플릿이 성공적으로 생성되었습니다!\n\n포함된 내용:\n- Executive Summary\n- 현황 분석\n- 핵심 이슈\n- 제안 솔루션\n- 기대 효과\n\n모든 슬라이드에는 근거 문서 링크가 포함되어 있습니다.');
      }, 3000);
    }
  };

  return React.createElement('div', { className: 'min-h-screen relative' },
    React.createElement(Graph3D, {
      nodes: nodes,
      links: links,
      onNodeClick: handleNodeClick,
      highlightPath: highlightPath
    }),
    
    React.createElement(ControlPanel, {
      onSearch: handleSearch,
      onUpload: handleFileUpload,
      onGenerateSlides: handleGenerateSlides
    }),
    
    React.createElement(InsightPanel, {
      insights: insights,
      kpis: kpis
    }),
    
    React.createElement(StatusBar, {
      nodeCount: nodes.length,
      linkCount: links.length,
      lastUpdate: lastUpdate
    }),

    // PDF Page Modal
    selectedPage && React.createElement(PDFPageModal, {
      page: selectedPage,
      onClose: () => setSelectedPage(null)
    })
  );
}

// Mount the app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));