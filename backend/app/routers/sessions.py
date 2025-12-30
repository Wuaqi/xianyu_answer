"""
V3 会话路由
处理会话、消息、挽留话术的 HTTP 请求
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ..models.schemas import (
    CreateSessionRequest,
    UpdateSessionRequest,
    SessionListResponse,
    SessionDetail,
    CreateMessageRequest,
    AddMessageRequest,
    Message,
    SendMessageResponse,
    RetentionTemplate,
    UpdateRetentionTemplateRequest,
    SummarizeRequest,
    RequirementSummary,
    LLMConfig,
)
from ..services import session_service

router = APIRouter()


# ========== 会话 CRUD ==========

@router.post("/sessions", status_code=201)
async def create_session(request: CreateSessionRequest = None):
    """创建新会话"""
    if request is None:
        request = CreateSessionRequest()
    result = session_service.create_session(request)
    return result


@router.get("/sessions", response_model=SessionListResponse)
async def get_session_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="会话状态: active, closed"),
    dealStatus: Optional[str] = Query(None, description="成交状态: pending, success, failed"),
    search: Optional[str] = Query(None, description="搜索关键词"),
):
    """获取会话列表"""
    return session_service.get_session_list(
        page=page,
        page_size=pageSize,
        status=status,
        deal_status=dealStatus,
        search=search,
    )


@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session(session_id: int):
    """获取会话详情"""
    session = session_service.get_session_by_id(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="会话不存在")
    return session


@router.patch("/sessions/{session_id}")
async def update_session(session_id: int, request: UpdateSessionRequest):
    """更新会话"""
    success = session_service.update_session(session_id, request)
    if not success:
        raise HTTPException(status_code=404, detail="会话不存在")
    return {"success": True}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int):
    """删除会话"""
    success = session_service.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="会话不存在")
    return {"success": True}


# ========== 消息管理 ==========

@router.post("/sessions/{session_id}/messages", response_model=Message)
async def add_message(session_id: int, request: CreateMessageRequest):
    """添加消息到会话（仅保存消息，不进行AI分析）"""
    try:
        message = session_service.add_message(session_id, request)
        return message
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions/{session_id}/messages", response_model=list[Message])
async def get_messages(session_id: int):
    """获取会话的所有消息"""
    messages = session_service.get_messages(session_id)
    return messages


# ========== 挽留话术 ==========

@router.get("/retention-template", response_model=RetentionTemplate)
async def get_retention_template():
    """获取默认挽留话术"""
    template = session_service.get_retention_template()
    if template is None:
        raise HTTPException(status_code=404, detail="挽留话术不存在")
    return template


@router.put("/retention-template")
async def update_retention_template(request: UpdateRetentionTemplateRequest):
    """更新默认挽留话术"""
    session_service.update_retention_template(request)
    return {"success": True}


# ========== 消息分析 ==========

@router.post("/sessions/{session_id}/analyze", response_model=SendMessageResponse)
async def analyze_message(session_id: int, request: AddMessageRequest):
    """
    发送买家消息并进行AI分析

    - 保存买家消息到会话
    - 获取完整对话历史
    - 调用LLM进行多轮对话分析
    - 返回3-5个推荐回复、提取的信息、报价建议等
    """
    if request.llmConfig is None:
        raise HTTPException(status_code=400, detail="缺少LLM配置")

    try:
        result = await session_service.send_message_and_analyze(
            session_id=session_id,
            content=request.content,
            config=request.llmConfig,
        )

        if "error" in result:
            # 消息已保存但分析失败，返回具体错误信息
            return SendMessageResponse(
                message=result["message"],
                analysis=None,
                error=result["error"],
            )

        return SendMessageResponse(
            message=result["message"],
            analysis=result["analysis"],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


# ========== 需求提炼 ==========

@router.post("/sessions/{session_id}/summarize", response_model=RequirementSummary)
async def summarize_requirements(session_id: int, request: SummarizeRequest):
    """
    提炼会话的需求要点

    - 分析完整对话历史
    - 提取关键需求信息
    - 用于结束会话时展示需求摘要
    """
    try:
        summary = await session_service.summarize_session_requirements(
            session_id=session_id,
            config=request.llmConfig,
        )
        return RequirementSummary(**summary)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"提炼需求失败: {str(e)}")
