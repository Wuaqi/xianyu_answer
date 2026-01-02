import pandas as pd
from pathlib import Path
from typing import Optional
from ..models.schemas import ServiceType

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent

# 计价单位映射
UNIT_MAP = {
    "千字": "thousand",
    "页": "page",
    "分钟": "minute",
    "篇": "piece",
}


def parse_price(value) -> Optional[int]:
    """解析价格字段"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    # 处理字符串格式
    value = str(value).strip()
    if value in ["-", "", "无"]:
        return None
    # 提取数字部分（处理如 "10（一分钟）" 的格式）
    import re
    match = re.search(r'\d+', value)
    if match:
        return int(match.group())
    return None


def load_services() -> list[ServiceType]:
    """从 Excel 加载服务类型数据"""
    excel_path = PROJECT_ROOT / "报价参考.xlsx"

    if not excel_path.exists():
        raise FileNotFoundError(f"找不到报价文件: {excel_path}")

    # 跳过前三行（空行、说明行和标题行），并指定列名
    df = pd.read_excel(
        excel_path,
        engine="openpyxl",
        skiprows=3,  # 跳过空行、说明行和标题行
        header=None,  # 不使用第一行作为标题
        names=["empty", "name", "price_simple", "price_complex"],
    )

    services = []
    for idx, row in df.iterrows():
        # 获取服务名称（在第二列）
        name = str(row["name"]).strip() if pd.notna(row["name"]) else ""
        if not name or name == "nan":
            continue

        # 获取价格
        price_simple = parse_price(row["price_simple"])
        price_complex = parse_price(row["price_complex"])

        # 从名称中提取备注（括号内容）
        note = ""
        if "(" in name:
            note_start = name.find("(")
            note_end = name.find(")", note_start)
            if note_end > note_start:
                note = name[note_start + 1:note_end]
        elif "（" in name:
            note_start = name.find("（")
            note_end = name.find("）", note_start)
            if note_end > note_start:
                note = name[note_start + 1:note_end]

        # 确定计价单位
        unit = "thousand"  # 默认千字
        name_lower = name.lower()
        note_lower = note.lower() if note else ""

        if "按页" in name or "按页" in note:
            unit = "page"
        elif "按分钟" in name or "分钟计" in name:
            unit = "minute"
        elif "按篇" in name or "按篇" in note:
            unit = "piece"
        elif "ppt" in name_lower or "一页" in name:
            unit = "page"
        elif "看视频" in name:
            unit = "minute"

        # 判断是否需要材料
        requires_material = "需要看材料" in name or "需看材料" in name or "看材料" in name

        service = ServiceType(
            id=len(services) + 1,
            name=name,
            priceSimple=price_simple,
            priceComplex=price_complex,
            unit=unit,
            requiresMaterial=requires_material,
            note=note,
        )
        services.append(service)

    return services


# 缓存服务列表
_services_cache: Optional[list[ServiceType]] = None


def get_services() -> list[ServiceType]:
    """获取服务列表（带缓存）"""
    global _services_cache
    if _services_cache is None:
        _services_cache = load_services()
    return _services_cache


def refresh_services() -> list[ServiceType]:
    """刷新服务列表缓存"""
    global _services_cache
    _services_cache = load_services()
    return _services_cache
