import httpx
import json
import re
import logging
from ..models.schemas import LLMConfig, AnalysisResponse, ExtractedInfo, PriceEstimate
from ..prompts.analyze_prompt import build_analyze_prompt, get_system_prompt
from ..data.services_loader import get_services

logger = logging.getLogger(__name__)


async def call_llm(config: LLMConfig, prompt: str) -> str:
    """调用大模型 API"""
    # 构建请求
    url = f"{config.baseUrl.rstrip('/')}/chat/completions"

    headers = {
        "Authorization": f"Bearer {config.apiKey}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": config.modelId,
        "messages": [
            {"role": "system", "content": get_system_prompt()},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }

    logger.info(f"Calling LLM API: {url}")
    logger.info(f"Model: {config.modelId}")

    # 设置更长的超时时间：连接 30 秒，读取 120 秒
    timeout = httpx.Timeout(connect=30.0, read=120.0, write=30.0, pool=30.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            logger.info(f"Response status: {response.status_code}")
            response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            logger.info(f"LLM response received, length: {len(content)}")
            return content
        except httpx.TimeoutException as e:
            logger.error(f"Timeout error: {type(e).__name__}")
            raise TimeoutError("API 响应超时，请检查网络连接或稍后重试")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request error: {type(e).__name__} - {str(e)}")
            raise


def parse_llm_response(response_text: str) -> dict:
    """解析 LLM 响应"""
    # 尝试直接解析 JSON
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    # 尝试提取 JSON 代码块
    json_match = re.search(r"```json\s*(.*?)\s*```", response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # 尝试提取花括号内容
    brace_match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("无法解析 LLM 响应")


async def analyze_message(message: str, config: LLMConfig) -> AnalysisResponse:
    """分析买家消息"""
    services = get_services()

    # 构建 prompt
    prompt = build_analyze_prompt(message, services)

    # 调用 LLM
    response_text = await call_llm(config, prompt)

    # 解析响应
    data = parse_llm_response(response_text)

    # 构建响应对象
    extracted_info = ExtractedInfo(
        topic=data.get("extractedInfo", {}).get("topic"),
        wordCount=data.get("extractedInfo", {}).get("wordCount"),
        deadline=data.get("extractedInfo", {}).get("deadline"),
        hasReference=data.get("extractedInfo", {}).get("hasReference"),
        specialRequirements=data.get("extractedInfo", {}).get("specialRequirements"),
    )

    price_data = data.get("priceEstimate", {})
    price_estimate = PriceEstimate(
        min=price_data.get("min", 0),
        max=price_data.get("max", 0),
        basis=price_data.get("basis", ""),
        canQuote=price_data.get("canQuote", False),
    )

    # 获取检测到的服务类型
    detected_type = None
    if data.get("detectedType"):
        dt = data["detectedType"]
        from ..models.schemas import ServiceType

        detected_type = ServiceType(
            id=dt.get("id", 0),
            name=dt.get("name", ""),
            priceSimple=dt.get("priceSimple"),
            priceComplex=dt.get("priceComplex"),
            unit=dt.get("unit", "thousand"),
            requiresMaterial=dt.get("requiresMaterial", False),
            note=dt.get("note", ""),
        )

    return AnalysisResponse(
        detectedType=detected_type,
        possibleTypes=[],
        confidence=data.get("confidence", 0.0),
        extractedInfo=extracted_info,
        missingInfo=data.get("missingInfo", []),
        suggestedReply=data.get("suggestedReply", ""),
        priceEstimate=price_estimate,
    )


async def test_connection(config: LLMConfig) -> bool:
    """测试 LLM 连接"""
    url = f"{config.baseUrl.rstrip('/')}/models"

    headers = {
        "Authorization": f"Bearer {config.apiKey}",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return True
