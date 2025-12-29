from pathlib import Path
from ..models.schemas import ServiceType

# 模板目录
TEMPLATES_DIR = Path(__file__).parent / "templates"


def load_template(name: str) -> str:
    """从文件加载提示词模板"""
    template_path = TEMPLATES_DIR / f"{name}.txt"
    if not template_path.exists():
        raise FileNotFoundError(f"模板文件不存在: {template_path}")
    return template_path.read_text(encoding="utf-8")


def save_template(name: str, content: str) -> None:
    """保存提示词模板到文件"""
    template_path = TEMPLATES_DIR / f"{name}.txt"
    template_path.write_text(content, encoding="utf-8")


def get_template_path(name: str) -> Path:
    """获取模板文件路径"""
    return TEMPLATES_DIR / f"{name}.txt"


def build_analyze_prompt(message: str, services: list[ServiceType]) -> str:
    """构建分析 Prompt"""
    # 从文件加载模板
    template = load_template("analyze")

    # 服务类型列表
    service_list = "\n".join(
        [
            f"- {s.name}（简单:{s.priceSimple or '-'}元/{s.unit}, 复杂:{s.priceComplex or '-'}元/{s.unit}）"
            for s in services
        ]
    )

    # 填充模板变量
    prompt = template.format(
        service_count=len(services),
        service_list=service_list,
        message=message,
    )

    return prompt


def get_system_prompt() -> str:
    """获取系统提示词"""
    return load_template("system")


# 兼容旧代码
SYSTEM_PROMPT = get_system_prompt()
