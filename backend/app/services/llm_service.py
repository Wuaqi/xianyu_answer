import httpx
import json
import re
import logging
from pathlib import Path
from typing import Optional
from ..models.schemas import (
    LLMConfig, ExtractedInfoV3, RequirementSummary
)
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

    # 简洁的系统提示词
    system_prompt = "你是一个专业的闲鱼代写服务助手，帮助卖家专业地回复买家咨询。请严格按照要求的JSON格式返回结果。"

    payload = {
        "model": config.modelId,
        "messages": [
            {"role": "system", "content": system_prompt},
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


# ========== V3 多轮对话分析 ==========

def _load_template_v3() -> str:
    """加载 V3 分析提示词模板"""
    template_path = Path(__file__).parent.parent / "prompts" / "templates" / "analyze_v3.txt"
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()


def _format_conversation_history(messages: list) -> str:
    """格式化对话历史"""
    if not messages:
        return "（无历史对话）"

    lines = []
    for msg in messages:
        role_name = "买家" if msg.role == "buyer" else "卖家"
        lines.append(f"{role_name}: {msg.content}")

    return "\n".join(lines)


def _format_accumulated_info(info: Optional[ExtractedInfoV3]) -> str:
    """格式化已累积的信息"""
    if not info:
        return "（暂无已提取信息）"

    parts = []
    if info.articleType:
        parts.append(f"- 文章类型: {info.articleType}")
    if info.topic:
        parts.append(f"- 主题: {info.topic}")
    if info.wordCount:
        parts.append(f"- 字数: {info.wordCount}")
    if info.deadline:
        parts.append(f"- 截止时间: {info.deadline}")
    if info.hasReference is not None:
        parts.append(f"- 有参考资料: {'是' if info.hasReference else '否'}")
    if info.specialRequirements:
        parts.append(f"- 特殊要求: {', '.join(info.specialRequirements)}")

    return "\n".join(parts) if parts else "（暂无已提取信息）"


def build_analyze_prompt_v3(
    messages: list,
    latest_message: str,
    accumulated_info: Optional[ExtractedInfoV3] = None
) -> str:
    """构建 V3 分析提示词"""
    services = get_services()

    # 格式化服务列表
    service_lines = []
    for svc in services:
        price_info = []
        if svc.priceSimple:
            price_info.append(f"简单{svc.priceSimple}元")
        if svc.priceComplex:
            price_info.append(f"复杂{svc.priceComplex}元")
        price_str = "/".join(price_info) if price_info else "面议"

        unit_map = {"thousand": "千字", "page": "页", "minute": "分钟", "piece": "篇"}
        unit = unit_map.get(svc.unit or "thousand", "千字")

        line = f"- {svc.name}: {price_str}/{unit}"
        if svc.note:
            line += f" ({svc.note})"
        service_lines.append(line)

    # 加载模板并填充
    template = _load_template_v3()

    # 排除最后一条消息（因为它是 latest_message）
    history_messages = messages[:-1] if messages else []

    prompt = template.format(
        service_count=len(services),
        service_list="\n".join(service_lines),
        conversation_history=_format_conversation_history(history_messages),
        latest_message=latest_message,
        accumulated_info=_format_accumulated_info(accumulated_info),
    )

    return prompt


class AnalysisResultV3:
    """V3 分析结果"""
    def __init__(
        self,
        suggested_replies: list[str],
        extracted_info: ExtractedInfoV3,
        missing_info: list[str],
        can_quote: bool,
        price_min: Optional[int],
        price_max: Optional[int],
        price_basis: Optional[str],
        quick_tags: list[str],
    ):
        self.suggested_replies = suggested_replies
        self.extracted_info = extracted_info
        self.missing_info = missing_info
        self.can_quote = can_quote
        self.price_min = price_min
        self.price_max = price_max
        self.price_basis = price_basis
        self.quick_tags = quick_tags


async def analyze_conversation(
    messages: list,
    config: LLMConfig,
    accumulated_info: Optional[ExtractedInfoV3] = None
) -> AnalysisResultV3:
    """
    分析多轮对话，返回 V3 格式的分析结果

    Args:
        messages: 对话消息列表（Message 对象或 dict）
        config: LLM 配置
        accumulated_info: 已累积提取的信息

    Returns:
        AnalysisResultV3: 包含多个回复选项的分析结果
    """
    if not messages:
        raise ValueError("消息列表不能为空")

    # 获取最新的买家消息
    latest_message = messages[-1].content if hasattr(messages[-1], 'content') else messages[-1]['content']

    # 构建 prompt
    prompt = build_analyze_prompt_v3(messages, latest_message, accumulated_info)

    # 调用 LLM
    response_text = await call_llm(config, prompt)

    # 解析响应
    data = parse_llm_response(response_text)

    # 提取信息
    extracted_data = data.get("extractedInfo", {})
    extracted_info = ExtractedInfoV3(
        articleType=extracted_data.get("articleType"),
        topic=extracted_data.get("topic"),
        wordCount=extracted_data.get("wordCount"),
        deadline=extracted_data.get("deadline"),
        hasReference=extracted_data.get("hasReference"),
        specialRequirements=extracted_data.get("specialRequirements", []),
    )

    # 报价信息
    price_data = data.get("priceEstimate", {})
    can_quote = data.get("canQuote", False)

    return AnalysisResultV3(
        suggested_replies=data.get("suggestedReplies", []),
        extracted_info=extracted_info,
        missing_info=data.get("missingInfo", []),
        can_quote=can_quote,
        price_min=price_data.get("min") if can_quote else None,
        price_max=price_data.get("max") if can_quote else None,
        price_basis=price_data.get("basis") if can_quote else None,
        quick_tags=data.get("quickTags", []),
    )


async def summarize_requirements(
    messages: list,
    config: LLMConfig
) -> RequirementSummary:
    """
    根据完整对话历史，提炼需求要点

    Args:
        messages: 对话消息列表
        config: LLM 配置

    Returns:
        RequirementSummary: 需求要点摘要
    """
    # 构建对话历史
    conversation = _format_conversation_history(messages)

    prompt = f"""根据以下买家与卖家的对话，提炼买家的需求要点。

## 对话记录：
{conversation}

## 请按以下JSON格式返回需求要点：
```json
{{
  "articleType": "文章类型",
  "wordCount": 5000,
  "deadline": "截止时间",
  "topic": "主题/题目",
  "requirements": ["具体要求1", "具体要求2", "具体要求3"],
  "notes": "其他备注信息"
}}
```

请严格按照JSON格式返回，确保提取所有对话中提到的需求信息。"""

    # 调用 LLM
    response_text = await call_llm(config, prompt)

    # 解析响应
    data = parse_llm_response(response_text)

    return RequirementSummary(
        articleType=data.get("articleType", "未知类型"),
        wordCount=data.get("wordCount"),
        deadline=data.get("deadline"),
        topic=data.get("topic"),
        requirements=data.get("requirements", []),
        notes=data.get("notes"),
    )
