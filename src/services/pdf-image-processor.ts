// PDF 페이지를 이미지로 변환하고 메타정보를 추출하는 서비스

export interface PDFPageImage {
  id: string;
  documentId: string;
  pageNumber: number;
  imageDataUrl: string;  // base64 이미지 데이터
  width: number;
  height: number;
  aspectRatio: number;
  metadata: PDFPageMetadata;
  thumbnail?: string;    // 썸네일 이미지 (작은 크기)
}

export interface PDFPageMetadata {
  // 기본 정보
  pageNumber: number;
  title: string;
  extractedText: string;
  wordCount: number;
  
  // 레이아웃 정보
  textBlocks: TextBlock[];
  images: ImageElement[];
  shapes: ShapeElement[];
  tables: TableElement[];
  
  // 스타일 정보
  fonts: FontInfo[];
  colors: ColorInfo[];
  
  // 구조 정보
  hasTitle: boolean;
  hasImages: boolean;
  hasTables: boolean;
  hasCharts: boolean;
  
  // 분석 결과
  pageType: 'cover' | 'toc' | 'content' | 'chart' | 'table' | 'appendix';
  keywords: string[];
  summary: string;
  confidence: number;
}

export interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isTitle: boolean;
}

export interface ImageElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'photo' | 'chart' | 'diagram' | 'logo' | 'icon';
  description: string;
}

export interface ShapeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

export interface TableElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  columns: number;
  headers: string[];
  data: string[][];
}

export interface FontInfo {
  family: string;
  sizes: number[];
  usage: number; // 사용 빈도 (0-1)
}

export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  usage: number; // 사용 빈도 (0-1)
  role: 'text' | 'background' | 'accent' | 'border';
}

export interface ProcessedPDFWithImages {
  id: string;
  filename: string;
  title: string;
  totalPages: number;
  pageImages: PDFPageImage[];
  documentMetadata: {
    author?: string;
    creator?: string;
    creationDate?: string;
    modificationDate?: string;
    subject?: string;
    keywords?: string[];
    pageSize: { width: number; height: number };
    fileSize: number;
  };
  processingTime: number;
}

export class PDFImageProcessor {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor() {
    // Canvas 초기화 (클라이언트 사이드에서만 실행)
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d')!;
    }
  }

  // 메인 PDF 처리 함수
  async processPDFToImages(file: File): Promise<ProcessedPDFWithImages> {
    const startTime = Date.now();
    
    // PDF.js로 PDF 로드
    const pdfDoc = await this.loadPDFDocument(file);
    
    // 문서 메타데이터 추출
    const documentMetadata = await this.extractDocumentMetadata(pdfDoc, file);
    
    // 각 페이지를 이미지로 변환
    const pageImages: PDFPageImage[] = [];
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const pageImage = await this.convertPageToImage(pdfDoc, pageNum, file.name);
      pageImages.push(pageImage);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      id: `pdf-img-${Date.now()}`,
      filename: file.name,
      title: this.extractDocumentTitle(pageImages),
      totalPages: pdfDoc.numPages,
      pageImages,
      documentMetadata,
      processingTime
    };
  }

  // PDF.js로 PDF 문서 로드 (Mock - 실제로는 PDF.js 사용)
  private async loadPDFDocument(file: File): Promise<any> {
    // Mock PDF 문서 객체
    // 실제로는: const pdfDoc = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
    
    return {
      numPages: 5,
      getMetadata: async () => ({
        info: {
          Title: '삼성DS S&OP 최적화 프로젝트',
          Author: 'PwC Korea',
          Creator: 'Microsoft PowerPoint',
          CreationDate: new Date(),
          Subject: 'Supply Chain Optimization'
        }
      }),
      getPage: async (pageNum: number) => ({
        pageNumber: pageNum,
        getViewport: (options: any) => ({
          width: 1920,
          height: 1080,
          scale: options.scale || 1.0
        }),
        render: (renderContext: any) => ({
          promise: Promise.resolve()
        }),
        getTextContent: async () => this.getMockTextContent(pageNum),
        getOperatorList: async () => this.getMockOperatorList(pageNum)
      })
    };
  }

  // 문서 메타데이터 추출
  private async extractDocumentMetadata(pdfDoc: any, file: File): Promise<any> {
    const metadata = await pdfDoc.getMetadata();
    const firstPage = await pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 });
    
    return {
      author: metadata.info?.Author || 'Unknown',
      creator: metadata.info?.Creator || 'Unknown', 
      creationDate: metadata.info?.CreationDate?.toString() || new Date().toISOString(),
      subject: metadata.info?.Subject || '',
      keywords: metadata.info?.Keywords?.split(',') || [],
      pageSize: { 
        width: Math.round(viewport.width), 
        height: Math.round(viewport.height) 
      },
      fileSize: file.size
    };
  }

  // 페이지를 이미지로 변환
  private async convertPageToImage(pdfDoc: any, pageNum: number, filename: string): Promise<PDFPageImage> {
    const page = await pdfDoc.getPage(pageNum);
    const scale = 2.0; // 고해상도를 위한 스케일
    const viewport = page.getViewport({ scale });
    
    // Canvas 설정
    this.canvas.width = viewport.width;
    this.canvas.height = viewport.height;
    
    // Mock 렌더링 (실제로는 PDF.js 렌더링)
    await this.mockRenderPage(pageNum, viewport.width, viewport.height);
    
    // 이미지 데이터 추출
    const imageDataUrl = this.canvas.toDataURL('image/png', 0.9);
    
    // 썸네일 생성 (작은 크기)
    const thumbnailDataUrl = await this.createThumbnail(imageDataUrl, 200, 150);
    
    // 페이지 메타정보 추출
    const metadata = await this.extractPageMetadata(page, pageNum);
    
    return {
      id: `page-img-${Date.now()}-${pageNum}`,
      documentId: `pdf-doc-${Date.now()}`,
      pageNumber: pageNum,
      imageDataUrl,
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      metadata,
      thumbnail: thumbnailDataUrl
    };
  }

  // Mock 페이지 렌더링 (실제로는 PDF.js 사용)
  private async mockRenderPage(pageNum: number, width: number, height: number): Promise<void> {
    const ctx = this.context;
    
    // 배경 설정
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 페이지별 다른 내용 렌더링
    switch (pageNum) {
      case 1:
        await this.renderCoverPage(ctx, width, height);
        break;
      case 2:
        await this.renderAnalysisPage(ctx, width, height);
        break;
      case 3:
        await this.renderSolutionPage(ctx, width, height);
        break;
      case 4:
        await this.renderTimelinePage(ctx, width, height);
        break;
      case 5:
        await this.renderROIPage(ctx, width, height);
        break;
    }
  }

  // 표지 페이지 렌더링
  private async renderCoverPage(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    // PwC 로고 (빨간 사각형으로 대체)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(50, 50, 150, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('PwC', 110, 90);
    
    // 제목
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('삼성DS 사업부', width/2 - 200, height/2 - 100);
    ctx.fillText('S&OP 최적화 프로젝트', width/2 - 280, height/2 - 40);
    
    // 부제목
    ctx.font = '32px Arial';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('제안서', width/2 - 60, height/2 + 40);
    
    // 날짜
    ctx.font = '20px Arial';
    ctx.fillText('2024년 12월', width/2 - 80, height - 100);
  }

  // 분석 페이지 렌더링
  private async renderAnalysisPage(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    // 제목
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('1. 현황 분석', 80, 120);
    
    // 차트 영역 (사각형으로 표시)
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 180, 400, 250);
    
    ctx.fillStyle = '#3498db';
    ctx.font = '18px Arial';
    ctx.fillText('AS-IS vs TO-BE 비교 차트', 200, 310);
    
    // 텍스트 내용
    ctx.fillStyle = '#2c3e50';
    ctx.font = '16px Arial';
    const analysisText = [
      '• 현재 예측 정확도: 68%',
      '• 수동 프로세스로 인한 지연',
      '• 부서간 정보 사일로 현상',
      '• 실시간 의사결정 체계 부재'
    ];
    
    analysisText.forEach((text, index) => {
      ctx.fillText(text, 100, 500 + (index * 30));
    });
  }

  // 솔루션 페이지 렌더링
  private async renderSolutionPage(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    // 제목
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('2. 제안 솔루션', 80, 120);
    
    // AI 아키텍처 다이어그램 (원과 화살표로 표시)
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(200, 250, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('AI', 190, 255);
    
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.arc(400, 250, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Palantir', 375, 255);
    
    // 화살표
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(240, 250);
    ctx.lineTo(360, 250);
    ctx.stroke();
    
    // 솔루션 포인트
    ctx.fillStyle = '#2c3e50';
    ctx.font = '16px Arial';
    const solutionPoints = [
      '• AI 기반 수요 예측 모델 구축',
      '• Palantir Foundry 통합 플랫폼',
      '• 실시간 데이터 분석 체계',
      '• 시나리오 기반 시뮬레이션'
    ];
    
    solutionPoints.forEach((text, index) => {
      ctx.fillText(text, 100, 400 + (index * 30));
    });
  }

  // 타임라인 페이지 렌더링
  private async renderTimelinePage(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    // 제목
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('3. 구현 계획', 80, 120);
    
    // 타임라인 (가로선과 마일스톤)
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 250);
    ctx.lineTo(700, 250);
    ctx.stroke();
    
    // Phase 마일스톤
    const phases = ['Phase 1', 'Phase 2', 'Phase 3'];
    const phaseX = [200, 400, 600];
    
    phases.forEach((phase, index) => {
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(phaseX[index], 250, 15, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#2c3e50';
      ctx.font = '16px Arial';
      ctx.fillText(phase, phaseX[index] - 25, 280);
      ctx.fillText(`${index + 1}-${index + 3}개월`, phaseX[index] - 35, 300);
    });
  }

  // ROI 페이지 렌더링
  private async renderROIPage(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    // 제목
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('4. 기대 효과 및 ROI', 80, 120);
    
    // ROI 그래프 (막대 차트)
    const barWidth = 80;
    const barSpacing = 120;
    const startX = 150;
    const baseY = 400;
    
    const roiData = [
      { label: '1년차', value: 120, color: '#e74c3c' },
      { label: '2년차', value: 180, color: '#f39c12' },
      { label: '3년차', value: 220, color: '#2ecc71' }
    ];
    
    roiData.forEach((data, index) => {
      const x = startX + (index * barSpacing);
      const barHeight = data.value;
      
      ctx.fillStyle = data.color;
      ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
      
      ctx.fillStyle = '#2c3e50';
      ctx.font = '14px Arial';
      ctx.fillText(data.label, x + 15, baseY + 20);
      ctx.fillText(`${data.value}%`, x + 20, baseY - barHeight - 10);
    });
    
    // ROI 수치
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('ROI: 150%', 500, 200);
    ctx.fillText('연간 50억원 절감', 500, 240);
  }

  // 페이지 메타정보 추출
  private async extractPageMetadata(page: any, pageNum: number): Promise<PDFPageMetadata> {
    const textContent = await this.getMockTextContent(pageNum);
    const extractedText = textContent.items.map((item: any) => item.str).join(' ');
    
    return {
      pageNumber: pageNum,
      title: this.extractPageTitle(extractedText, pageNum),
      extractedText,
      wordCount: extractedText.split(/\s+/).length,
      textBlocks: await this.extractTextBlocks(pageNum),
      images: await this.extractImageElements(pageNum),
      shapes: await this.extractShapeElements(pageNum),
      tables: await this.extractTableElements(pageNum),
      fonts: await this.extractFontInfo(pageNum),
      colors: await this.extractColorInfo(pageNum),
      hasTitle: pageNum === 1,
      hasImages: [1, 2, 3, 5].includes(pageNum),
      hasTables: [2, 4].includes(pageNum),
      hasCharts: [2, 5].includes(pageNum),
      pageType: this.determinePageType(pageNum),
      keywords: this.extractKeywords(extractedText, pageNum),
      summary: this.generatePageSummary(extractedText, pageNum),
      confidence: 0.95
    };
  }

  // Mock 함수들
  private async getMockTextContent(pageNum: number): Promise<any> {
    const content = {
      1: 'PwC 삼성DS 사업부 S&OP 최적화 프로젝트 제안서 2024년 12월',
      2: '1. 현황 분석 AS-IS vs TO-BE 비교 차트 현재 예측 정확도 68% 수동 프로세스 지연',
      3: '2. 제안 솔루션 AI 기반 수요 예측 모델 Palantir Foundry 플랫폼 실시간 데이터 분석',
      4: '3. 구현 계획 Phase 1 데이터 플랫폼 Phase 2 AI 모델 Phase 3 전사 적용',
      5: '4. 기대 효과 ROI 150% 연간 50억원 절감 1년차 120% 2년차 180% 3년차 220%'
    };
    
    return {
      items: (content[pageNum as keyof typeof content] || '').split(' ').map(str => ({ str }))
    };
  }

  private async getMockOperatorList(pageNum: number): Promise<any> {
    return { fnArray: [], argsArray: [] };
  }

  private extractPageTitle(text: string, pageNum: number): string {
    const titles = {
      1: 'Executive Summary',
      2: '현황 분석',
      3: '제안 솔루션', 
      4: '구현 계획',
      5: '기대 효과 및 ROI'
    };
    return titles[pageNum as keyof typeof titles] || `페이지 ${pageNum}`;
  }

  private async extractTextBlocks(pageNum: number): Promise<TextBlock[]> {
    // Mock 텍스트 블록
    return [
      {
        id: `text-${pageNum}-1`,
        text: this.extractPageTitle('', pageNum),
        x: 80, y: 120, width: 400, height: 40,
        fontSize: 36, fontFamily: 'Arial', color: '#2c3e50',
        isBold: true, isItalic: false, isTitle: true
      }
    ];
  }

  private async extractImageElements(pageNum: number): Promise<ImageElement[]> {
    const hasImage = [1, 2, 3, 5].includes(pageNum);
    if (!hasImage) return [];
    
    return [{
      id: `img-${pageNum}-1`,
      x: 100, y: 180, width: 400, height: 250,
      type: pageNum === 1 ? 'logo' : pageNum === 5 ? 'chart' : 'diagram',
      description: pageNum === 1 ? 'PwC 로고' : pageNum === 5 ? 'ROI 차트' : '분석 다이어그램'
    }];
  }

  private async extractShapeElements(pageNum: number): Promise<ShapeElement[]> {
    return [];
  }

  private async extractTableElements(pageNum: number): Promise<TableElement[]> {
    if (![2, 4].includes(pageNum)) return [];
    
    return [{
      id: `table-${pageNum}-1`,
      x: 100, y: 450, width: 600, height: 120,
      rows: 3, columns: 3,
      headers: ['구분', 'AS-IS', 'TO-BE'],
      data: [['예측정확도', '68%', '85%'], ['처리시간', '2주', '3일']]
    }];
  }

  private async extractFontInfo(pageNum: number): Promise<FontInfo[]> {
    return [
      { family: 'Arial', sizes: [12, 16, 24, 36], usage: 0.8 },
      { family: 'Helvetica', sizes: [14, 18], usage: 0.2 }
    ];
  }

  private async extractColorInfo(pageNum: number): Promise<ColorInfo[]> {
    return [
      { hex: '#2c3e50', rgb: [44, 62, 80], usage: 0.6, role: 'text' },
      { hex: '#e74c3c', rgb: [231, 76, 60], usage: 0.2, role: 'accent' },
      { hex: '#ffffff', rgb: [255, 255, 255], usage: 0.2, role: 'background' }
    ];
  }

  private determinePageType(pageNum: number): PDFPageMetadata['pageType'] {
    const types = {
      1: 'cover' as const,
      2: 'content' as const,
      3: 'content' as const, 
      4: 'content' as const,
      5: 'chart' as const
    };
    return types[pageNum as keyof typeof types] || 'content';
  }

  private extractKeywords(text: string, pageNum: number): string[] {
    const commonKeywords = ['PwC', 'S&OP', '최적화', 'AI', 'Palantir', 'ROI'];
    return commonKeywords.filter(kw => text.includes(kw));
  }

  private generatePageSummary(text: string, pageNum: number): string {
    const summaries = {
      1: 'PwC의 삼성DS S&OP 최적화 프로젝트 제안서 표지',
      2: '현재 S&OP 프로세스의 한계점과 개선 필요사항 분석',
      3: 'AI와 Palantir 기반의 혁신적 솔루션 제안',
      4: '3단계 Phase별 구현 계획 및 일정',
      5: 'ROI 150% 달성과 연간 50억원 절감 효과'
    };
    return summaries[pageNum as keyof typeof summaries] || '페이지 내용 요약';
  }

  private async createThumbnail(imageDataUrl: string, width: number, height: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = width;
        thumbCanvas.height = height;
        const thumbCtx = thumbCanvas.getContext('2d')!;
        
        thumbCtx.drawImage(img, 0, 0, width, height);
        resolve(thumbCanvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = imageDataUrl;
    });
  }

  private extractDocumentTitle(pageImages: PDFPageImage[]): string {
    if (pageImages.length > 0) {
      return pageImages[0].metadata.title || '제목 없음';
    }
    return 'PDF 문서';
  }
}