from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import analyze, services, prompts, history, templates
from .database import init_db

# 初始化数据库
init_db()

app = FastAPI(
    title="闲鱼代写助手 API",
    description="帮助闲鱼代写卖家专业回复买家咨询",
    version="2.0.0",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(analyze.router, prefix="/api", tags=["分析"])
app.include_router(services.router, prefix="/api", tags=["服务"])
app.include_router(prompts.router, prefix="/api", tags=["提示词"])
app.include_router(history.router, prefix="/api", tags=["历史记录"])
app.include_router(templates.router, prefix="/api", tags=["回复模板"])


@app.get("/")
async def root():
    return {"message": "闲鱼代写助手 API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
