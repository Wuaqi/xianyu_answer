import json
from datetime import datetime
from typing import Optional
from math import ceil

from ..database import get_db
from ..models.schemas import (
    HistoryRecord,
    HistoryListResponse,
    CreateHistoryRequest,
    UpdateHistoryRequest,
    ExtractedInfo,
)


def create_history(request: CreateHistoryRequest) -> dict:
    """创建历史记录"""
    with get_db() as conn:
        cursor = conn.cursor()

        result = request.analysisResult
        detected_type_name = result.detectedType.name if result.detectedType else None

        cursor.execute(
            """
            INSERT INTO history_records (
                buyer_message, detected_type_name, confidence,
                extracted_info, missing_info, suggested_reply,
                price_min, price_max, price_basis
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                request.buyerMessage,
                detected_type_name,
                result.confidence,
                json.dumps(result.extractedInfo.model_dump(), ensure_ascii=False),
                json.dumps(result.missingInfo, ensure_ascii=False),
                result.suggestedReply,
                result.priceEstimate.min,
                result.priceEstimate.max,
                result.priceEstimate.basis,
            ),
        )

        record_id = cursor.lastrowid
        return {"id": record_id, "createdAt": datetime.now().isoformat()}


def get_history_list(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    article_type: Optional[str] = None,
    deal_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> HistoryListResponse:
    """获取历史记录列表"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 构建查询条件
        conditions = []
        params = []

        if search:
            conditions.append("buyer_message LIKE ?")
            params.append(f"%{search}%")

        if article_type:
            conditions.append("article_type = ?")
            params.append(article_type)

        if deal_status:
            conditions.append("deal_status = ?")
            params.append(deal_status)

        if start_date:
            conditions.append("created_at >= ?")
            params.append(start_date)

        if end_date:
            conditions.append("created_at <= ?")
            params.append(end_date + " 23:59:59")

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # 获取总数
        cursor.execute(
            f"SELECT COUNT(*) FROM history_records WHERE {where_clause}",
            params,
        )
        total = cursor.fetchone()[0]

        # 计算分页
        total_pages = ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        # 获取数据
        cursor.execute(
            f"""
            SELECT * FROM history_records
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            params + [page_size, offset],
        )

        rows = cursor.fetchall()
        items = [_row_to_history_record(row) for row in rows]

        return HistoryListResponse(
            items=items,
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
        )


def get_history_by_id(record_id: int) -> Optional[HistoryRecord]:
    """获取单条历史记录"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM history_records WHERE id = ?", (record_id,))
        row = cursor.fetchone()

        if row is None:
            return None

        return _row_to_history_record(row)


def update_history(record_id: int, request: UpdateHistoryRequest) -> bool:
    """更新历史记录标记"""
    with get_db() as conn:
        cursor = conn.cursor()

        updates = []
        params = []

        if request.articleType is not None:
            updates.append("article_type = ?")
            params.append(request.articleType)

        if request.dealStatus is not None:
            updates.append("deal_status = ?")
            params.append(request.dealStatus)

        if not updates:
            return False

        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(record_id)

        cursor.execute(
            f"UPDATE history_records SET {', '.join(updates)} WHERE id = ?",
            params,
        )

        return cursor.rowcount > 0


def delete_history(record_id: int) -> bool:
    """删除历史记录"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM history_records WHERE id = ?", (record_id,))
        return cursor.rowcount > 0


def get_article_types() -> list[str]:
    """获取所有已使用的文章类型"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT article_type FROM history_records
            WHERE article_type IS NOT NULL AND article_type != ''
            ORDER BY article_type
            """
        )
        return [row[0] for row in cursor.fetchall()]


def _row_to_history_record(row) -> HistoryRecord:
    """将数据库行转换为 HistoryRecord"""
    extracted_info_data = json.loads(row["extracted_info"]) if row["extracted_info"] else {}
    missing_info = json.loads(row["missing_info"]) if row["missing_info"] else []

    return HistoryRecord(
        id=row["id"],
        buyerMessage=row["buyer_message"],
        detectedTypeName=row["detected_type_name"],
        confidence=row["confidence"] or 0.0,
        extractedInfo=ExtractedInfo(**extracted_info_data),
        missingInfo=missing_info,
        suggestedReply=row["suggested_reply"],
        priceMin=row["price_min"] or 0,
        priceMax=row["price_max"] or 0,
        priceBasis=row["price_basis"] or "",
        articleType=row["article_type"],
        dealStatus=row["deal_status"] or "pending",
        createdAt=datetime.fromisoformat(row["created_at"]),
        updatedAt=datetime.fromisoformat(row["updated_at"]),
    )
