from pathlib import Path

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
