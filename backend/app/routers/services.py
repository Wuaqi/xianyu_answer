from fastapi import APIRouter, HTTPException
from ..models.schemas import ServiceType
from ..data.services_loader import get_services, refresh_services

router = APIRouter()


@router.get("/services", response_model=list[ServiceType])
async def list_services():
    """获取所有服务类型列表"""
    try:
        services = get_services()
        return services
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"加载服务列表失败: {str(e)}")


@router.post("/services/refresh", response_model=list[ServiceType])
async def refresh_services_list():
    """刷新服务列表缓存"""
    try:
        services = refresh_services()
        return services
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刷新服务列表失败: {str(e)}")
