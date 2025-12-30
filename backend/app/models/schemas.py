from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LLMConfig(BaseModel):
    baseUrl: str
    apiKey: str
    modelId: str


class ServiceType(BaseModel):
    id: int
    name: str
    priceSimple: Optional[int] = None
    priceComplex: Optional[int] = None
    unit: str  # 'thousand' | 'page' | 'minute' | 'piece'
    requiresMaterial: bool = False
    note: str = ""


class AnalysisRequest(BaseModel):
    message: str
    llmConfig: LLMConfig


class ExtractedInfo(BaseModel):
    topic: Optional[str] = None
    wordCount: Optional[int] = None
    deadline: Optional[str] = None
    hasReference: Optional[bool] = None
    specialRequirements: Optional[list[str]] = None


class PriceEstimate(BaseModel):
    min: int
    max: int
    basis: str
    canQuote: bool


class AnalysisResponse(BaseModel):
    detectedType: Optional[ServiceType] = None
    possibleTypes: list[ServiceType] = []
    confidence: float = 0.0
    extractedInfo: ExtractedInfo
    missingInfo: list[str] = []
    suggestedReply: str
    priceEstimate: PriceEstimate


# ========== 历史记录模型 ==========

class CreateHistoryRequest(BaseModel):
    buyerMessage: str
    analysisResult: AnalysisResponse


class UpdateHistoryRequest(BaseModel):
    articleType: Optional[str] = None
    dealStatus: Optional[str] = None  # pending, closed, failed


class HistoryRecord(BaseModel):
    id: int
    buyerMessage: str
    detectedTypeName: Optional[str] = None
    confidence: float = 0.0
    extractedInfo: ExtractedInfo
    missingInfo: list[str] = []
    suggestedReply: str
    priceMin: int = 0
    priceMax: int = 0
    priceBasis: str = ""
    articleType: Optional[str] = None
    dealStatus: str = "pending"
    createdAt: datetime
    updatedAt: datetime


class HistoryListResponse(BaseModel):
    items: list[HistoryRecord]
    total: int
    page: int
    pageSize: int
    totalPages: int


class ArticleTypesResponse(BaseModel):
    types: list[str]


# ========== 回复模板模型 ==========

class ReplyTemplate(BaseModel):
    id: int
    title: str
    content: str
    sortOrder: int = 0
    createdAt: datetime


class CreateTemplateRequest(BaseModel):
    title: str
    content: str


class UpdateTemplateRequest(BaseModel):
    title: str
    content: str


class TemplateListResponse(BaseModel):
    items: list[ReplyTemplate]


# ========== V3 会话模型 ==========

class CreateSessionRequest(BaseModel):
    """创建会话请求，可选传入第一条买家消息"""
    firstMessage: Optional[str] = None


class UpdateSessionRequest(BaseModel):
    """更新会话请求"""
    status: Optional[str] = None  # active, closed
    dealStatus: Optional[str] = None  # pending, success, failed
    dealPrice: Optional[int] = None
    articleType: Optional[str] = None
    requirementSummary: Optional[str] = None


class SessionSummary(BaseModel):
    """会话列表项"""
    id: int
    status: str
    dealStatus: str
    dealPrice: Optional[int] = None
    articleType: Optional[str] = None
    previewMessage: str  # 第一条买家消息的前100字
    messageCount: int
    createdAt: datetime
    updatedAt: datetime


class SessionListResponse(BaseModel):
    """会话列表响应"""
    items: list[SessionSummary]
    total: int
    page: int
    pageSize: int
    totalPages: int


# ========== V3 消息模型 ==========

class Message(BaseModel):
    """对话消息"""
    id: int
    sessionId: int
    role: str  # buyer, seller
    content: str
    createdAt: datetime


class CreateMessageRequest(BaseModel):
    """创建消息请求"""
    content: str
    role: str = "buyer"


class AddMessageRequest(BaseModel):
    """添加消息并分析请求"""
    content: str
    role: str = "buyer"
    llmConfig: Optional[LLMConfig] = None  # 如果是买家消息，需要LLM配置进行分析


# ========== V3 AI分析模型 ==========

class ExtractedInfoV3(BaseModel):
    """V3版本的提取信息，支持累积"""
    articleType: Optional[str] = None
    topic: Optional[str] = None
    wordCount: Optional[int] = None
    deadline: Optional[str] = None
    hasReference: Optional[bool] = None
    specialRequirements: list[str] = []


class PriceEstimateV3(BaseModel):
    """V3版本的报价估算"""
    canQuote: bool = False
    min: Optional[int] = None
    max: Optional[int] = None
    basis: Optional[str] = None


class AIAnalysis(BaseModel):
    """AI分析结果"""
    id: int
    sessionId: int
    messageId: int
    suggestedReplies: list[str]  # 3-5个推荐回复
    extractedInfo: ExtractedInfoV3
    missingInfo: list[str]
    canQuote: bool
    priceEstimate: Optional[PriceEstimateV3] = None
    quickTags: list[str]
    createdAt: datetime


class MessageWithAnalysis(BaseModel):
    """消息及其AI分析"""
    message: Message
    analysis: Optional[AIAnalysis] = None


class SendMessageResponse(BaseModel):
    """发送消息并分析的响应"""
    message: Message
    analysis: Optional[AIAnalysis] = None
    error: Optional[str] = None  # 分析失败时的错误信息


# ========== V3 会话详情 ==========

class SessionDetail(BaseModel):
    """会话详情，包含所有消息和分析"""
    id: int
    status: str
    dealStatus: str
    dealPrice: Optional[int] = None
    articleType: Optional[str] = None
    requirementSummary: Optional[str] = None
    messages: list[MessageWithAnalysis]
    latestAnalysis: Optional[AIAnalysis] = None
    createdAt: datetime
    updatedAt: datetime


# ========== V3 挽留话术 ==========

class RetentionTemplate(BaseModel):
    """挽留话术模板"""
    id: int
    content: str
    isDefault: bool
    createdAt: datetime


class UpdateRetentionTemplateRequest(BaseModel):
    """更新挽留话术请求"""
    content: str


# ========== V3 需求要点 ==========

class RequirementSummary(BaseModel):
    """需求要点摘要"""
    articleType: str
    wordCount: Optional[int] = None
    deadline: Optional[str] = None
    topic: Optional[str] = None
    requirements: list[str] = []
    notes: Optional[str] = None


class SummarizeRequest(BaseModel):
    """提炼需求要点请求"""
    llmConfig: LLMConfig
