from fastapi import APIRouter, HTTPException
from ..models.schemas import AnalysisRequest, AnalysisResponse, LLMConfig
from ..services.llm_service import analyze_message, test_connection
import httpx

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    """分析买家消息并生成回复"""
    try:
        result = await analyze_message(request.message, request.llmConfig)
        return result
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="API Key 无效")
        elif e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="请求过于频繁，请稍后再试")
        else:
            raise HTTPException(status_code=500, detail=f"API 调用失败: {e.response.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"网络请求失败: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"响应解析失败: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.post("/test-connection")
async def test_llm_connection(config: LLMConfig):
    """测试大模型 API 连接"""
    try:
        await test_connection(config)
        return {"success": True, "message": "连接成功"}
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="API Key 无效")
        else:
            raise HTTPException(status_code=500, detail=f"连接失败: {e.response.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"网络请求失败: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"连接测试失败: {str(e)}")
