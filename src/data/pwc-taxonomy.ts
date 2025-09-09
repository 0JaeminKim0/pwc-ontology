// PwC 공통 분류 체계 - 시드 온톨로지 데이터
export interface PwCEntity {
  id: string;
  label: string;
  type: string;
  category: string;
  description?: string;
  aliases?: string[];
  metadata?: Record<string, any>;
}

export interface PwCRelationship {
  source: string;
  target: string;
  type: string;
  weight: number;
  metadata?: Record<string, any>;
}

// PwC 조직 구조
export const PWC_ORGANIZATIONS: PwCEntity[] = [
  // 최상위
  { id: 'pwc-global', label: 'PwC Global', type: 'organization', category: 'global' },
  { id: 'pwc-korea', label: 'PwC Korea', type: 'organization', category: 'country' },
  
  // 본부/사업부
  { id: 'advisory', label: 'Advisory', type: 'division', category: 'business-unit', 
    aliases: ['어드바이저리', '자문'] },
  { id: 'assurance', label: 'Assurance', type: 'division', category: 'business-unit',
    aliases: ['어슈어런스', '보증'] },
  { id: 'tax', label: 'Tax & Legal', type: 'division', category: 'business-unit',
    aliases: ['세무', '택스'] },
  { id: 'consulting', label: 'Consulting', type: 'division', category: 'business-unit',
    aliases: ['컨설팅'] },
  
  // Advisory 하위 조직
  { id: 'deals', label: 'Deals', type: 'practice', category: 'service-line',
    aliases: ['딜스', 'M&A', '인수합병'] },
  { id: 'risk', label: 'Risk Assurance', type: 'practice', category: 'service-line',
    aliases: ['리스크', '위험관리'] },
  { id: 'forensics', label: 'Forensics', type: 'practice', category: 'service-line',
    aliases: ['포렌식', '수사'] },
  
  // 컨설팅 하위 조직
  { id: 'strategy', label: 'Strategy&', type: 'practice', category: 'service-line',
    aliases: ['전략', '스트래티지'] },
  { id: 'technology', label: 'Technology Consulting', type: 'practice', category: 'service-line',
    aliases: ['기술컨설팅', 'IT컨설팅'] },
  { id: 'operations', label: 'Operations', type: 'practice', category: 'service-line',
    aliases: ['운영', '오퍼레이션'] },
  { id: 'people-org', label: 'People & Organisation', type: 'practice', category: 'service-line',
    aliases: ['인사조직', 'HR'] }
];

// 산업군
export const PWC_INDUSTRIES: PwCEntity[] = [
  // 전통 산업
  { id: 'financial-services', label: 'Financial Services', type: 'industry', category: 'sector',
    aliases: ['금융', 'FS', '은행', '보험', '증권'] },
  { id: 'manufacturing', label: 'Manufacturing', type: 'industry', category: 'sector',
    aliases: ['제조업', '제조', '생산'] },
  { id: 'retail-consumer', label: 'Retail & Consumer', type: 'industry', category: 'sector',
    aliases: ['소매', '유통', '소비재', 'CPG'] },
  { id: 'healthcare', label: 'Healthcare', type: 'industry', category: 'sector',
    aliases: ['헬스케어', '의료', '제약', '바이오'] },
  { id: 'energy', label: 'Energy, Utilities & Resources', type: 'industry', category: 'sector',
    aliases: ['에너지', '유틸리티', '자원', '전력', '가스'] },
  
  // 신산업
  { id: 'tmt', label: 'Technology, Media & Telecommunications', type: 'industry', category: 'sector',
    aliases: ['TMT', '기술', '미디어', '통신', 'IT', '테크'] },
  { id: 'automotive', label: 'Automotive', type: 'industry', category: 'sector',
    aliases: ['자동차', '모빌리티', '완성차', '부품'] },
  { id: 'aerospace', label: 'Aerospace & Defence', type: 'industry', category: 'sector',
    aliases: ['항공우주', '방산', '국방'] },
  
  // 특정 기업/그룹
  { id: 'samsung', label: 'Samsung', type: 'client', category: 'enterprise',
    aliases: ['삼성', '삼성그룹'] },
  { id: 'lg', label: 'LG', type: 'client', category: 'enterprise',
    aliases: ['엘지', 'LG그룹'] },
  { id: 'sk', label: 'SK', type: 'client', category: 'enterprise',
    aliases: ['SK그룹'] },
  { id: 'hyundai', label: 'Hyundai Motor', type: 'client', category: 'enterprise',
    aliases: ['현대자동차', '현대차'] }
];

// 서비스/역량
export const PWC_CAPABILITIES: PwCEntity[] = [
  // 디지털 역량
  { id: 'digital-transformation', label: 'Digital Transformation', type: 'capability', category: 'digital',
    aliases: ['디지털전환', 'DX', '디지털혁신'] },
  { id: 'ai-analytics', label: 'AI & Analytics', type: 'capability', category: 'digital',
    aliases: ['AI', '인공지능', '애널리틱스', '데이터분석', 'ML', '머신러닝'] },
  { id: 'cloud', label: 'Cloud', type: 'capability', category: 'digital',
    aliases: ['클라우드', '클라우드전환'] },
  { id: 'cybersecurity', label: 'Cybersecurity', type: 'capability', category: 'digital',
    aliases: ['사이버보안', '보안', '정보보호'] },
  
  // 전략 역량
  { id: 'corporate-strategy', label: 'Corporate Strategy', type: 'capability', category: 'strategy',
    aliases: ['기업전략', '전사전략'] },
  { id: 'digital-strategy', label: 'Digital Strategy', type: 'capability', category: 'strategy',
    aliases: ['디지털전략'] },
  { id: 'innovation', label: 'Innovation', type: 'capability', category: 'strategy',
    aliases: ['혁신', '이노베이션'] },
  
  // 운영 역량
  { id: 'supply-chain', label: 'Supply Chain', type: 'capability', category: 'operations',
    aliases: ['공급망', 'SCM', 'S&OP'] },
  { id: 'process-optimization', label: 'Process Optimization', type: 'capability', category: 'operations',
    aliases: ['프로세스최적화', '업무개선', 'BPR'] },
  { id: 'cost-reduction', label: 'Cost Reduction', type: 'capability', category: 'operations',
    aliases: ['비용절감', '원가절감'] },
  
  // 기술 플랫폼
  { id: 'sap', label: 'SAP', type: 'technology', category: 'platform',
    aliases: ['SAP', 'ERP'] },
  { id: 'salesforce', label: 'Salesforce', type: 'technology', category: 'platform',
    aliases: ['세일즈포스', 'CRM'] },
  { id: 'palantir', label: 'Palantir', type: 'technology', category: 'platform',
    aliases: ['팔란티어', '데이터플랫폼'] },
  { id: 'alteryx', label: 'Alteryx', type: 'technology', category: 'platform',
    aliases: ['알테릭스', '데이터분석툴'] }
];

// 산출물/결과
export const PWC_DELIVERABLES: PwCEntity[] = [
  // 문서 유형
  { id: 'proposal', label: 'Proposal', type: 'deliverable', category: 'document',
    aliases: ['제안서', '프로포절', 'RFP응답'] },
  { id: 'final-report', label: 'Final Report', type: 'deliverable', category: 'document',
    aliases: ['최종보고서', '결과보고서'] },
  { id: 'executive-summary', label: 'Executive Summary', type: 'deliverable', category: 'document',
    aliases: ['경영진요약', '임원요약', 'ExSum'] },
  { id: 'business-case', label: 'Business Case', type: 'deliverable', category: 'document',
    aliases: ['사업타당성', '비즈니스케이스'] },
  
  // 프레임워크/방법론
  { id: 'operating-model', label: 'Operating Model', type: 'deliverable', category: 'framework',
    aliases: ['운영모델', '조직모델'] },
  { id: 'roadmap', label: 'Roadmap', type: 'deliverable', category: 'framework',
    aliases: ['로드맵', '실행계획'] },
  { id: 'kpi-dashboard', label: 'KPI Dashboard', type: 'deliverable', category: 'framework',
    aliases: ['KPI', '성과지표', '대시보드'] },
  
  // 시스템/도구
  { id: 'data-platform', label: 'Data Platform', type: 'deliverable', category: 'system',
    aliases: ['데이터플랫폼', '데이터레이크'] },
  { id: 'analytics-model', label: 'Analytics Model', type: 'deliverable', category: 'system',
    aliases: ['분석모델', '예측모델'] }
];

// KPI/지표
export const PWC_KPIS: PwCEntity[] = [
  // 재무 KPI
  { id: 'roi', label: 'ROI', type: 'kpi', category: 'financial',
    aliases: ['투자수익률', 'Return on Investment'] },
  { id: 'cost-saving', label: 'Cost Saving', type: 'kpi', category: 'financial',
    aliases: ['비용절감', '원가절감액'] },
  { id: 'revenue-growth', label: 'Revenue Growth', type: 'kpi', category: 'financial',
    aliases: ['매출성장률', '수익증가'] },
  
  // 운영 KPI
  { id: 'efficiency', label: 'Efficiency', type: 'kpi', category: 'operational',
    aliases: ['효율성', '생산성'] },
  { id: 'time-to-market', label: 'Time to Market', type: 'kpi', category: 'operational',
    aliases: ['출시시간', 'TTM'] },
  { id: 'customer-satisfaction', label: 'Customer Satisfaction', type: 'kpi', category: 'operational',
    aliases: ['고객만족도', 'CSAT', 'NPS'] },
  
  // 디지털 KPI
  { id: 'digital-adoption', label: 'Digital Adoption', type: 'kpi', category: 'digital',
    aliases: ['디지털도입률', '디지털활용률'] },
  { id: 'automation-rate', label: 'Automation Rate', type: 'kpi', category: 'digital',
    aliases: ['자동화율', 'RPA효과'] }
];

// 관계 정의
export const PWC_RELATIONSHIPS: PwCRelationship[] = [
  // 조직 계층
  { source: 'pwc-global', target: 'pwc-korea', type: 'contains', weight: 1.0 },
  { source: 'pwc-korea', target: 'advisory', type: 'contains', weight: 1.0 },
  { source: 'pwc-korea', target: 'assurance', type: 'contains', weight: 1.0 },
  { source: 'pwc-korea', target: 'tax', type: 'contains', weight: 1.0 },
  { source: 'pwc-korea', target: 'consulting', type: 'contains', weight: 1.0 },
  
  // Advisory 하위
  { source: 'advisory', target: 'deals', type: 'contains', weight: 1.0 },
  { source: 'advisory', target: 'risk', type: 'contains', weight: 1.0 },
  { source: 'advisory', target: 'forensics', type: 'contains', weight: 1.0 },
  
  // Consulting 하위
  { source: 'consulting', target: 'strategy', type: 'contains', weight: 1.0 },
  { source: 'consulting', target: 'technology', type: 'contains', weight: 1.0 },
  { source: 'consulting', target: 'operations', type: 'contains', weight: 1.0 },
  { source: 'consulting', target: 'people-org', type: 'contains', weight: 1.0 },
  
  // 서비스-역량 매핑
  { source: 'technology', target: 'digital-transformation', type: 'provides', weight: 0.9 },
  { source: 'technology', target: 'ai-analytics', type: 'provides', weight: 0.9 },
  { source: 'technology', target: 'cloud', type: 'provides', weight: 0.8 },
  { source: 'technology', target: 'cybersecurity', type: 'provides', weight: 0.7 },
  
  { source: 'strategy', target: 'corporate-strategy', type: 'provides', weight: 0.9 },
  { source: 'strategy', target: 'digital-strategy', type: 'provides', weight: 0.8 },
  { source: 'strategy', target: 'innovation', type: 'provides', weight: 0.7 },
  
  { source: 'operations', target: 'supply-chain', type: 'provides', weight: 0.9 },
  { source: 'operations', target: 'process-optimization', type: 'provides', weight: 0.8 },
  { source: 'operations', target: 'cost-reduction', type: 'provides', weight: 0.8 },
  
  // 역량-기술 매핑
  { source: 'ai-analytics', target: 'palantir', type: 'uses', weight: 0.8 },
  { source: 'ai-analytics', target: 'alteryx', type: 'uses', weight: 0.7 },
  { source: 'digital-transformation', target: 'sap', type: 'uses', weight: 0.7 },
  { source: 'digital-transformation', target: 'salesforce', type: 'uses', weight: 0.6 },
  
  // 산업-클라이언트 매핑
  { source: 'tmt', target: 'samsung', type: 'includes', weight: 0.9 },
  { source: 'tmt', target: 'lg', type: 'includes', weight: 0.8 },
  { source: 'automotive', target: 'hyundai', type: 'includes', weight: 0.9 },
  { source: 'energy', target: 'sk', type: 'includes', weight: 0.8 },
  
  // 역량-산출물 매핑
  { source: 'corporate-strategy', target: 'business-case', type: 'generates', weight: 0.8 },
  { source: 'digital-strategy', target: 'roadmap', type: 'generates', weight: 0.8 },
  { source: 'ai-analytics', target: 'data-platform', type: 'generates', weight: 0.8 },
  { source: 'ai-analytics', target: 'analytics-model', type: 'generates', weight: 0.9 },
  { source: 'process-optimization', target: 'operating-model', type: 'generates', weight: 0.7 },
  
  // 산출물-KPI 매핑
  { source: 'cost-reduction', target: 'cost-saving', type: 'measures', weight: 0.9 },
  { source: 'digital-transformation', target: 'digital-adoption', type: 'measures', weight: 0.8 },
  { source: 'process-optimization', target: 'efficiency', type: 'measures', weight: 0.8 },
  { source: 'ai-analytics', target: 'automation-rate', type: 'measures', weight: 0.7 },
  
  // 크로스 도메인 관계
  { source: 'samsung', target: 'digital-transformation', type: 'requests', weight: 0.8 },
  { source: 'samsung', target: 'supply-chain', type: 'requests', weight: 0.7 },
  { source: 'hyundai', target: 'ai-analytics', type: 'requests', weight: 0.8 },
  { source: 'lg', target: 'cloud', type: 'requests', weight: 0.7 }
];

// 전체 시드 온톨로지
export const PWC_SEED_ONTOLOGY = {
  entities: [
    ...PWC_ORGANIZATIONS,
    ...PWC_INDUSTRIES,
    ...PWC_CAPABILITIES,
    ...PWC_DELIVERABLES,
    ...PWC_KPIS
  ],
  relationships: PWC_RELATIONSHIPS
};

// 문서 패턴 매핑 규칙
export const DOCUMENT_PATTERNS = {
  // 파일명 패턴
  filename: {
    proposal: /제안서|proposal|rfp/i,
    report: /보고서|report|결과/i,
    strategy: /전략|strategy/i,
    analysis: /분석|analysis/i
  },
  
  // 제목 패턴
  title: {
    executive: /경영진|임원|executive/i,
    digital: /디지털|digital|dx/i,
    ai: /ai|인공지능|머신러닝|ml/i,
    cloud: /클라우드|cloud/i
  },
  
  // 클라이언트 패턴
  client: {
    samsung: /삼성|samsung/i,
    lg: /lg|엘지/i,
    sk: /sk/i,
    hyundai: /현대|hyundai/i
  }
};

// 자동 매핑 함수
export function generateSeedOntology(): { nodes: any[], links: any[] } {
  const nodes = PWC_SEED_ONTOLOGY.entities.map((entity, index) => ({
    id: entity.id,
    label: entity.label,
    type: entity.type,
    category: entity.category,
    x: (index % 10) * 80 - 400,
    y: Math.floor(index / 10) * 80 - 200,
    z: (index % 3) * 50,
    color: getNodeColor(entity.type),
    aliases: entity.aliases || [],
    metadata: entity.metadata || {}
  }));

  const links = PWC_SEED_ONTOLOGY.relationships.map(rel => ({
    source: rel.source,
    target: rel.target,
    type: rel.type,
    strength: rel.weight
  }));

  return { nodes, links };
}

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
  };
  return colors[type] || '#34495e';
}