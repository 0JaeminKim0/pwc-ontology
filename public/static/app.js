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

    const onMouseUp = () => {
      isMouseDown = false;
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
        onUpload(file);
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
    
    // File Upload Section
    React.createElement('div', { className: 'mb-4' },
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
        React.createElement('i', { className: 'fas fa-upload mr-1' }),
        '문서 업로드'
      ),
      React.createElement('input', {
        type: 'file',
        onChange: handleFileUpload,
        accept: '.pdf,.docx,.pptx',
        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
      }),
      isUploading && React.createElement('div', { 
        className: 'mt-2 text-sm text-blue-600 flex items-center gap-2' 
      },
        React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
        '문서 처리 중...'
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

  const handleFileUpload = async (file) => {
    try {
      // Mock file upload processing
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add new nodes with animation
        const newNodes = [...nodes, ...result.newNodes];
        const newLinks = [...links, ...result.newLinks];
        
        setNodes(newNodes);
        setLinks(newLinks);
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Update insights with animation
        setTimeout(() => {
          setInsights([
            result.message,
            '새로운 블록체인 기술 엔터티 추가됨',
            '공급망 최적화 관계 발견',
            '지식 그래프 자동 확장 완료'
          ]);
        }, 500);
        
        // Update KPIs
        setKpis(prev => [
          { label: '매핑 정확도', value: '96%' },
          { label: '처리 시간', value: '1.9초' },
          { label: '자동 승인율', value: '91%' }
        ]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleGenerateSlides = () => {
    // Mock slide generation with visual feedback
    setInsights([
      '🎨 PwC 템플릿 생성 시작...',
      '📊 데이터 분석 및 시각화 준비',
      '📝 Executive Summary 작성 중',
      '🎯 핵심 인사이트 추출 완료',
      '✅ 5슬라이드 템플릿 생성 완료!'
    ]);

    // Simulate slide building animation
    setTimeout(() => {
      alert('🎉 PwC 템플릿이 성공적으로 생성되었습니다!\n\n포함된 내용:\n- Executive Summary\n- 현황 분석\n- 핵심 이슈\n- 제안 솔루션\n- 기대 효과\n\n모든 슬라이드에는 근거 문서 링크가 포함되어 있습니다.');
    }, 3000);
  };

  return React.createElement('div', { className: 'min-h-screen relative' },
    React.createElement(Graph3D, {
      nodes: nodes,
      links: links,
      onNodeClick: (node) => console.log('Node clicked:', node),
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
    })
  );
}

// Mount the app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));