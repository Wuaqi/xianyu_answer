from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models.schemas import (
    ReplyTemplate,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    TemplateListResponse,
)


def get_templates() -> TemplateListResponse:
    """获取所有模板"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM reply_templates ORDER BY sort_order ASC"
        )
        rows = cursor.fetchall()

        items = [
            ReplyTemplate(
                id=row["id"],
                title=row["title"],
                content=row["content"],
                sortOrder=row["sort_order"],
                createdAt=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]

        return TemplateListResponse(items=items)


def get_template_by_id(template_id: int) -> Optional[ReplyTemplate]:
    """获取单个模板"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reply_templates WHERE id = ?", (template_id,))
        row = cursor.fetchone()

        if row is None:
            return None

        return ReplyTemplate(
            id=row["id"],
            title=row["title"],
            content=row["content"],
            sortOrder=row["sort_order"],
            createdAt=datetime.fromisoformat(row["created_at"]),
        )


def create_template(request: CreateTemplateRequest) -> ReplyTemplate:
    """创建模板"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 获取最大排序值
        cursor.execute("SELECT MAX(sort_order) FROM reply_templates")
        max_order = cursor.fetchone()[0] or 0

        cursor.execute(
            """
            INSERT INTO reply_templates (title, content, sort_order)
            VALUES (?, ?, ?)
            """,
            (request.title, request.content, max_order + 1),
        )

        template_id = cursor.lastrowid
        return get_template_by_id(template_id)


def update_template(template_id: int, request: UpdateTemplateRequest) -> bool:
    """更新模板"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE reply_templates
            SET title = ?, content = ?, updated_at = ?
            WHERE id = ?
            """,
            (request.title, request.content, datetime.now().isoformat(), template_id),
        )
        return cursor.rowcount > 0


def delete_template(template_id: int) -> bool:
    """删除模板"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reply_templates WHERE id = ?", (template_id,))
        return cursor.rowcount > 0
