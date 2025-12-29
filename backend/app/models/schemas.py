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
