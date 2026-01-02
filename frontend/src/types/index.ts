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

// 提示词模板（V4.1 精简版）
export interface PromptTemplates {
  analyze_v3: string;     // 对话分析提示词
  retention: string;      // 挽留话术
  review: string;         // 要好评话术
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

// ========== 标签页类型（移除了 analyze）==========

export type TabType = 'sessions' | 'history' | 'pricing';


// ========== V3 会话类型 ==========

export type SessionStatus = 'active' | 'closed';
export type SessionDealStatus = 'pending' | 'success' | 'failed';

export interface SessionSummary {
  id: number;
  status: SessionStatus;
  dealStatus: SessionDealStatus;
  dealPrice: number | null;
  articleType: string | null;
  previewMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionListResponse {
  items: SessionSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSessionRequest {
  firstMessage?: string;
}

export interface UpdateSessionRequest {
  status?: SessionStatus;
  dealStatus?: SessionDealStatus;
  dealPrice?: number;
  articleType?: string;
  requirementSummary?: string;
}

// ========== V3 消息类型 ==========

export interface Message {
  id: number;
  sessionId: number;
  role: 'buyer' | 'seller';
  content: string;
  createdAt: string;
}

export interface CreateMessageRequest {
  content: string;
  role?: 'buyer' | 'seller';
}

export interface AddMessageRequest {
  content: string;
  role?: 'buyer' | 'seller';
  llmConfig?: LLMConfig;
}

// ========== V3 AI分析类型 ==========

export interface ExtractedInfoV3 {
  articleType?: string;
  topic?: string;
  wordCount?: number;
  deadline?: string;
  hasReference?: boolean;
  specialRequirements: string[];
}

export interface PriceEstimateV3 {
  canQuote: boolean;
  min?: number;
  max?: number;
  basis?: string;
}

export interface AIAnalysis {
  id: number;
  sessionId: number;
  messageId: number;
  suggestedReplies: string[];
  extractedInfo: ExtractedInfoV3;
  missingInfo: string[];
  canQuote: boolean;
  priceEstimate?: PriceEstimateV3;
  quickTags: string[];
  createdAt: string;
}

export interface MessageWithAnalysis {
  message: Message;
  analysis: AIAnalysis | null;
}

export interface SendMessageResponse {
  message: Message;
  analysis: AIAnalysis | null;
  error?: string;  // 分析失败时的错误信息
}

// ========== V3 会话详情类型 ==========

export interface SessionDetail {
  id: number;
  status: SessionStatus;
  dealStatus: SessionDealStatus;
  dealPrice: number | null;
  articleType: string | null;
  requirementSummary: string | null;
  messages: MessageWithAnalysis[];
  latestAnalysis: AIAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

// ========== V3 挽留话术类型 ==========

export interface RetentionTemplate {
  id: number;
  content: string;
  isDefault: boolean;
  createdAt: string;
}

export interface UpdateRetentionTemplateRequest {
  content: string;
}

// ========== V3 需求要点类型 ==========

export interface RequirementSummary {
  articleType: string;
  wordCount?: number;
  deadline?: string;
  topic?: string;
  requirements: string[];
  notes?: string;
}

export interface SummarizeRequest {
  llmConfig: LLMConfig;
}
