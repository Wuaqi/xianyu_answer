from fastapi import APIRouter, HTTPException

from ..models.schemas import (
    CreateTemplateRequest,
    UpdateTemplateRequest,
    ReplyTemplate,
    TemplateListResponse,
)
from ..services import template_service

router = APIRouter()


@router.get("/templates", response_model=TemplateListResponse)
async def get_templates():
    """获取所有模板"""
    return template_service.get_templates()


@router.post("/templates", response_model=ReplyTemplate, status_code=201)
async def create_template(request: CreateTemplateRequest):
    """创建模板"""
    return template_service.create_template(request)


@router.put("/templates/{template_id}")
async def update_template(template_id: int, request: UpdateTemplateRequest):
    """更新模板"""
    success = template_service.update_template(template_id, request)
    if not success:
        raise HTTPException(status_code=404, detail="模板不存在")
    return {"success": True}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: int):
    """删除模板"""
    success = template_service.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="模板不存在")
    return {"success": True}
