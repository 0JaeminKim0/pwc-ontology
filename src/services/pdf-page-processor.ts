// PDF 페이지별 처리 및 그래프 생성 서비스

export interface PDFPageNode {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  title: string;
  content: string;
  summary: string;
  keywords: string[];
  images: PDFPageImage[];
  tables: PDFPageTable[];
  type: 'pdf_page';
  category: 'document_page';
  x: number;
  y: number;
  z: number;
  color: string;
  thumbnail?: string;
  wordCount: number;
  confidence: number;
}

export interface PDFPageImage {
  id: string;
  description: string;
  type: 'chart' | 'diagram' | 'photo' | 'logo';
  position: { x: number, y: number, width: number, height: number };
  extractedText?: string;
}

export interface PDFPageTable {
  id: string;
  rows: string[][];
  headers: string[];
  caption?: string;
  position: { x: number, y: number, width: number, height: number };
}

export interface PDFPageRelationship {
  source: string;
  target: string;
  type: 'next_page' | 'references' | 'similar_topic' | 'continues' | 'summarizes';
  strength: number;
  evidence?: string;
}

export interface ProcessedPDFDocument {
  id: string;
  filename: string;
  title: string;
  totalPages: number;
  pageNodes: PDFPageNode[];
  pageRelationships: PDFPageRelationship[];
  documentSummary: string;
  mainTopics: string[];
  metadata: {
    author?: string;
    createdDate?: string;
    fileSize: number;
    processingTime: number;
  };
}

export class PDFPageProcessor {
  
  // 메인 PDF 처리 함수
  async processPDFDocument(file: File): Promise<ProcessedPDFDocument> {
    const startTime = Date.now();
    
    // 1단계: PDF 파싱 및 페이지 추출 (Mock - 실제로는 PDF.js 사용)
    const pages = await this.extractPagesFromPDF(file);
    
    // 2단계: 각 페이지별 콘텐츠 분석
    const pageNodes = await this.analyzePages(pages, file.name);
    
    // 3단계: 페이지 간 관계 분석
    const pageRelationships = this.analyzePageRelationships(pageNodes);
    
    // 4단계: 문서 전체 요약
    const documentSummary = this.generateDocumentSummary(pageNodes);
    const mainTopics = this.extractMainTopics(pageNodes);
    
    const processingTime = Date.now() - startTime;
    
    return {
      id: `pdf-doc-${Date.now()}`,
      filename: file.name,
      title: this.extractDocumentTitle(pageNodes),
      totalPages: pageNodes.length,
      pageNodes,
      pageRelationships,
      documentSummary,
      mainTopics,
      metadata: {
        fileSize: file.size,
        processingTime,
        createdDate: new Date().toISOString()
      }
    };
  }

  // PDF에서 페이지 추출 (Mock - 실제로는 PDF.js 사용)
  private async extractPagesFromPDF(file: File): Promise<any[]> {
    // Mock PDF 페이지 - 실제로는 PDF.js로 페이지별 텍스트/이미지 추출
    const mockPages = [
      {
        pageNumber: 1,
        text: `
        삼성DS 사업부 S&OP 최적화 프로젝트 제안서
        
        Executive Summary
        
        본 제안서는 삼성 DS 사업부의 Supply Chain & Operations Planning (S&OP) 
        프로세스 최적화를 통한 운영 효율성 증대 방안을 제시합니다.
        
        주요 목표:
        • AI 기반 수요 예측 정확도 85% 이상 달성
        • 재고 최적화를 통한 연간 50억원 비용 절감
        • 의사결정 시간 70% 단축
        `,
        images: [
          { type: 'logo', description: 'PwC 로고', position: { x: 50, y: 50, width: 100, height: 50 } }
        ],
        tables: []
      },
      {
        pageNumber: 2,
        text: `
        1. 현황 분석
        
        1.1 AS-IS 프로세스 분석
        현재 삼성DS의 S&OP 프로세스는 다음과 같은 한계점을 가지고 있습니다:
        
        • 수동적 데이터 수집 및 분석 프로세스
        • Excel 기반 예측 모델의 낮은 정확도 (현재 68%)
        • 부서간 정보 사일로 현상
        • 실시간 의사결정 지원 체계 부재
        
        1.2 벤치마킹 분석
        글로벌 반도체 기업들의 디지털 S&OP 도입 현황을 분석한 결과...
        `,
        images: [
          { type: 'chart', description: 'AS-IS vs TO-BE 비교 차트', position: { x: 100, y: 200, width: 400, height: 300 } }
        ],
        tables: [
          {
            headers: ['구분', 'AS-IS', 'TO-BE', '개선효과'],
            rows: [
              ['예측 정확도', '68%', '85%', '+17%p'],
              ['처리 시간', '2주', '3일', '-70%'],
              ['인력 투입', '15명', '8명', '-47%']
            ]
          }
        ]
      },
      {
        pageNumber: 3,
        text: `
        2. 제안 솔루션
        
        2.1 AI 기반 수요 예측 모델
        
        Machine Learning 알고리즘을 활용한 고도화된 수요 예측 시스템 구축:
        
        • 다변량 시계열 분석 (ARIMA, LSTM)
        • 외부 요인 반영 (시장 동향, 계절성, 이벤트)
        • 실시간 학습 및 모델 업데이트
        
        2.2 Palantir Foundry 기반 통합 플랫폼
        
        • 실시간 데이터 수집 및 처리
        • 시나리오 기반 시뮬레이션
        • 대시보드 및 알림 시스템
        `,
        images: [
          { type: 'diagram', description: 'AI 모델 아키텍처', position: { x: 50, y: 300, width: 500, height: 250 } }
        ],
        tables: []
      },
      {
        pageNumber: 4,
        text: `
        3. 구현 계획 및 일정
        
        3.1 Phase 1: 데이터 플랫폼 구축 (1-3개월)
        • 데이터 소스 연결 및 정제
        • Palantir Foundry 환경 구축
        • 기초 대시보드 개발
        
        3.2 Phase 2: AI 모델 개발 (2-4개월)  
        • 수요 예측 모델 개발 및 학습
        • 검증 및 튜닝
        • 파일럿 테스트
        
        3.3 Phase 3: 전사 적용 (4-6개월)
        • 전체 제품군 확대 적용
        • 운영 프로세스 정착
        • 사용자 교육 및 지원
        `,
        images: [],
        tables: [
          {
            headers: ['Phase', '기간', '주요 활동', '산출물'],
            rows: [
              ['Phase 1', '1-3개월', '데이터 플랫폼 구축', 'Foundry 환경, 기초 대시보드'],
              ['Phase 2', '2-4개월', 'AI 모델 개발', '수요 예측 모델, 검증 보고서'],
              ['Phase 3', '4-6개월', '전사 적용', '운영 매뉴얼, 교육 자료']
            ]
          }
        ]
      },
      {
        pageNumber: 5,
        text: `
        4. 기대 효과 및 ROI
        
        4.1 정량적 효과
        
        • 비용 절감: 연간 50억원 (재고 최적화 30억, 운영비 절감 20억)
        • 매출 증대: 연간 25억원 (품절률 감소 효과)
        • ROI: 150% (3년 누적)
        
        4.2 정성적 효과
        
        • 의사결정 품질 향상
        • 고객 만족도 제고 (품절률 감소)
        • 조직 역량 강화 (디지털 전환 가속화)
        
        4.3 리스크 관리 방안
        
        • 점진적 적용을 통한 리스크 최소화
        • 기존 시스템과의 병행 운영
        • 전담 PMO 운영
        `,
        images: [
          { type: 'chart', description: 'ROI 추이 그래프', position: { x: 100, y: 100, width: 400, height: 200 } }
        ],
        tables: [
          {
            headers: ['구분', '1년차', '2년차', '3년차'],
            rows: [
              ['비용 절감 (억원)', '30', '45', '50'],
              ['매출 증대 (억원)', '15', '20', '25'],
              ['투자 비용 (억원)', '40', '10', '5']
            ]
          }
        ]
      }
    ];
    
    return mockPages;
  }

  // 페이지별 콘텐츠 분석
  private async analyzePages(pages: any[], filename: string): Promise<PDFPageNode[]> {
    return pages.map((page, index) => {
      const pageTitle = this.extractPageTitle(page.text);
      const keywords = this.extractKeywords(page.text);
      const summary = this.generatePageSummary(page.text);
      
      return {
        id: `page-${Date.now()}-${page.pageNumber}`,
        documentId: `doc-${Date.now()}`,
        documentTitle: filename.replace('.pdf', ''),
        pageNumber: page.pageNumber,
        title: pageTitle,
        content: page.text.trim(),
        summary,
        keywords,
        images: page.images?.map((img: any, imgIndex: number) => ({
          id: `img-${page.pageNumber}-${imgIndex}`,
          description: img.description,
          type: img.type,
          position: img.position
        })) || [],
        tables: page.tables?.map((table: any, tableIndex: number) => ({
          id: `table-${page.pageNumber}-${tableIndex}`,
          headers: table.headers,
          rows: table.rows,
          position: { x: 0, y: 0, width: 500, height: 200 }
        })) || [],
        type: 'pdf_page',
        category: 'document_page',
        // 페이지를 원형으로 배치 (시계 방향)
        x: Math.cos((index / pages.length) * 2 * Math.PI) * 200,
        y: Math.sin((index / pages.length) * 2 * Math.PI) * 200,
        z: index * 20, // 순서대로 높이 차이
        color: this.getPageColor(page.pageNumber, pageTitle),
        wordCount: page.text.split(/\s+/).length,
        confidence: 0.9 // 실제 PDF 파싱이므로 높은 신뢰도
      };
    });
  }

  // 페이지 간 관계 분석
  private analyzePageRelationships(pages: PDFPageNode[]): PDFPageRelationship[] {
    const relationships: PDFPageRelationship[] = [];
    
    for (let i = 0; i < pages.length; i++) {
      const currentPage = pages[i];
      
      // 1. 순차적 페이지 관계 (다음 페이지)
      if (i < pages.length - 1) {
        relationships.push({
          source: currentPage.id,
          target: pages[i + 1].id,
          type: 'next_page',
          strength: 1.0,
          evidence: '순차적 페이지 관계'
        });
      }
      
      // 2. 주제 유사도 기반 관계
      for (let j = i + 2; j < pages.length; j++) {
        const otherPage = pages[j];
        const similarity = this.calculateTopicSimilarity(currentPage, otherPage);
        
        if (similarity > 0.6) {
          relationships.push({
            source: currentPage.id,
            target: otherPage.id,
            type: 'similar_topic',
            strength: similarity,
            evidence: `공통 키워드: ${this.findCommonKeywords(currentPage.keywords, otherPage.keywords).join(', ')}`
          });
        }
      }
      
      // 3. 참조 관계 (페이지 번호 언급)
      const pageReferences = this.findPageReferences(currentPage.content);
      pageReferences.forEach(refPageNum => {
        const referencedPage = pages.find(p => p.pageNumber === refPageNum);
        if (referencedPage && referencedPage.id !== currentPage.id) {
          relationships.push({
            source: currentPage.id,
            target: referencedPage.id,
            type: 'references',
            strength: 0.8,
            evidence: `페이지 ${refPageNum} 참조`
          });
        }
      });
      
      // 4. 연속성 관계 (챕터가 이어지는 경우)
      if (i < pages.length - 1) {
        const nextPage = pages[i + 1];
        if (this.isContinuousContent(currentPage, nextPage)) {
          relationships.push({
            source: currentPage.id,
            target: nextPage.id,
            type: 'continues',
            strength: 0.9,
            evidence: '동일 챕터 또는 연속된 내용'
          });
        }
      }
    }
    
    return relationships;
  }

  // 유틸리티 함수들
  private extractPageTitle(text: string): string {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // 첫 번째로 의미있는 제목 라인 찾기
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 100 && 
          !line.includes('페이지') && !line.match(/^\d+$/)) {
        return line;
      }
    }
    
    return lines[0] || '제목 없음';
  }

  private extractKeywords(text: string): string[] {
    // Mock 키워드 추출 - 실제로는 TF-IDF, 형태소 분석 등 사용
    const commonWords = ['삼성', 'DS', 'S&OP', 'AI', '예측', '최적화', '효율성', 'Palantir', 
                         '데이터', '플랫폼', '분석', '시스템', '프로세스', '개선', 'ROI'];
    
    const keywords: string[] = [];
    commonWords.forEach(word => {
      if (text.includes(word) && !keywords.includes(word)) {
        keywords.push(word);
      }
    });
    
    // 숫자와 퍼센트도 키워드로 추출
    const numbers = text.match(/\d+%|\d+억원|\d+개월/g) || [];
    keywords.push(...numbers.slice(0, 3));
    
    return keywords.slice(0, 8);
  }

  private generatePageSummary(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    const meaningfulLines = lines.filter(line => 
      line.length > 10 && !line.match(/^\d+\./) && !line.includes('•')
    );
    
    if (meaningfulLines.length > 0) {
      return meaningfulLines[0].substring(0, 150) + '...';
    }
    
    return text.substring(0, 150) + '...';
  }

  private getPageColor(pageNumber: number, title: string): string {
    // 페이지 유형별 색상
    if (title.includes('Executive') || title.includes('요약')) return '#e74c3c'; // 빨강
    if (title.includes('현황') || title.includes('분석')) return '#3498db'; // 파랑
    if (title.includes('제안') || title.includes('솔루션')) return '#2ecc71'; // 초록
    if (title.includes('계획') || title.includes('일정')) return '#f39c12'; // 주황
    if (title.includes('효과') || title.includes('ROI')) return '#9b59b6'; // 보라
    
    // 기본적으로 페이지 순서에 따른 색상
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    return colors[(pageNumber - 1) % colors.length];
  }

  private calculateTopicSimilarity(page1: PDFPageNode, page2: PDFPageNode): number {
    const commonKeywords = this.findCommonKeywords(page1.keywords, page2.keywords);
    const totalKeywords = new Set([...page1.keywords, ...page2.keywords]).size;
    
    if (totalKeywords === 0) return 0;
    return commonKeywords.length / totalKeywords;
  }

  private findCommonKeywords(keywords1: string[], keywords2: string[]): string[] {
    return keywords1.filter(kw => keywords2.includes(kw));
  }

  private findPageReferences(content: string): number[] {
    const pageRefs = content.match(/페이지\s*(\d+)|p\.?\s*(\d+)|page\s*(\d+)/gi) || [];
    return pageRefs.map(ref => {
      const match = ref.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter(num => num > 0);
  }

  private isContinuousContent(page1: PDFPageNode, page2: PDFPageNode): boolean {
    // 챕터 번호가 연속되는지 확인
    const chapterPattern = /^\d+\./;
    const page1Chapter = page1.title.match(chapterPattern);
    const page2Chapter = page2.title.match(chapterPattern);
    
    if (page1Chapter && page2Chapter) {
      const num1 = parseInt(page1Chapter[0]);
      const num2 = parseInt(page2Chapter[0]);
      return num2 === num1 + 1;
    }
    
    // 또는 공통 키워드가 많은 경우
    const similarity = this.calculateTopicSimilarity(page1, page2);
    return similarity > 0.7;
  }

  private extractDocumentTitle(pages: PDFPageNode[]): string {
    if (pages.length > 0) {
      const firstPageTitle = pages[0].title;
      if (firstPageTitle.includes('제안서') || firstPageTitle.includes('보고서') || 
          firstPageTitle.includes('계획서')) {
        return firstPageTitle;
      }
    }
    return `PDF 문서 (${pages.length} 페이지)`;
  }

  private generateDocumentSummary(pages: PDFPageNode[]): string {
    const mainKeywords = this.extractMainTopics(pages);
    const totalWords = pages.reduce((sum, page) => sum + page.wordCount, 0);
    
    return `총 ${pages.length}페이지, ${totalWords}단어로 구성된 문서입니다. 주요 주제: ${mainKeywords.join(', ')}`;
  }

  private extractMainTopics(pages: PDFPageNode[]): string[] {
    const allKeywords: string[] = [];
    pages.forEach(page => allKeywords.push(...page.keywords));
    
    // 키워드 빈도 계산
    const keywordCount = new Map<string, number>();
    allKeywords.forEach(kw => {
      keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
    });
    
    // 상위 5개 키워드 반환
    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }
}