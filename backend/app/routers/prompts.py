from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..prompts.analyze_prompt import load_template, save_template

router = APIRouter()


class PromptTemplates(BaseModel):
    analyze: str
    system: str
    analyze_v3: str


class UpdatePromptRequest(BaseModel):
    analyze: str | None = None
    system: str | None = None
    analyze_v3: str | None = None


@router.get("/prompts", response_model=PromptTemplates)
async def get_prompts():
    """获取提示词模板"""
    try:
        return PromptTemplates(
            analyze=load_template("analyze"),
            system=load_template("system"),
            analyze_v3=load_template("analyze_v3"),
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/prompts")
async def update_prompts(request: UpdatePromptRequest):
    """更新提示词模板"""
    try:
        if request.analyze is not None:
            save_template("analyze", request.analyze)
        if request.system is not None:
            save_template("system", request.system)
        if request.analyze_v3 is not None:
            save_template("analyze_v3", request.analyze_v3)
        return {"success": True, "message": "提示词已更新"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")
