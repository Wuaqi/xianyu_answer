// 大模型配置
export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

// 服务类型
export interface ServiceType {
  id: number;
  name: string;
  priceSimple: number | null;
  priceComplex: number | null;
  unit: 'thousand' | 'page' | 'minute' | 'piece';
  requiresMaterial: boolean;
  note: string;
}

// 分析请求
export interface AnalysisRequest {
  message: string;
  llmConfig: LLMConfig;
}

// 提取的信息
export interface ExtractedInfo {
  topic?: string;
  wordCount?: number;
  deadline?: string;
  hasReference?: boolean;
  specialRequirements?: string[];
}

// 报价信息
export interface PriceEstimate {
  min: number;
  max: number;
  basis: string;
  canQuote: boolean;
}

// 分析响应
export interface AnalysisResponse {
  detectedType: ServiceType | null;
  possibleTypes: ServiceType[];
  confidence: number;
  extractedInfo: ExtractedInfo;
  missingInfo: string[];
  suggestedReply: string;
  priceEstimate: PriceEstimate;
}

// 应用状态
export interface AppState {
  message: string;
  isAnalyzing: boolean;
  result: AnalysisResponse | null;
  error: string | null;
}

// 提示词模板
export interface PromptTemplates {
  analyze: string;
  system: string;
}

// ========== 历史记录类型 ==========

export type DealStatus = 'pending' | 'closed' | 'failed';

export interface HistoryRecord {
  id: number;
  buyerMessage: string;
  detectedTypeName: string | null;
  confidence: number;
  extractedInfo: ExtractedInfo;
  missingInfo: string[];
  suggestedReply: string;
  priceMin: number;
  priceMax: number;
  priceBasis: string;
  articleType: string | null;
  dealStatus: DealStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryListResponse {
  items: HistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HistoryFilter {
  search: string;
  articleType: string;
  dealStatus: string;
  startDate: string;
  endDate: string;
}

export interface CreateHistoryRequest {
  buyerMessage: string;
  analysisResult: AnalysisResponse;
}

export interface UpdateHistoryRequest {
  articleType?: string;
  dealStatus?: DealStatus;
}

// ========== 回复模板类型 ==========

export interface ReplyTemplate {
  id: number;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: string;
}

export interface TemplateListResponse {
  items: ReplyTemplate[];
}

export interface CreateTemplateRequest {
  title: string;
  content: string;
}

export interface UpdateTemplateRequest {
  title: string;
  content: string;
}

// ========== 标签页类型 ==========

export type TabType = 'analyze' | 'history';
