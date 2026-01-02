import os
import uvicorn

if __name__ == "__main__":
    # 生产环境禁用热重载
    is_dev = os.environ.get("ENV", "production") == "development"

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=is_dev,
    )
