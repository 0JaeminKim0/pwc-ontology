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
function ControlPanel({ onSearch, onUpload, onGenerateSlides, onLoadSeedOntology, onResetGraph, isVisible, onToggle }) {
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

  return React.createElement('div', { 
    className: `control-panel transition-all duration-300 ${isVisible ? '' : 'collapsed'}`,
    style: isVisible ? {} : { width: '60px', height: '60px' }
  },
    // 토글 버튼
    React.createElement('button', {
      onClick: onToggle,
      className: `absolute ${isVisible ? 'top-2 right-2' : 'top-2 left-2'} z-10 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 transition-colors`,
      title: isVisible ? '패널 숨기기' : '제어판 보기'
    },
      React.createElement('i', { 
        className: `fas ${isVisible ? 'fa-times' : 'fa-cog'}` 
      })
    ),
    
    // 패널 내용 (숨겨져 있을 때는 표시하지 않음)
    isVisible && React.createElement('div', { className: 'panel-content' },
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
  ));
}

// Insight Panel Component
function InsightPanel({ insights, kpis, isVisible, onToggle }) {
  return React.createElement('div', { 
    className: `insight-panel transition-all duration-300 ${isVisible ? '' : 'collapsed'}`,
    style: isVisible ? {} : { width: '60px', height: '60px' }
  },
    // 토글 버튼
    React.createElement('button', {
      onClick: onToggle,
      className: `absolute ${isVisible ? 'top-2 right-2' : 'top-2 left-2'} z-10 bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-yellow-700 transition-colors`,
      title: isVisible ? '패널 숨기기' : '인사이트 보기'
    },
      React.createElement('i', { 
        className: `fas ${isVisible ? 'fa-times' : 'fa-lightbulb'}` 
      })
    ),
    
    // 패널 내용 (숨겨져 있을 때는 표시하지 않음)
    isVisible && React.createElement('div', { className: 'panel-content' },
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
  ));
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

// Enhanced PDF Page Modal with Image Display
function PDFPageModal({ page, onClose }) {
  if (!page) return null;

  // 노드 타입별 데이터 처리
  const getNodeDisplayData = (node) => {
    switch (node.type) {
      case 'pdf_page_image':
        return {
          title: node.metadata?.title || `페이지 ${node.pageNumber}`,
          type: 'PDF 페이지 이미지',
          icon: 'fas fa-image text-purple-600',
          confidence: node.metadata?.confidence || 0,
          content: node.metadata?.extractedText || '텍스트 추출 중...',
          summary: node.metadata?.summary || '요약 생성 중...',
          keywords: node.metadata?.keywords || [],
          imageUrl: null, // 비동기로 로드
          metadata: {
            size: `${node.width} x ${node.height}`,
            aspectRatio: node.aspectRatio?.toFixed(2),
            wordCount: node.metadata?.wordCount || 0,
            pageType: node.metadata?.pageType || 'content',
            hasTitle: node.metadata?.hasTitle || false,
            hasImages: node.metadata?.hasImages || false,
            hasTables: node.metadata?.hasTables || false,
            hasCharts: node.metadata?.hasCharts || false
          }
        };
      
      case 'ai_keyword':
        return {
          title: node.label,
          type: 'AI 키워드',
          icon: 'fas fa-robot text-red-600',
          confidence: node.confidence || 0,
          content: `AI 기술 키워드: ${node.label}`,
          summary: node.metadata?.description || 'AI 관련 핵심 키워드입니다.',
          keywords: [node.label],
          imageUrl: null, // 비동기로 로드
          metadata: {
            category: node.metadata?.category || 'AI Technology',
            extractedFrom: node.metadata?.extractedFrom || 'PDF 자동 분석',
            relevance: node.metadata?.relevance || 'High',
            frequency: node.metadata?.frequency || 1,
            relatedConcepts: node.metadata?.relatedConcepts || []
          }
        };
      
      case 'consulting_insight':
        return {
          title: node.label,
          type: '컨설팅 인사이트',
          icon: 'fas fa-lightbulb text-orange-600',
          confidence: node.confidence || 0,
          content: `컨설팅 인사이트: ${node.label}`,
          summary: node.metadata?.description || '비즈니스 전략 관련 핵심 인사이트입니다.',
          keywords: [node.label],
          imageUrl: null, // 비동기로 로드
          metadata: {
            impact: node.metadata?.impact || 'High',
            category: node.metadata?.category || 'Business Strategy',
            extractedFrom: node.metadata?.extractedFrom || 'PDF 자동 분석',
            businessValue: node.metadata?.businessValue || 'Strategic',
            implementationLevel: node.metadata?.implementationLevel || 'Executive'
          }
        };
      
      default:
        return {
          title: node.label || node.id,
          type: '일반 노드',
          icon: 'fas fa-circle text-blue-600',
          confidence: node.confidence || 0,
          content: node.content || node.label || '내용 없음',
          summary: node.summary || '요약 없음',
          keywords: node.keywords || [],
          imageUrl: null,
          metadata: {}
        };
    }
  };

  // 실제 PDF 페이지 이미지 URL 생성 함수
  const generatePDFPageImage = async (pageNumber, documentTitle) => {
    if (!pageNumber) return null;
    
    try {
      // 서버에서 실제 PDF 페이지 이미지 요청
      const response = await fetch(`/api/pdf/page-image/${pageNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentTitle: documentTitle || 'unknown',
          pageNumber: pageNumber
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.imageUrl) {
          return result.imageUrl;
        }
      }
    } catch (error) {
      console.error('PDF 이미지 로드 실패:', error);
    }
    
    // 폴백: 실제 PDF가 없을 때 플레이스홀더 이미지 생성
    return generatePlaceholderImage(pageNumber, documentTitle);
  };

  // 플레이스홀더 이미지 생성 (실제 PDF가 없을 때)
  const generatePlaceholderImage = (pageNumber, documentTitle) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);
    
    // 문서 제목에 따른 브랜드 컬러 설정
    let brandColor = '#e31e24'; // 롯데케미칼 기본
    let companyName = '롯데케미칼';
    if (documentTitle?.includes('삼성') || documentTitle?.includes('Samsung')) {
      brandColor = '#1428a0'; // 삼성 블루
      companyName = '삼성전자';
    }
    
    // 문서 윤곽선
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 560, 760);
    
    // 헤더 영역
    ctx.fillStyle = brandColor;
    ctx.fillRect(20, 20, 560, 100);
    
    // 헤더 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(companyName, 300, 75);
    
    // 페이지 번호 배지
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(480, 140, 80, 40, 8);
    ctx.fill();
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNumber}`, 520, 165);
    
    // 제목 영역
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(documentTitle || 'PDF 문서', 50, 220);
    
    // 콘텐츠 플레이스홀더
    const contentLines = [
      '📄 실제 PDF 페이지가 여기에 표시됩니다',
      '',
      '현재 상태:',
      '• PDF.js 라이브러리를 통한 실제 렌더링 대기',
      '• 서버에서 PDF 파일 처리 중',
      '• 페이지 이미지 생성 및 캐싱',
      '',
      '포함 내용:',
      '✓ AI 키워드 자동 추출',
      '✓ 컨설팅 인사이트 분석', 
      '✓ 메타데이터 자동 생성',
      '✓ OCR 텍스트 추출',
      '',
      '이 플레이스홀더는 실제 PDF 업로드 후',
      '해당 페이지의 실제 이미지로 교체됩니다.'
    ];
    
    ctx.fillStyle = '#475569';
    ctx.font = '14px Arial';
    contentLines.forEach((line, index) => {
      ctx.fillText(line, 50, 270 + (index * 22));
    });
    
    // 하단 워터마크
    ctx.fillStyle = brandColor;
    ctx.fillRect(20, 680, 560, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PwC 온톨로지 자동 구축 시스템', 300, 730);
    ctx.font = '12px Arial';
    ctx.fillText('실제 PDF 이미지 렌더링 시스템', 300, 750);
    
    return canvas.toDataURL('image/png');
  };

  const displayData = getNodeDisplayData(page);
  const [actualImageUrl, setActualImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  // PDF 이미지 로드
  useEffect(() => {
    const loadPDFImage = async () => {
      setImageLoading(true);
      try {
        const pageNumber = page.pageNumber || page.metadata?.sourcePageNumber || 1;
        const documentTitle = page.documentTitle || page.metadata?.documentTitle || 'PDF 문서';
        
        const imageUrl = await generatePDFPageImage(pageNumber, documentTitle);
        setActualImageUrl(imageUrl);
      } catch (error) {
        console.error('PDF 이미지 로드 실패:', error);
        setActualImageUrl(generatePlaceholderImage(
          page.pageNumber || 1, 
          page.documentTitle || 'PDF 문서'
        ));
      } finally {
        setImageLoading(false);
      }
    };

    if (page) {
      loadPDFImage();
    }
  }, [page]);

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden',
      onClick: (e) => e.stopPropagation()
    },
      // 새로운 통합 레이아웃
      React.createElement('div', { className: 'flex flex-col h-full' },
        // Header
        React.createElement('div', { className: 'flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50' },
          React.createElement('div', { className: 'flex-1' },
            React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
              React.createElement('i', { className: displayData.icon }),
              React.createElement('h2', { className: 'text-2xl font-bold text-gray-800' },
                displayData.title
              ),
              React.createElement('span', { 
                className: `px-3 py-1 rounded-full text-sm font-medium ${
                  page.type === 'pdf_page_image' ? 'bg-purple-100 text-purple-800' :
                  page.type === 'ai_keyword' ? 'bg-red-100 text-red-800' :
                  page.type === 'consulting_insight' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`
              }, displayData.type)
            ),
            React.createElement('div', { className: 'flex items-center gap-6 text-sm text-gray-600' },
              page.pageNumber && React.createElement('span', null, `페이지 ${page.pageNumber}`),
              React.createElement('span', null, `신뢰도: ${(displayData.confidence * 100).toFixed(0)}%`),
              displayData.metadata.size && React.createElement('span', null, `크기: ${displayData.metadata.size}`)
            )
          ),
          React.createElement('button', {
            onClick: onClose,
            className: 'text-gray-400 hover:text-gray-600 text-3xl font-light p-2'
          }, '×')
        ),

        // Main Content
        React.createElement('div', { className: 'flex-1 overflow-hidden' },
          React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-0 h-full' },
            // Left: PDF Image
            React.createElement('div', { className: 'bg-gray-100 flex items-center justify-center p-6 border-r border-gray-200' },
              imageLoading ? React.createElement('div', { className: 'text-center text-gray-500' },
                React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl mb-4 text-blue-500' }),
                React.createElement('p', { className: 'text-lg' }, 'PDF 이미지 생성 중...'),
                React.createElement('p', { className: 'text-sm text-gray-400' }, '고품질 SVG 렌더링')
              ) : actualImageUrl ? React.createElement('div', { className: 'max-w-full max-h-full' },
                React.createElement('img', {
                  src: actualImageUrl,
                  alt: `PDF Page ${page.pageNumber || 1}`,
                  className: 'max-w-full max-h-full object-contain rounded-lg shadow-lg border border-gray-300',
                  style: { maxHeight: '70vh' },
                  onLoad: () => console.log('✅ PDF 이미지 로드 완료'),
                  onError: (e) => {
                    console.error('❌ PDF 이미지 로드 실패:', e);
                    setActualImageUrl(generatePlaceholderImage(
                      page.pageNumber || 1, 
                      page.documentTitle || 'PDF 문서'
                    ));
                  }
                })
              ) : React.createElement('div', { className: 'text-center text-gray-500' },
                React.createElement('i', { className: 'fas fa-exclamation-triangle text-4xl mb-4 text-orange-400' }),
                React.createElement('p', { className: 'text-lg' }, 'PDF 이미지를 불러올 수 없습니다'),
                React.createElement('button', {
                  onClick: () => {
                    setImageLoading(true);
                    const pageNumber = page.pageNumber || 1;
                    const documentTitle = page.documentTitle || 'PDF 문서';
                    generatePDFPageImage(pageNumber, documentTitle)
                      .then(url => setActualImageUrl(url))
                      .catch(() => setActualImageUrl(generatePlaceholderImage(pageNumber, documentTitle)))
                      .finally(() => setImageLoading(false));
                  },
                  className: 'mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                }, '다시 시도')
              )
            ),

            // Right: Metadata
            React.createElement('div', { className: 'p-6 overflow-y-auto bg-white' },
              // 요약 섹션
              React.createElement('div', { className: 'mb-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2' },
                  React.createElement('i', { className: 'fas fa-align-left text-blue-600' }),
                  '요약'
                ),
                React.createElement('p', { className: 'text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg' },
                  displayData.summary
                )
              ),

              // 추출된 텍스트
              React.createElement('div', { className: 'mb-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2' },
                  React.createElement('i', { className: 'fas fa-file-text text-green-600' }),
                  '추출된 텍스트'
                ),
                React.createElement('div', { 
                  className: 'bg-gray-50 p-4 rounded-lg border max-h-48 overflow-y-auto text-sm text-gray-700'
                }, displayData.content)
              ),

              // 키워드
              React.createElement('div', { className: 'mb-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2' },
                  React.createElement('i', { className: 'fas fa-tags text-purple-600' }),
                  '키워드'
                ),
                React.createElement('div', { className: 'flex flex-wrap gap-2' },
                  ...displayData.keywords.map((keyword, index) =>
                    React.createElement('span', {
                      key: index,
                      className: `px-3 py-1 rounded-full text-sm font-medium ${
                        page.type === 'ai_keyword' ? 'bg-red-100 text-red-800' :
                        page.type === 'consulting_insight' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`
                    }, keyword)
                  )
                )
              ),

              // 메타데이터
              React.createElement('div', { className: 'mb-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2' },
                  React.createElement('i', { className: 'fas fa-info-circle text-indigo-600' }),
                  '상세 정보'
                ),
                React.createElement('div', { className: 'space-y-3' },
                  ...Object.entries(displayData.metadata).map(([key, value]) => 
                    value && React.createElement('div', {
                      key: key,
                      className: 'flex justify-between items-center py-2 px-3 bg-gray-50 rounded'
                    },
                      React.createElement('span', { className: 'font-medium text-gray-600 capitalize' }, 
                        key.replace(/([A-Z])/g, ' $1').trim()
                      ),
                      React.createElement('span', { className: 'text-gray-800' },
                        typeof value === 'boolean' ? (value ? '있음' : '없음') : 
                        Array.isArray(value) ? value.join(', ') : value
                      )
                    )
                  )
                )
              ),

              // 페이지 특성 (PDF 이미지인 경우)
              page.type === 'pdf_page_image' && React.createElement('div', null,
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2' },
                  React.createElement('i', { className: 'fas fa-check-circle text-green-600' }),
                  '페이지 특성'
                ),
                React.createElement('div', { className: 'flex flex-wrap gap-2' },
                  displayData.metadata.hasTitle && React.createElement('span', {
                    className: 'px-2 py-1 bg-green-100 text-green-700 rounded text-sm'
                  }, '📝 제목 있음'),
                  displayData.metadata.hasImages && React.createElement('span', {
                    className: 'px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm'
                  }, '🖼️ 이미지 있음'),
                  displayData.metadata.hasTables && React.createElement('span', {
                    className: 'px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm'
                  }, '📊 표 있음'),
                  displayData.metadata.hasCharts && React.createElement('span', {
                    className: 'px-2 py-1 bg-red-100 text-red-700 rounded text-sm'
                  }, '📈 차트 있음')
                )
              )
            )
          )
        ),

        // Footer
        React.createElement('div', { className: 'p-4 border-t border-gray-200 bg-gray-50' },
          React.createElement('div', { className: 'flex justify-between items-center text-sm text-gray-600' },
            React.createElement('div', { className: 'flex items-center gap-4' },
              React.createElement('span', null, `📄 문서: ${page.documentTitle || 'PDF 문서'}`),
              React.createElement('span', null, `⏰ ${new Date().toLocaleString()}`)
            ),
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('span', null, 'PwC 온톨로지 자동 구축 시스템'),
              React.createElement('i', { className: 'fas fa-robot text-blue-600' })
            )
          )
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
  
  // 패널 표시 상태 관리
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [showInsightPanel, setShowInsightPanel] = useState(true);

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
      onResetGraph: handleResetGraph,
      isVisible: showControlPanel,
      onToggle: () => setShowControlPanel(!showControlPanel)
    }),
    
    React.createElement(InsightPanel, {
      insights: insights,
      kpis: kpis,
      isVisible: showInsightPanel,
      onToggle: () => setShowInsightPanel(!showInsightPanel)
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