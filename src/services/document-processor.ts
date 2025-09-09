// 문서 처리 및 온톨로지 자동 확장 서비스

import { PWC_SEED_ONTOLOGY, DOCUMENT_PATTERNS } from '../data/pwc-taxonomy';

export interface ProcessedDocument {
  id: string;
  filename: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  extractedEntities: ExtractedEntity[];
  extractedRelationships: ExtractedRelationship[];
  confidence: number;
}

export interface DocumentMetadata {
  fileType: string;
  uploadTime: string;
  size: number;
  pages?: number;
  author?: string;
  client?: string;
  project?: string;
  documentType: string;
  tags: string[];
}

export interface ExtractedEntity {
  id: string;
  text: string;
  type: string;
  category: string;
  confidence: number;
  aliases: string[];
  position: { start: number; end: number };
  context: string;
  suggestedMerge?: string; // 기존 엔티티와 병합 제안
}

export interface ExtractedRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  evidence: string;
  position: { start: number; end: number };
}

export interface TripleCandidate {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  evidence: string;
  source: string;
}

// 문서 처리 클래스
export class DocumentProcessor {
  private seedEntities: Map<string, any>;
  private seedRelationships: Map<string, any>;

  constructor() {
    // 시드 온톨로지 로드
    this.seedEntities = new Map();
    this.seedRelationships = new Map();
    
    PWC_SEED_ONTOLOGY.entities.forEach(entity => {
      this.seedEntities.set(entity.id, entity);
      // 별명도 매핑에 추가
      entity.aliases?.forEach(alias => {
        this.seedEntities.set(alias.toLowerCase(), entity);
      });
    });
    
    PWC_SEED_ONTOLOGY.relationships.forEach(rel => {
      this.seedRelationships.set(`${rel.source}-${rel.target}`, rel);
    });
  }

  // 메인 문서 처리 함수
  async processDocument(file: File): Promise<ProcessedDocument> {
    const content = await this.extractTextFromFile(file);
    const metadata = this.extractMetadata(file, content);
    
    // 1단계: 파일명/제목 기반 초기 매핑
    const initialMapping = this.performInitialMapping(file.name, content);
    
    // 2단계: NER 및 엔티티 추출
    const entities = this.extractEntities(content);
    
    // 3단계: 관계 추출
    const relationships = this.extractRelationships(content, entities);
    
    // 4단계: 동의어 통합 및 신뢰도 계산
    const processedEntities = this.normalizeEntities(entities);
    const processedRelationships = this.normalizeRelationships(relationships);
    
    // 5단계: 전체 신뢰도 계산
    const confidence = this.calculateOverallConfidence(processedEntities, processedRelationships);

    return {
      id: this.generateDocumentId(),
      filename: file.name,
      title: this.extractTitle(content),
      content,
      metadata,
      extractedEntities: processedEntities,
      extractedRelationships: processedRelationships,
      confidence
    };
  }

  // 파일에서 텍스트 추출 (Mock - 실제로는 PDF.js, docx 파서 등 사용)
  private async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'text/plain') {
      return await file.text();
    }
    
    // Mock PDF/DOCX 내용 - 실제로는 PDF.js나 mammoth.js 등 사용
    const mockContent = `
    삼성DS 사업부 S&OP 최적화 프로젝트 제안서
    
    1. 프로젝트 개요
    삼성DS는 글로벌 반도체 시장에서의 경쟁력 강화를 위해 Supply Chain 최적화를 통한 
    운영 효율성 증대를 목표로 하고 있습니다.
    
    2. 현황 분석
    - 현재 S&OP 프로세스의 디지털화 수준이 낮아 의사결정 속도 지연
    - Palantir 플랫폼을 활용한 실시간 데이터 분석 체계 부재
    - AI/ML 기반 수요 예측 모델의 정확도 개선 필요
    
    3. 제안 솔루션
    - AI 기반 수요 예측 모델 구축 (정확도 목표: 85% 이상)
    - Palantir Foundry를 활용한 통합 데이터 플랫폼 구축
    - 실시간 KPI 대시보드 구현 (ROI: 예상 150%)
    
    4. 기대 효과
    - 재고 최적화를 통한 연간 50억원 비용 절감
    - 의사결정 시간 70% 단축
    - 고객 만족도 15% 향상
    `;
    
    return mockContent;
  }

  // 메타데이터 추출
  private extractMetadata(file: File, content: string): DocumentMetadata {
    const documentType = this.classifyDocumentType(file.name, content);
    const client = this.extractClient(file.name, content);
    
    return {
      fileType: file.type,
      uploadTime: new Date().toISOString(),
      size: file.size,
      documentType,
      client: client || 'unknown',
      tags: this.generateTags(content),
    };
  }

  // 초기 매핑 (파일명, 제목 기반)
  private performInitialMapping(filename: string, content: string): string[] {
    const mappedEntities: string[] = [];
    
    // 파일명 패턴 매칭
    Object.entries(DOCUMENT_PATTERNS.filename).forEach(([type, pattern]) => {
      if (pattern.test(filename)) {
        mappedEntities.push(type);
      }
    });
    
    // 제목 패턴 매칭
    Object.entries(DOCUMENT_PATTERNS.title).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        mappedEntities.push(type);
      }
    });
    
    // 클라이언트 패턴 매칭
    Object.entries(DOCUMENT_PATTERNS.client).forEach(([client, pattern]) => {
      if (pattern.test(filename) || pattern.test(content)) {
        mappedEntities.push(client);
      }
    });
    
    return mappedEntities;
  }

  // NER 및 엔티티 추출 (Mock - 실제로는 SpaCy, Transformers 등 사용)
  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // 기존 시드 엔티티 매칭
    PWC_SEED_ONTOLOGY.entities.forEach(seedEntity => {
      const regex = new RegExp(seedEntity.label, 'gi');
      const matches = content.matchAll(regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            id: `${seedEntity.id}-${entities.length}`,
            text: match[0],
            type: seedEntity.type,
            category: seedEntity.category,
            confidence: 0.9, // 시드 엔티티는 높은 신뢰도
            aliases: seedEntity.aliases || [],
            position: { start: match.index, end: match.index + match[0].length },
            context: this.extractContext(content, match.index, match[0].length),
            suggestedMerge: seedEntity.id
          });
        }
      }
      
      // 별명도 체크
      seedEntity.aliases?.forEach(alias => {
        const aliasRegex = new RegExp(alias, 'gi');
        const aliasMatches = content.matchAll(aliasRegex);
        
        for (const match of aliasMatches) {
          if (match.index !== undefined) {
            entities.push({
              id: `${seedEntity.id}-alias-${entities.length}`,
              text: match[0],
              type: seedEntity.type,
              category: seedEntity.category,
              confidence: 0.8, // 별명은 조금 낮은 신뢰도
              aliases: [],
              position: { start: match.index, end: match.index + match[0].length },
              context: this.extractContext(content, match.index, match[0].length),
              suggestedMerge: seedEntity.id
            });
          }
        }
      });
    });
    
    // 새로운 엔티티 발견 (도메인 특화 패턴)
    const newEntityPatterns = [
      { pattern: /(\w+)\s*(플랫폼|시스템|솔루션)/gi, type: 'technology' },
      { pattern: /(\w+)\s*(모델|프레임워크|방법론)/gi, type: 'deliverable' },
      { pattern: /(\d+%)\s*(절감|개선|향상|증가)/gi, type: 'kpi' },
      { pattern: /(\w+)\s*(사업부|부문|팀)/gi, type: 'organization' }
    ];
    
    newEntityPatterns.forEach(({ pattern, type }) => {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index !== undefined && match[1]) {
          entities.push({
            id: `new-${type}-${entities.length}`,
            text: match[1],
            type,
            category: 'discovered',
            confidence: 0.6, // 새 엔티티는 낮은 신뢰도
            aliases: [],
            position: { start: match.index, end: match.index + match[0].length },
            context: this.extractContext(content, match.index, match[0].length)
          });
        }
      }
    });
    
    return entities;
  }

  // 관계 추출 (Mock - 실제로는 dependency parsing, 패턴 매칭 등 사용)
  private extractRelationships(content: string, entities: ExtractedEntity[]): ExtractedRelationship[] {
    const relationships: ExtractedRelationship[] = [];
    
    // 관계 패턴 정의
    const relationshipPatterns = [
      { pattern: /(\w+).*?를 활용한.*?(\w+)/gi, type: 'uses' },
      { pattern: /(\w+).*?을 통한.*?(\w+)/gi, type: 'enables' },
      { pattern: /(\w+).*?에서.*?(\w+).*?제공/gi, type: 'provides' },
      { pattern: /(\w+).*?목표.*?(\d+%)/gi, type: 'targets' },
      { pattern: /(\w+).*?효과.*?(\w+)/gi, type: 'results_in' }
    ];
    
    relationshipPatterns.forEach(({ pattern, type }) => {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index !== undefined && match[1] && match[2]) {
          const sourceEntity = entities.find(e => 
            e.text.toLowerCase().includes(match[1].toLowerCase())
          );
          const targetEntity = entities.find(e => 
            e.text.toLowerCase().includes(match[2].toLowerCase())
          );
          
          if (sourceEntity && targetEntity) {
            relationships.push({
              id: `rel-${relationships.length}`,
              source: sourceEntity.id,
              target: targetEntity.id,
              type,
              confidence: 0.7,
              evidence: match[0],
              position: { start: match.index, end: match.index + match[0].length }
            });
          }
        }
      }
    });
    
    return relationships;
  }

  // 동의어 통합
  private normalizeEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const normalizedEntities: ExtractedEntity[] = [];
    const processedTexts = new Set<string>();
    
    entities.forEach(entity => {
      const normalizedText = entity.text.toLowerCase().trim();
      
      if (!processedTexts.has(normalizedText)) {
        processedTexts.add(normalizedText);
        
        // 유사한 엔티티들을 찾아서 병합
        const similarEntities = entities.filter(e => 
          e.text.toLowerCase().trim() === normalizedText ||
          entity.aliases.some(alias => alias.toLowerCase() === e.text.toLowerCase())
        );
        
        if (similarEntities.length > 1) {
          // 가장 높은 신뢰도를 가진 엔티티를 기준으로 병합
          const bestEntity = similarEntities.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          );
          
          bestEntity.confidence = Math.min(0.95, bestEntity.confidence + 0.1); // 병합으로 신뢰도 증가
          normalizedEntities.push(bestEntity);
        } else {
          normalizedEntities.push(entity);
        }
      }
    });
    
    return normalizedEntities;
  }

  // 관계 정규화
  private normalizeRelationships(relationships: ExtractedRelationship[]): ExtractedRelationship[] {
    // 중복 관계 제거 및 신뢰도 통합
    const relationshipMap = new Map<string, ExtractedRelationship>();
    
    relationships.forEach(rel => {
      const key = `${rel.source}-${rel.type}-${rel.target}`;
      
      if (relationshipMap.has(key)) {
        const existing = relationshipMap.get(key)!;
        existing.confidence = Math.min(0.95, existing.confidence + 0.1);
      } else {
        relationshipMap.set(key, rel);
      }
    });
    
    return Array.from(relationshipMap.values());
  }

  // 전체 신뢰도 계산
  private calculateOverallConfidence(entities: ExtractedEntity[], relationships: ExtractedRelationship[]): number {
    if (entities.length === 0) return 0;
    
    const entityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
    const relationshipConfidence = relationships.length > 0 
      ? relationships.reduce((sum, r) => sum + r.confidence, 0) / relationships.length
      : 0.5;
    
    return (entityConfidence * 0.7 + relationshipConfidence * 0.3);
  }

  // 유틸리티 함수들
  private extractContext(content: string, start: number, length: number): string {
    const contextStart = Math.max(0, start - 50);
    const contextEnd = Math.min(content.length, start + length + 50);
    return content.slice(contextStart, contextEnd);
  }

  private classifyDocumentType(filename: string, content: string): string {
    if (DOCUMENT_PATTERNS.filename.proposal.test(filename)) return 'proposal';
    if (DOCUMENT_PATTERNS.filename.report.test(filename)) return 'report';
    if (DOCUMENT_PATTERNS.filename.strategy.test(filename)) return 'strategy';
    if (DOCUMENT_PATTERNS.filename.analysis.test(filename)) return 'analysis';
    return 'document';
  }

  private extractClient(filename: string, content: string): string | null {
    for (const [client, pattern] of Object.entries(DOCUMENT_PATTERNS.client)) {
      if (pattern.test(filename) || pattern.test(content)) {
        return client;
      }
    }
    return null;
  }

  private extractTitle(content: string): string {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    return lines[0] || 'Untitled Document';
  }

  private generateTags(content: string): string[] {
    const tags: string[] = [];
    
    if (/디지털|digital/i.test(content)) tags.push('digital');
    if (/ai|인공지능/i.test(content)) tags.push('ai');
    if (/클라우드|cloud/i.test(content)) tags.push('cloud');
    if (/분석|analytics/i.test(content)) tags.push('analytics');
    if (/전략|strategy/i.test(content)) tags.push('strategy');
    
    return tags;
  }

  private generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 온톨로지 업데이트 매니저
export class OntologyUpdateManager {
  private confidenceThreshold: number = 0.75;

  // 신뢰도 기준 이상의 엔티티/관계를 온톨로지에 자동 반영
  async updateOntology(processedDoc: ProcessedDocument): Promise<{
    autoApproved: any[],
    needsReview: any[],
    rejected: any[]
  }> {
    const autoApproved: any[] = [];
    const needsReview: any[] = [];
    const rejected: any[] = [];

    // 엔티티 처리
    processedDoc.extractedEntities.forEach(entity => {
      if (entity.confidence >= this.confidenceThreshold) {
        autoApproved.push({
          type: 'entity',
          data: entity,
          action: 'add_or_merge'
        });
      } else if (entity.confidence >= 0.5) {
        needsReview.push({
          type: 'entity',
          data: entity,
          action: 'review_needed',
          reason: `낮은 신뢰도 (${entity.confidence.toFixed(2)})`
        });
      } else {
        rejected.push({
          type: 'entity',
          data: entity,
          reason: `신뢰도 임계값 미달 (${entity.confidence.toFixed(2)})`
        });
      }
    });

    // 관계 처리
    processedDoc.extractedRelationships.forEach(relationship => {
      if (relationship.confidence >= this.confidenceThreshold) {
        autoApproved.push({
          type: 'relationship',
          data: relationship,
          action: 'add'
        });
      } else if (relationship.confidence >= 0.5) {
        needsReview.push({
          type: 'relationship',
          data: relationship,
          action: 'review_needed',
          reason: `낮은 신뢰도 (${relationship.confidence.toFixed(2)})`
        });
      } else {
        rejected.push({
          type: 'relationship',
          data: relationship,
          reason: `신뢰도 임계값 미달 (${relationship.confidence.toFixed(2)})`
        });
      }
    });

    return { autoApproved, needsReview, rejected };
  }

  // Top 10 불확실한 후보 선별
  getTopUncertainCandidates(needsReview: any[]): any[] {
    return needsReview
      .sort((a, b) => b.data.confidence - a.data.confidence) // 신뢰도 높은 순
      .slice(0, 10);
  }
}