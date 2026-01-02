"""
V3 会话服务层
处理会话、消息、AI分析的 CRUD 操作
"""
import json
from datetime import datetime
from typing import Optional
from math import ceil

from ..database import get_db
from ..models.schemas import (
    CreateSessionRequest,
    UpdateSessionRequest,
    SessionSummary,
    SessionListResponse,
    SessionDetail,
    Message,
    CreateMessageRequest,
    MessageWithAnalysis,
    AIAnalysis,
    ExtractedInfoV3,
    PriceEstimateV3,
    RetentionTemplate,
    UpdateRetentionTemplateRequest,
)


# ========== 会话管理 ==========

def create_session(request: CreateSessionRequest) -> dict:
    """创建新会话"""
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now().isoformat()

        cursor.execute(
            "INSERT INTO sessions (status, deal_status, created_at, updated_at) VALUES (?, ?, ?, ?)",
            ("active", "pending", now, now)
        )
        session_id = cursor.lastrowid

        # 如果传入了第一条消息，也创建消息
        if request.firstMessage:
            cursor.execute(
                "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
                (session_id, "buyer", request.firstMessage, now)
            )

        return {
            "id": session_id,
            "createdAt": now
        }


def get_session_list(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    deal_status: Optional[str] = None,
    search: Optional[str] = None,
) -> SessionListResponse:
    """获取会话列表"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 构建查询条件
        conditions = []
        params = []

        if status:
            conditions.append("s.status = ?")
            params.append(status)

        if deal_status:
            conditions.append("s.deal_status = ?")
            params.append(deal_status)

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        # 获取总数
        count_sql = f"""
            SELECT COUNT(*) FROM sessions s
            {where_clause}
        """
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]

        # 计算分页
        total_pages = ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        # 获取会话列表，并关联第一条消息和消息数量
        list_sql = f"""
            SELECT
                s.id,
                s.status,
                s.deal_status,
                s.deal_price,
                s.article_type,
                s.created_at,
                s.updated_at,
                (SELECT content FROM messages WHERE session_id = s.id ORDER BY created_at ASC LIMIT 1) as first_message,
                (SELECT COUNT(*) FROM messages WHERE session_id = s.id) as message_count
            FROM sessions s
            {where_clause}
            ORDER BY s.updated_at DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(list_sql, params + [page_size, offset])
        rows = cursor.fetchall()

        # 如果有搜索条件，过滤结果
        items = []
        for row in rows:
            first_message = row["first_message"] or ""
            if search and search.lower() not in first_message.lower():
                continue

            items.append(SessionSummary(
                id=row["id"],
                status=row["status"],
                dealStatus=row["deal_status"],
                dealPrice=row["deal_price"],
                articleType=row["article_type"],
                previewMessage=first_message[:100] if first_message else "",
                messageCount=row["message_count"],
                createdAt=datetime.fromisoformat(row["created_at"]),
                updatedAt=datetime.fromisoformat(row["updated_at"]),
            ))

        return SessionListResponse(
            items=items,
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
        )


def get_session_by_id(session_id: int) -> Optional[SessionDetail]:
    """获取会话详情，包含所有消息和分析"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 获取会话基本信息
        cursor.execute(
            "SELECT * FROM sessions WHERE id = ?",
            (session_id,)
        )
        session_row = cursor.fetchone()

        if session_row is None:
            return None

        # 获取所有消息
        cursor.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        )
        message_rows = cursor.fetchall()

        # 获取所有AI分析
        cursor.execute(
            "SELECT * FROM ai_analyses WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        )
        analysis_rows = cursor.fetchall()

        # 构建消息ID到分析的映射
        analysis_map = {}
        for row in analysis_rows:
            analysis_map[row["message_id"]] = _row_to_analysis(row)

        # 组装消息列表
        messages_with_analysis = []
        for msg_row in message_rows:
            message = _row_to_message(msg_row)
            analysis = analysis_map.get(message.id)
            messages_with_analysis.append(MessageWithAnalysis(
                message=message,
                analysis=analysis,
            ))

        # 获取最新的AI分析
        latest_analysis = None
        if analysis_rows:
            latest_analysis = _row_to_analysis(analysis_rows[-1])

        return SessionDetail(
            id=session_row["id"],
            status=session_row["status"],
            dealStatus=session_row["deal_status"],
            dealPrice=session_row["deal_price"],
            articleType=session_row["article_type"],
            requirementSummary=session_row["requirement_summary"],
            messages=messages_with_analysis,
            latestAnalysis=latest_analysis,
            createdAt=datetime.fromisoformat(session_row["created_at"]),
            updatedAt=datetime.fromisoformat(session_row["updated_at"]),
        )


def update_session(session_id: int, request: UpdateSessionRequest) -> bool:
    """更新会话"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 构建更新字段
        updates = []
        params = []

        if request.status is not None:
            updates.append("status = ?")
            params.append(request.status)

        if request.dealStatus is not None:
            updates.append("deal_status = ?")
            params.append(request.dealStatus)

        if request.dealPrice is not None:
            updates.append("deal_price = ?")
            params.append(request.dealPrice)

        if request.articleType is not None:
            updates.append("article_type = ?")
            params.append(request.articleType)

        if request.requirementSummary is not None:
            updates.append("requirement_summary = ?")
            params.append(request.requirementSummary)

        if not updates:
            return True

        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(session_id)

        sql = f"UPDATE sessions SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(sql, params)

        return cursor.rowcount > 0


def delete_session(session_id: int) -> bool:
    """删除会话（级联删除消息和分析）"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 由于设置了 ON DELETE CASCADE，直接删除会话即可
        cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))

        return cursor.rowcount > 0


# ========== 消息管理 ==========

def add_message(session_id: int, request: CreateMessageRequest) -> Message:
    """添加消息到会话"""
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now().isoformat()

        # 检查会话是否存在
        cursor.execute("SELECT id FROM sessions WHERE id = ?", (session_id,))
        if cursor.fetchone() is None:
            raise ValueError(f"Session {session_id} not found")

        # 插入消息（使用本地时间）
        cursor.execute(
            "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            (session_id, request.role, request.content, now)
        )
        message_id = cursor.lastrowid

        # 更新会话的 updated_at
        cursor.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?",
            (now, session_id)
        )

        # 获取创建的消息
        cursor.execute("SELECT * FROM messages WHERE id = ?", (message_id,))
        row = cursor.fetchone()

        return _row_to_message(row)


def get_messages(session_id: int) -> list[Message]:
    """获取会话的所有消息"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        )
        rows = cursor.fetchall()

        return [_row_to_message(row) for row in rows]


# ========== AI分析管理 ==========

def save_analysis(
    session_id: int,
    message_id: int,
    suggested_replies: list[str],
    extracted_info: ExtractedInfoV3,
    missing_info: list[str],
    can_quote: bool,
    price_min: Optional[int],
    price_max: Optional[int],
    price_basis: Optional[str],
    quick_tags: list[str],
) -> AIAnalysis:
    """保存AI分析结果"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO ai_analyses (
                session_id, message_id, suggested_replies, extracted_info,
                missing_info, can_quote, price_min, price_max, price_basis, quick_tags,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                message_id,
                json.dumps(suggested_replies, ensure_ascii=False),
                json.dumps(extracted_info.model_dump(), ensure_ascii=False),
                json.dumps(missing_info, ensure_ascii=False),
                1 if can_quote else 0,
                price_min,
                price_max,
                price_basis,
                json.dumps(quick_tags, ensure_ascii=False),
                datetime.now().isoformat(),  # 使用本地时间
            )
        )
        analysis_id = cursor.lastrowid

        # 如果 AI 分析提取到了文章类型，自动更新到 session
        if extracted_info.articleType:
            cursor.execute(
                "UPDATE sessions SET article_type = ?, updated_at = ? WHERE id = ? AND article_type IS NULL",
                (extracted_info.articleType, datetime.now().isoformat(), session_id)
            )

        # 获取创建的分析
        cursor.execute("SELECT * FROM ai_analyses WHERE id = ?", (analysis_id,))
        row = cursor.fetchone()

        return _row_to_analysis(row)


def get_latest_analysis(session_id: int) -> Optional[AIAnalysis]:
    """获取会话的最新AI分析"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT * FROM ai_analyses
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (session_id,)
        )
        row = cursor.fetchone()

        if row is None:
            return None

        return _row_to_analysis(row)


# ========== 挽留话术管理 ==========

def get_retention_template() -> Optional[RetentionTemplate]:
    """获取默认挽留话术"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM retention_templates WHERE is_default = 1 LIMIT 1"
        )
        row = cursor.fetchone()

        if row is None:
            return None

        return RetentionTemplate(
            id=row["id"],
            content=row["content"],
            isDefault=bool(row["is_default"]),
            createdAt=datetime.fromisoformat(row["created_at"]),
        )


def update_retention_template(request: UpdateRetentionTemplateRequest) -> bool:
    """更新默认挽留话术"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 先检查是否存在默认模板
        cursor.execute("SELECT id FROM retention_templates WHERE is_default = 1")
        row = cursor.fetchone()

        if row:
            # 更新现有模板
            cursor.execute(
                "UPDATE retention_templates SET content = ? WHERE id = ?",
                (request.content, row["id"])
            )
        else:
            # 创建新模板
            cursor.execute(
                "INSERT INTO retention_templates (content, is_default) VALUES (?, 1)",
                (request.content,)
            )

        return True


# ========== 要好评话术管理 ==========

def get_review_template() -> Optional[RetentionTemplate]:
    """获取默认要好评话术"""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM review_templates WHERE is_default = 1 LIMIT 1"
        )
        row = cursor.fetchone()

        if row is None:
            return None

        return RetentionTemplate(
            id=row["id"],
            content=row["content"],
            isDefault=bool(row["is_default"]),
            createdAt=datetime.fromisoformat(row["created_at"]),
        )


def update_review_template(request: UpdateRetentionTemplateRequest) -> bool:
    """更新默认要好评话术"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 先检查是否存在默认模板
        cursor.execute("SELECT id FROM review_templates WHERE is_default = 1")
        row = cursor.fetchone()

        if row:
            # 更新现有模板
            cursor.execute(
                "UPDATE review_templates SET content = ? WHERE id = ?",
                (request.content, row["id"])
            )
        else:
            # 创建新模板
            cursor.execute(
                "INSERT INTO review_templates (content, is_default) VALUES (?, 1)",
                (request.content,)
            )

        return True


# ========== 辅助函数 ==========

def _row_to_message(row) -> Message:
    """将数据库行转换为 Message 对象"""
    return Message(
        id=row["id"],
        sessionId=row["session_id"],
        role=row["role"],
        content=row["content"],
        createdAt=datetime.fromisoformat(row["created_at"]),
    )


def _row_to_analysis(row) -> AIAnalysis:
    """将数据库行转换为 AIAnalysis 对象"""
    extracted_info_data = json.loads(row["extracted_info"]) if row["extracted_info"] else {}

    price_estimate = None
    if row["can_quote"]:
        price_estimate = PriceEstimateV3(
            canQuote=True,
            min=row["price_min"],
            max=row["price_max"],
            basis=row["price_basis"],
        )

    return AIAnalysis(
        id=row["id"],
        sessionId=row["session_id"],
        messageId=row["message_id"],
        suggestedReplies=json.loads(row["suggested_replies"]) if row["suggested_replies"] else [],
        extractedInfo=ExtractedInfoV3(**extracted_info_data),
        missingInfo=json.loads(row["missing_info"]) if row["missing_info"] else [],
        canQuote=bool(row["can_quote"]),
        priceEstimate=price_estimate,
        quickTags=json.loads(row["quick_tags"]) if row["quick_tags"] else [],
        createdAt=datetime.fromisoformat(row["created_at"]),
    )


# ========== 消息分析流程（异步） ==========

async def send_message_and_analyze(
    session_id: int,
    content: str,
    config,  # LLMConfig
) -> dict:
    """
    发送买家消息并进行 AI 分析

    Args:
        session_id: 会话 ID
        content: 消息内容
        config: LLM 配置

    Returns:
        dict: 包含 message 和 analysis 的响应
    """
    from . import llm_service

    # 1. 保存买家消息
    message = add_message(session_id, CreateMessageRequest(content=content, role="buyer"))

    # 2. 获取会话所有历史消息
    all_messages = get_messages(session_id)

    # 3. 获取之前的累积信息（如果有）
    latest_analysis = get_latest_analysis(session_id)
    accumulated_info = latest_analysis.extractedInfo if latest_analysis else None

    # 4. 调用 LLM 分析
    try:
        result = await llm_service.analyze_conversation(
            messages=all_messages,
            config=config,
            accumulated_info=accumulated_info,
        )

        # 5. 保存 AI 分析结果
        analysis = save_analysis(
            session_id=session_id,
            message_id=message.id,
            suggested_replies=result.suggested_replies,
            extracted_info=result.extracted_info,
            missing_info=result.missing_info,
            can_quote=result.can_quote,
            price_min=result.price_min,
            price_max=result.price_max,
            price_basis=result.price_basis,
            quick_tags=result.quick_tags,
        )

        return {
            "message": message,
            "analysis": analysis,
        }

    except Exception as e:
        # 即使分析失败，消息也已保存
        # 返回消息但分析为空
        return {
            "message": message,
            "analysis": None,
            "error": str(e),
        }


async def summarize_session_requirements(
    session_id: int,
    config,  # LLMConfig
) -> dict:
    """
    提炼会话的需求要点

    Args:
        session_id: 会话 ID
        config: LLM 配置

    Returns:
        dict: RequirementSummary 的字典形式
    """
    from . import llm_service

    # 获取所有消息
    messages = get_messages(session_id)

    if not messages:
        raise ValueError("会话没有消息")

    # 调用 LLM 提炼需求
    summary = await llm_service.summarize_requirements(messages, config)

    # 更新会话的 requirement_summary 字段
    from ..models.schemas import UpdateSessionRequest
    update_session(session_id, UpdateSessionRequest(
        requirementSummary=json.dumps(summary.model_dump(), ensure_ascii=False)
    ))

    return summary.model_dump()
