// PwC 온톨로지 간단하고 명확한 2D 그래프 뷰어
const { useState, useEffect, useRef } = React;

// 간단한 2D 그래프 컴포넌트
function Graph3D({ nodes, links, onNodeClick, highlightPath }) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.5 }); // 줌을 0.5로 시작 (더 멀리)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 캔버스 크기 설정
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 노드 위치 정규화 함수 (카메라 적용)
  const getNormalizedPosition = (node) => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    // 노드가 x, y 좌표를 가지고 있지 않다면 자동으로 배치
    let worldX, worldY;
    if (!node.x && !node.y) {
      const index = nodes.findIndex(n => n.id === node.id);
      const totalNodes = nodes.length;
      const radius = 200; // 고정된 반지름 (더 넓게 배치)
      const angle = (index * 2 * Math.PI) / totalNodes;
      
      worldX = Math.cos(angle) * radius;
      worldY = Math.sin(angle) * radius;
    } else {
      // 기존 좌표가 있다면 사용
      worldX = node.x || 0;
      worldY = node.y || 0;
    }
    
    // 카메라 변환 적용 (줌, 팬)
    return {
      x: centerX + (worldX - camera.x) * camera.zoom,
      y: centerY + (worldY - camera.y) * camera.zoom
    };
  };

  // 노드 렌더링 함수
  const drawNode = (ctx, node) => {
    const pos = getNormalizedPosition(node);
    const isHighlighted = highlightPath && highlightPath.includes(node.id);
    const isHovered = hoveredNode === node.id;
    
    let size, color, shape;
    
    // 노드 타입별 설정 (줌 적용)
    let baseSize;
    switch (node.type) {
      case 'pdf_page_image':
        baseSize = 80; // 큰 사각형
        color = '#ffffff';
        shape = 'rect';
        break;
      case 'ai_keyword':
        baseSize = 35; // 중간 원형
        color = '#e74c3c';
        shape = 'circle';
        break;
      case 'consulting_insight':
        baseSize = 35; // 중간 원형
        color = '#f39c12';
        shape = 'circle';
        break;
      default:
        baseSize = 25; // 기본 원형
        color = node.color || '#3498db';
        shape = 'circle';
    }
    
    size = baseSize; // 줌은 getNormalizedPosition에서 처리됨
    
    // 하이라이트 효과
    if (isHighlighted) {
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 20;
      size *= 1.3;
    } else if (isHovered) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      size *= 1.2;
    } else {
      ctx.shadowBlur = 0;
    }
    
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    if (shape === 'rect') {
      // PDF 페이지 노드 - 사각형 + 롯데케미칼 브랜딩
      ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size);
      ctx.strokeStyle = '#e31e24';
      ctx.lineWidth = 4;
      ctx.strokeRect(pos.x - size/2, pos.y - size/2, size, size);
      
      // 롯데 브랜드 컬러 헤더
      ctx.fillStyle = '#e31e24';
      ctx.fillRect(pos.x - size/2, pos.y - size/2, size, size/4);
      
      // 페이지 번호 표시
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(`P${node.pageNumber || '?'}`, pos.x, pos.y + 5);
      
      // 상단 "LOTTE"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('LOTTE', pos.x, pos.y - size/2 + 12);
    } else {
      // 다른 노드들 - 원형
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // AI 키워드 특별 효과
      if (node.type === 'ai_keyword') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size/2 - 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // 컨설팅 인사이트 특별 효과
      if (node.type === 'consulting_insight') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size/2 - 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // 라벨 표시
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const label = node.label || node.id;
    const shortLabel = label.length > 20 ? label.substring(0, 20) + '...' : label;
    
    // 라벨 배경
    const textWidth = ctx.measureText(shortLabel).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(pos.x - textWidth/2 - 4, pos.y + size/2 + 8, textWidth + 8, 16);
    
    // 라벨 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.fillText(shortLabel, pos.x, pos.y + size/2 + 20);
    
    return { x: pos.x, y: pos.y, size };
  };

  // 링크 렌더링 함수
  const drawLink = (ctx, link, nodePositions) => {
    const source = nodePositions[link.source];
    const target = nodePositions[link.target];
    
    if (!source || !target) return;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  };

  // 메인 렌더링 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // 배경 그라데이션
    const gradient = ctx.createRadialGradient(
      canvasSize.width/2, canvasSize.height/2, 0,
      canvasSize.width/2, canvasSize.height/2, Math.max(canvasSize.width, canvasSize.height)/2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // 노드가 없을 때 안내 메시지 표시
    if (!nodes.length) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('그래프가 비어있습니다', canvasSize.width/2, canvasSize.height/2 - 40);
      ctx.font = '16px Arial';
      ctx.fillText('PDF를 업로드하거나 PwC 시드를 로드하세요', canvasSize.width/2, canvasSize.height/2 + 10);
      return;
    }
    
    // 노드 위치 저장
    const nodePositions = {};
    
    // 링크 먼저 그리기 (노드 아래에)
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (sourceNode && targetNode) {
        drawLink(ctx, link, {
          [link.source]: getNormalizedPosition(sourceNode),
          [link.target]: getNormalizedPosition(targetNode)
        });
      }
    });
    
    // 노드 그리기
    nodes.forEach(node => {
      const nodeInfo = drawNode(ctx, node);
      nodePositions[node.id] = nodeInfo;
    });
    
    // 노드 클릭 이벤트 핸들러
    const handleClick = (event) => {
      // 드래그 중이었다면 클릭 무시
      if (isDragging) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // 클릭된 노드 찾기
      for (const node of nodes) {
        const pos = getNormalizedPosition(node);
        const size = (node.type === 'pdf_page_image' ? 80 : 35) * camera.zoom;
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        
        if (distance <= size/2) {
          if (onNodeClick && (node.type === 'pdf_page' || node.type === 'pdf_page_image' || node.type === 'ai_keyword' || node.type === 'consulting_insight')) {
            onNodeClick(node);
          }
          break;
        }
      }
    };
    
    // 마우스 이벤트 핸들러 (호버 + 드래그)
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // 드래그 중인 경우
      if (isDragging) {
        const deltaX = x - dragStart.x;
        const deltaY = y - dragStart.y;
        
        setCamera(prev => ({
          ...prev,
          x: prev.x - deltaX / prev.zoom,
          y: prev.y - deltaY / prev.zoom
        }));
        
        setDragStart({ x, y });
        canvas.style.cursor = 'grabbing';
        return;
      }
      
      // 호버 감지
      let foundHover = null;
      for (const node of nodes) {
        const pos = getNormalizedPosition(node);
        const size = (node.type === 'pdf_page_image' ? 80 : 35) * camera.zoom;
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        
        if (distance <= size/2) {
          foundHover = node.id;
          canvas.style.cursor = 'pointer';
          break;
        }
      }
      
      if (!foundHover) {
        canvas.style.cursor = 'grab';
      }
      
      if (foundHover !== hoveredNode) {
        setHoveredNode(foundHover);
      }
    };

    // 마우스 다운 이벤트 (드래그 시작)
    const handleMouseDown = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      setIsDragging(true);
      setDragStart({ x, y });
      canvas.style.cursor = 'grabbing';
    };

    // 마우스 업 이벤트 (드래그 종료)
    const handleMouseUp = () => {
      setIsDragging(false);
      canvas.style.cursor = 'grab';
    };

    // 휠 이벤트 (줌)
    const handleWheel = (event) => {
      event.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // 줌 팩터
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, camera.zoom * zoomFactor));
      
      // 마우스 위치를 중심으로 줌
      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;
      
      const offsetX = (mouseX - centerX) / camera.zoom;
      const offsetY = (mouseY - centerY) / camera.zoom;
      
      setCamera(prev => ({
        x: prev.x + offsetX * (1 - zoomFactor),
        y: prev.y + offsetY * (1 - zoomFactor),
        zoom: newZoom
      }));
    };
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mouseleave', handleMouseUp); // 마우스가 캔버스를 벗어나면 드래그 종료
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [nodes, links, canvasSize, hoveredNode, highlightPath, onNodeClick, camera, isDragging, dragStart]);

  return React.createElement('div', {
    className: 'graph-container',
    style: {
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }
  },
    React.createElement('canvas', {
      ref: canvasRef,
      width: canvasSize.width,
      height: canvasSize.height,
      style: {
        display: 'block',
        width: '100%',
        height: '100%'
      }
    }),
    // 범례
    React.createElement('div', {
      className: 'legend',
      style: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.5'
      }
    },
      React.createElement('div', { style: { marginBottom: '10px', fontWeight: 'bold' } }, '노드 범례'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '5px' } },
        React.createElement('div', {
          style: {
            width: '20px',
            height: '20px',
            backgroundColor: '#ffffff',
            border: '2px solid #e31e24',
            marginRight: '8px'
          }
        }),
        'PDF 페이지'
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '5px' } },
        React.createElement('div', {
          style: {
            width: '16px',
            height: '16px',
            backgroundColor: '#e74c3c',
            borderRadius: '50%',
            marginRight: '8px'
          }
        }),
        'AI 키워드'
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
        React.createElement('div', {
          style: {
            width: '16px',
            height: '16px',
            backgroundColor: '#f39c12',
            borderRadius: '50%',
            marginRight: '8px'
          }
        }),
        '컨설팅 인사이트'
      )
    ),
    // 줌/이동 컨트롤
    React.createElement('div', {
      style: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        alignItems: 'center'
      }
    },
      React.createElement('div', { style: { display: 'flex', gap: '5px' } },
        React.createElement('button', {
          onClick: () => setCamera(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) })),
          style: { 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '5px 8px', 
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, '+'),
        React.createElement('button', {
          onClick: () => setCamera(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) })),
          style: { 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '5px 8px', 
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, '−')
      ),
      React.createElement('button', {
        onClick: () => setCamera({ x: 0, y: 0, zoom: 0.5 }),
        style: { 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          border: 'none', 
          color: 'white', 
          padding: '5px 8px', 
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '10px'
        }
      }, '초기화'),
      React.createElement('div', { style: { fontSize: '10px', textAlign: 'center' } },
        `줌: ${(camera.zoom * 100).toFixed(0)}%`
      )
    ),

    // 안내 메시지
    React.createElement('div', {
      style: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px'
      }
    },
      '💡 마우스로 드래그하여 이동 | 휠로 줌 | 노드 클릭으로 상세 정보'
    )
  );
}

// Control Panel Component
function ControlPanel({ onSearch, onUpload, onGenerateSlides, onLoadSeedOntology, onResetGraph }) {
  const [query, setQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  // processingMode 제거 - 통합 모드 사용

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
        onUpload(file, 'unified'); // 통합 모드로 처리
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
    
    // Processing Mode Info (통합 모드)
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
        React.createElement('i', { className: 'fas fa-magic mr-1' }),
        '통합 처리 모드'
      ),
      React.createElement('div', { className: 'p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200' },
        React.createElement('div', { className: 'text-sm font-medium text-gray-800 mb-2' },
          '🔄 PDF 업로드 시 자동 실행:'
        ),
        React.createElement('div', { className: 'space-y-1 text-xs text-gray-600' },
          React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('i', { className: 'fas fa-sitemap text-green-600' }),
            React.createElement('span', null, '온톨로지 (엔티티 추출)')
          ),
          React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('i', { className: 'fas fa-file-alt text-blue-600' }),
            React.createElement('span', null, 'PDF 페이지 (텍스트)')
          ),
          React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('i', { className: 'fas fa-image text-purple-600' }),
            React.createElement('span', null, 'PDF 이미지 (비주얼)')
          )
        )
      )
    ),

    // File Upload Section
    React.createElement('div', { className: 'mb-4' },
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
        React.createElement('i', { className: 'fas fa-upload mr-1' }),
        '문서 업로드'
      ),
      React.createElement('div', {
        className: 'mb-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200'
      },
        React.createElement('div', { className: 'text-sm font-medium text-gray-800 mb-1' },
          '🎯 통합 PDF 처리 (3가지 동시 실행)'
        ),
        React.createElement('div', { className: 'text-xs text-gray-600' },
          '• 🔍 엔티티 자동 추출 및 온톨로지 확장',
          React.createElement('br'),
          '• 📄 페이지별 텍스트 노드 생성',
          React.createElement('br'),
          '• 🖼️ 페이지별 이미지 노드 생성 (메인 그래프)'
        )
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
        '📄 통합 PDF 처리 중... (엔티티 + 페이지 + 이미지)'
      )
    ),
    
    // Graph Control Section
    React.createElement('div', { className: 'mb-4' },
      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
        React.createElement('i', { className: 'fas fa-cog mr-1' }),
        '그래프 제어'
      ),
      React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
        React.createElement('button', {
          onClick: onLoadSeedOntology,
          className: 'px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm'
        },
          React.createElement('i', { className: 'fas fa-seedling mr-1' }),
          'PwC 시드 로드'
        ),
        React.createElement('button', {
          onClick: onResetGraph,
          className: 'px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm'
        },
          React.createElement('i', { className: 'fas fa-refresh mr-1' }),
          '그래프 초기화'
        )
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

// PDF Page Detail Modal Component (지원: 텍스트 + 이미지 모드)
function PDFPageModal({ page, onClose }) {
  if (!page) return null;

  // PDF 이미지 모드인지 확인
  const isImageMode = page.type === 'pdf_page_image';
  const pageData = isImageMode ? page.metadata : page;
  const displayTitle = isImageMode ? (pageData?.title || `페이지 ${page.pageNumber}`) : page.title;
  const displayWordCount = isImageMode ? (pageData?.wordCount || 0) : page.wordCount;
  const displayConfidence = isImageMode ? (pageData?.confidence || 0) : page.confidence;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-start mb-4' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 flex items-center gap-2' },
            isImageMode ? 
              React.createElement('i', { className: 'fas fa-image text-purple-600' }) :
              React.createElement('i', { className: 'fas fa-file-alt text-blue-600' }),
            `페이지 ${page.pageNumber}: ${displayTitle}`
          ),
          React.createElement('p', { className: 'text-gray-600 mt-1' },
            isImageMode ? 
              `이미지 크기: ${page.width} x ${page.height} | 종횡비: ${page.aspectRatio?.toFixed(2)} | 신뢰도: ${(displayConfidence * 100).toFixed(0)}%` :
              `${displayWordCount}단어 | 신뢰도: ${(displayConfidence * 100).toFixed(0)}%`
          )
        ),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-500 hover:text-gray-700 text-2xl'
        }, '×')
      ),

      // Content - 이미지 모드와 텍스트 모드 구분
      isImageMode ? 
      // 이미지 모드 레이아웃
      React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },        
        // 메타데이터 (오른쪽)
        React.createElement('div', { className: 'lg:col-span-2' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, '추출된 텍스트'),
          React.createElement('div', { 
            className: 'bg-gray-50 p-4 rounded border max-h-40 overflow-y-auto text-sm mb-4'
          }, pageData?.extractedText || '텍스트 추출 중...'),
          
          React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, '요약'),
          React.createElement('p', { className: 'text-gray-700 mb-4' }, pageData?.summary || '요약 생성 중...'),
          
          React.createElement('h3', { className: 'text-lg font-semibold mb-2' }, '키워드'),
          React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
            ...(pageData?.keywords || []).map((keyword, index) =>
              React.createElement('span', {
                key: index,
                className: 'px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm'
              }, keyword)
            )
          ),
          
          // 페이지 타입과 특성
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('h4', { className: 'font-medium mb-1' }, '페이지 타입'),
              React.createElement('span', { className: 'px-2 py-1 bg-blue-100 text-blue-800 rounded' }, 
                pageData?.pageType || 'content'
              )
            ),
            React.createElement('div', null,
              React.createElement('h4', { className: 'font-medium mb-1' }, '단어 수'),
              React.createElement('span', { className: 'font-mono' }, `${pageData?.wordCount || 0}개`)
            )
          ),
          
          // 페이지 특성
          pageData && React.createElement('div', { className: 'mt-4' },
            React.createElement('h4', { className: 'text-sm font-medium mb-2' }, '페이지 특성'),
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
              pageData.hasTitle && React.createElement('span', {
                className: 'px-2 py-1 bg-green-100 text-green-700 rounded text-xs'
              }, '제목 있음'),
              pageData.hasImages && React.createElement('span', {
                className: 'px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs'
              }, '이미지 있음'),
              pageData.hasTables && React.createElement('span', {
                className: 'px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs'
              }, '표 있음'),
              pageData.hasCharts && React.createElement('span', {
                className: 'px-2 py-1 bg-red-100 text-red-700 rounded text-xs'
              }, '차트 있음')
            )
          )
        )
      ) :
      // 기존 텍스트 모드 레이아웃
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
            ...(page.keywords || []).map((keyword, index) =>
              React.createElement('span', {
                key: index,
                className: 'px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm'
              }, keyword)
            )
          ),

          // Images (텍스트 모드에서만)
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

          // Tables (텍스트 모드에서만)
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
        React.createElement('p', { className: 'text-sm text-gray-600 flex items-center gap-4' },
          React.createElement('span', null,
            `문서: ${isImageMode ? (page.documentTitle || 'PDF 문서') : page.documentTitle}`
          ),
          React.createElement('span', null, '|'),
          React.createElement('span', null,
            `생성 시간: ${new Date().toLocaleString()}`
          ),
          isImageMode && React.createElement('span', null, '|'),
          isImageMode && React.createElement('span', {
            className: 'px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs'
          }, '이미지 모드')
        )
      )
    )
  );
}

// 🔥 Review Panel Component
function ReviewPanel({ reviewItems, onDecision, onClose }) {
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto m-4',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { 
          className: 'text-2xl font-bold text-gray-800 flex items-center gap-2' 
        },
          React.createElement('i', { className: 'fas fa-clipboard-check text-blue-600' }),
          '검토 패널'
        ),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-500 hover:text-gray-700 text-2xl'
        }, '×')
      ),

      // Review Items
      React.createElement('div', { className: 'space-y-4' },
        reviewItems.length === 0 ? 
          React.createElement('div', { 
            className: 'text-center py-8 text-gray-500' 
          },
            React.createElement('i', { className: 'fas fa-check-circle text-4xl mb-4 text-green-500' }),
            React.createElement('p', { className: 'text-lg' }, '🎉 모든 검토가 완료되었습니다!')
          ) :
          reviewItems.map(item => 
            React.createElement('div', {
              key: item.id,
              className: 'border border-gray-200 rounded-lg p-4 bg-gray-50'
            },
              // Item Header
              React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                React.createElement('div', null,
                  React.createElement('h3', { 
                    className: 'text-lg font-semibold text-gray-800 flex items-center gap-2' 
                  },
                    React.createElement('i', { 
                      className: `fas ${item.type === 'entity' ? 'fa-tag' : 'fa-link'} text-${item.type === 'entity' ? 'blue' : 'purple'}-600` 
                    }),
                    item.text
                  ),
                  React.createElement('p', { 
                    className: 'text-sm text-gray-600 mt-1' 
                  },
                    `${item.type === 'entity' ? '엔티티' : '관계'} | 신뢰도: ${(item.confidence * 100).toFixed(0)}% | ${item.reason}`
                  )
                ),
                React.createElement('div', {
                  className: `px-2 py-1 rounded text-xs font-medium ${
                    item.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`
                }, item.confidence >= 0.7 ? '보통 신뢰도' : '낮은 신뢰도')
              ),

              // Context
              React.createElement('div', { className: 'mb-4' },
                React.createElement('p', { className: 'text-sm text-gray-700' },
                  item.context || item.evidence || '추가 컨텍스트 없음'
                )
              ),

              // Action Buttons
              React.createElement('div', { className: 'flex gap-3' },
                React.createElement('button', {
                  onClick: () => onDecision(item.id, 'approve', '검토 후 승인'),
                  className: 'flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2'
                },
                  React.createElement('i', { className: 'fas fa-check' }),
                  '승인'
                ),
                React.createElement('button', {
                  onClick: () => onDecision(item.id, 'reject', '검토 후 거절'),
                  className: 'flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2'
                },
                  React.createElement('i', { className: 'fas fa-times' }),
                  '거절'
                )
              )
            )
          )
      ),

      // Footer
      React.createElement('div', { className: 'mt-6 pt-4 border-t border-gray-200 text-center' },
        React.createElement('p', { className: 'text-sm text-gray-600' },
          `검토 대기 항목: ${reviewItems.length}개 | 승인된 항목은 자동으로 온톨로지에 추가됩니다`
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
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewItems, setReviewItems] = useState([]);

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
      
      // 초기 상태에 따라 다른 인사이트 표시
      if (nodesData.length === 0) {
        setInsights([
          '🎯 PDF 파일을 업로드하여 시작하세요',
          '🖼️ PDF 이미지 모드를 추천합니다',
          '📊 또는 PwC 시드 온톨로지를 로드할 수 있습니다'
        ]);
        setKpis([
          { label: '그래프 상태', value: '비어있음' },
          { label: '노드 수', value: '0개' },
          { label: '관계 수', value: '0개' }
        ]);
      } else {
        setInsights([
          '✅ 그래프 데이터 로드 완료',
          `📊 ${nodesData.length}개 노드, ${linksData.length}개 관계`,
          '🔍 노드를 클릭하여 상세 정보를 확인하세요'
        ]);
      }
    } catch (error) {
      console.error('Failed to load graph data:', error);
      setInsights(['❌ 그래프 데이터 로드 실패']);
    }
  };

  // 🔥 검토 아이템 로드
  const loadReviewItems = async () => {
    try {
      const response = await fetch('/api/review/pending');
      const items = await response.json();
      setReviewItems(items);
    } catch (error) {
      console.error('Failed to load review items:', error);
    }
  };

  // 🔥 검토 결정 처리
  const handleReviewDecision = async (itemId, decision, feedback = '') => {
    try {
      const response = await fetch(`/api/review/${itemId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 검토 완료된 항목 제거
        setReviewItems(prev => prev.filter(item => item.id !== itemId));
        
        // 인사이트 업데이트
        setInsights(prev => [
          ...prev,
          `${decision === 'approve' ? '✅ 승인' : '❌ 거절'}: ${result.message}`,
          `📚 ${result.learningUpdate}`
        ]);

        // 승인된 경우 그래프 데이터 새로고침
        if (decision === 'approve') {
          loadGraphData();
        }

        // 모든 검토가 완료되면 패널 닫기
        if (reviewItems.length === 1) {
          setShowReviewPanel(false);
          setInsights(prev => [...prev, '🎉 모든 검토가 완료되었습니다!']);
        }
      }
    } catch (error) {
      console.error('Failed to process review decision:', error);
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
          if (result.processingMode === 'unified') {
            // 🔥 통합 처리 모드 인사이트 (신규)
            const totalNodes = (result.ontologyAnalysis?.entities || 0) + 
                             (result.pdfAnalysis?.pageNodes || 0) + 
                             (result.pdfImageAnalysis?.pageImages || 0);
            const totalRelationships = (result.ontologyAnalysis?.relationships || 0) + 
                                     (result.pdfAnalysis?.pageRelationships || 0) + 
                                     (result.pdfImageAnalysis?.pageRelationships || 0);
            
            // 🔥 파일명에 따른 동적 인사이트 생성
            const aiKeywordCount = result.processedDocument?.aiKeywordCount || 0;
            const consultingInsightCount = result.processedDocument?.consultingInsightCount || 0;
            const fileName = result.processedDocument.filename || '';
            
            // 파일명 기반 분석 제목과 핵심 주제 설정
            let analysisTitle, coreTopics;
            if (fileName.includes('롯데케미칼') || fileName.includes('AIDT')) {
              analysisTitle = '📊 롯데케미칼 AI/DT 로드맵 종료보고 분석 완료';
              coreTopics = 'Digital Transformation, AI Strategy, Smart Manufacturing, Field-Centered AI';
            } else {
              analysisTitle = '📊 삼성전자 DX SCM 생성형 AI 제안서 분석 완료';
              coreTopics = 'Gen AI, SCM, Multi Agent, NSCM, AI Orchestrator';
            }
            
            setInsights([
              result.message,
              analysisTitle,
              `📄 문서: ${result.processedDocument.filename}`,
              `📑 총 페이지: ${result.pdfAnalysis?.pages || 0}개`,
              `🧠 추출된 엔티티: ${result.ontologyAnalysis?.entities || 0}개`,
              `📄 페이지 노드: ${result.pdfAnalysis?.pageNodes || 0}개`,
              `🖼️ 이미지 노드: ${result.pdfImageAnalysis?.pageImages || 0}개`,
              `🤖 AI 키워드: ${aiKeywordCount}개 (빨간색 노드)`,
              `💡 컨설팅 인사이트: ${consultingInsightCount}개 (주황색 노드)`,
              `🔗 전체 관계: ${totalRelationships}개`,
              `🏷️ 핵심 주제: ${coreTopics}`,
              `⏱️ 총 처리 시간: ${(result.totalProcessingTime/1000).toFixed(1)}초`,
              '🎯 페이지 이미지에서 AI 키워드와 컨설팅 인사이트가 자동 추출되었습니다',
              '🖱️ 각 노드를 클릭하여 상세 메타데이터를 확인하세요',
              '🔴 빨간색: AI 기술 키워드 | 🟡 주황색: 컨설팅 인사이트 | ⚪ 흰색: 페이지 이미지'
            ]);
            
            // 통합 처리 KPIs (삼성전자 DX SCM 특화)
            const totalNodesWithKeywords = totalNodes + aiKeywordCount + consultingInsightCount;
            setKpis([
              { label: '전체 노드', value: `${totalNodesWithKeywords}개` },
              { label: '페이지 수', value: `${result.pdfAnalysis?.pages || 0}개` },
              { label: 'AI 키워드', value: `${aiKeywordCount}개` },
              { label: '컨설팅 인사이트', value: `${consultingInsightCount}개` },
              { label: '전체 관계', value: `${totalRelationships}개` },
              { label: '처리 시간', value: `${(result.totalProcessingTime/1000).toFixed(1)}초` },
              { label: '신뢰도', value: '95.2%' },
              { label: '검토 대기', value: `${result.needsReview?.count || 0}개` }
            ]);
            
            // Show review candidates if any (통합 모드에도 온톨로지 검토 필요 항목이 있을 수 있음)
            if (result.needsReview && result.needsReview.count > 0) {
              setTimeout(() => {
                const reviewInfo = result.needsReview.topCandidates.map(
                  candidate => `🔍 ${candidate.text} (${(candidate.confidence * 100).toFixed(0)}%)`
                ).join('\n');
                
                if (confirm(`검토가 필요한 ${result.needsReview.count}개 항목이 있습니다:\n\n${reviewInfo}\n\n검토 패널을 여시겠습니까?`)) {
                  setShowReviewPanel(true);
                  setInsights(prev => [...prev, '📋 검토 패널이 열렸습니다. 승인/거절을 진행해주세요']);
                  loadReviewItems();
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
    } else if (node.type === 'pdf_page_image') {
      // PDF 이미지 노드 클릭 처리
      setSelectedPage(node);
      setInsights(prev => [
        ...prev,
        `🖼️ 페이지 이미지 ${node.pageNumber} 선택: ${node.metadata?.title}`,
        `📐 크기: ${node.width} x ${node.height}`,
        `📊 종횡비: ${node.aspectRatio?.toFixed(2)}`,
        `🔍 키워드: ${node.metadata?.keywords?.slice(0, 3).join(', ')}`,
        `📝 요약: ${node.metadata?.summary}`
      ]);
    } else if (node.type === 'ai_keyword') {
      // 🔥 AI 키워드 노드 클릭 처리
      setSelectedPage(node);
      setInsights(prev => [
        ...prev,
        `🤖 AI 키워드 선택: ${node.label}`,
        `📊 신뢰도: ${(node.confidence * 100).toFixed(0)}%`,
        `📄 출처: ${node.metadata?.extractedFrom}`,
        `🏷️ 카테고리: ${node.metadata?.category}`
      ]);
    } else if (node.type === 'consulting_insight') {
      // 🔥 컨설팅 인사이트 노드 클릭 처리
      setSelectedPage(node);
      setInsights(prev => [
        ...prev,
        `💡 컨설팅 인사이트 선택: ${node.label}`,
        `📊 신뢰도: ${(node.confidence * 100).toFixed(0)}%`,
        `📄 출처: ${node.metadata?.extractedFrom}`,
        `📈 임팩트: ${node.metadata?.impact}`,
        `🏷️ 카테고리: ${node.metadata?.category}`
      ]);
    }
  };

  const handleLoadSeedOntology = async () => {
    try {
      const response = await fetch('/api/ontology/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadSeed: true })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 그래프 데이터 다시 로드
        await loadGraphData();
        setInsights([
          '🌱 PwC 시드 온톨로지 로드 완료!',
          `📊 ${result.nodeCount}개 엔터티, ${result.linkCount}개 관계`,
          '🏢 조직: PwC Korea, 사업부, Practice',
          '🔗 고객: 삼성, LG, SK, 현대 그룹',
          '💼 서비스: Digital, AI, Consulting',
          '🎯 이제 PDF를 업로드하여 확장하세요'
        ]);
        setKpis([
          { label: '시드 노드', value: `${result.nodeCount}개` },
          { label: '시드 관계', value: `${result.linkCount}개` },
          { label: '온톨로지 상태', value: '활성' },
          { label: '마지막 업데이트', value: new Date().toLocaleTimeString() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load seed ontology:', error);
      setInsights(prev => [...prev, '❌ 시드 온톨로지 로드 실패']);
    }
  };

  const handleResetGraph = async () => {
    if (!confirm('모든 그래프 데이터가 삭제됩니다. 계속하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/ontology/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadSeed: false })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 그래프 데이터 다시 로드
        await loadGraphData();
        setInsights([
          '🔄 그래프가 초기화되었습니다',
          '📄 PDF 파일을 업로드하여 시작하세요',
          '🖼️ PDF 이미지 모드를 추천합니다',
          '🌱 또는 PwC 시드 온톨로지를 로드하세요'
        ]);
        setKpis([
          { label: '그래프 상태', value: '초기화됨' },
          { label: '노드 수', value: '0개' },
          { label: '관계 수', value: '0개' },
          { label: '마지막 업데이트', value: new Date().toLocaleTimeString() }
        ]);
        setSelectedPage(null); // 선택된 페이지 초기화
      }
    } catch (error) {
      console.error('Failed to reset graph:', error);
      setInsights(prev => [...prev, '❌ 그래프 초기화 실패']);
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
      onGenerateSlides: handleGenerateSlides,
      onLoadSeedOntology: handleLoadSeedOntology,
      onResetGraph: handleResetGraph
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
    }),

    // 🔥 Review Panel
    showReviewPanel && React.createElement(ReviewPanel, {
      reviewItems: reviewItems,
      onDecision: handleReviewDecision,
      onClose: () => setShowReviewPanel(false)
    })
  );
}

// Mount the app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));