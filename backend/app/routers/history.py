from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ..models.schemas import (
    CreateHistoryRequest,
    UpdateHistoryRequest,
    HistoryRecord,
    HistoryListResponse,
    ArticleTypesResponse,
)
from ..services import history_service

router = APIRouter()


@router.post("/history", status_code=201)
async def create_history(request: CreateHistoryRequest):
    """创建历史记录"""
    result = history_service.create_history(request)
    return result


@router.get("/history", response_model=HistoryListResponse)
async def get_history_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    articleType: Optional[str] = None,
    dealStatus: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
):
    """获取历史记录列表"""
    return history_service.get_history_list(
        page=page,
        page_size=pageSize,
        search=search,
        article_type=articleType,
        deal_status=dealStatus,
        start_date=startDate,
        end_date=endDate,
    )


@router.get("/history/article-types", response_model=ArticleTypesResponse)
async def get_article_types():
    """获取所有已使用的文章类型"""
    types = history_service.get_article_types()
    return ArticleTypesResponse(types=types)


@router.get("/history/{record_id}", response_model=HistoryRecord)
async def get_history(record_id: int):
    """获取单条历史记录"""
    record = history_service.get_history_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.patch("/history/{record_id}")
async def update_history(record_id: int, request: UpdateHistoryRequest):
    """更新历史记录标记"""
    success = history_service.update_history(record_id, request)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}


@router.delete("/history/{record_id}")
async def delete_history(record_id: int):
    """删除历史记录"""
    success = history_service.delete_history(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}
