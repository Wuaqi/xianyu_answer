from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..prompts.analyze_prompt import load_template, save_template

router = APIRouter()


class PromptTemplates(BaseModel):
    analyze_v3: str


class UpdatePromptRequest(BaseModel):
    analyze_v3: str | None = None


@router.get("/prompts", response_model=PromptTemplates)
async def get_prompts():
    """获取提示词模板"""
    try:
        return PromptTemplates(
            analyze_v3=load_template("analyze_v3"),
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/prompts")
async def update_prompts(request: UpdatePromptRequest):
    """更新提示词模板"""
    try:
        if request.analyze_v3 is not None:
            save_template("analyze_v3", request.analyze_v3)
        return {"success": True, "message": "提示词已更新"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")
