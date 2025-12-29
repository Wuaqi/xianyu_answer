# 闲鱼代写助手

帮助闲鱼平台代写服务卖家专业回复买家咨询，智能挖掘需求，提升成交率。

## 功能特性

### 核心功能
- **智能分析**：自动识别24种文章类型，提取买家需求信息
- **专业回复**：生成亲切友好专业的回复话术
- **需求挖掘**：自动识别缺失信息，生成追问话术
- **智能报价**：根据类型/字数/复杂度/紧急程度给出价格区间
- **服务速查**：完整价目表，支持搜索筛选

### V2 新功能
- **历史记录**：自动保存分析记录，支持搜索筛选
- **成交标记**：标记订单成交状态（待定/已成交/未成交）
- **文章类型标记**：标记实际文章类型，支持自定义
- **回复模板库**：预设常用话术，支持增删改
- **回复编辑**：支持手动编辑生成的回复
- **提示词配置**：可自定义分析提示词和系统提示词

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **后端**：Python 3.11 + FastAPI + SQLite
- **AI**：支持自定义大模型API（OpenAI / DeepSeek / Claude / 其他兼容API）

## 快速开始

### 环境要求

- Node.js 22+
- Python 3.11+（推荐使用 conda）

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
pip install -r requirements.txt
```

### 启动开发服务器

```bash
# 启动前端（端口 5173）
cd frontend
npm run dev

# 启动后端（端口 8000）
cd backend
python run.py
```

### 访问应用

打开浏览器访问 http://localhost:5173

## 使用说明

1. 点击右上角「设置」配置大模型API
2. 粘贴买家咨询消息
3. 点击「分析并生成回复」
4. 查看分析结果、建议回复和报价参考
5. 可点击「编辑」修改回复，或从「模板库」插入常用话术
6. 点击「复制」将回复粘贴到闲鱼
7. 切换到「历史记录」标签页查看和管理历史分析

## 项目结构

```
xianyu_answer/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # UI 组件（16个）
│   │   ├── hooks/         # 自定义 Hooks（3个）
│   │   ├── services/      # API 调用（3个）
│   │   └── types/         # TypeScript 类型
│   └── package.json
│
├── backend/               # FastAPI 后端
│   ├── app/
│   │   ├── main.py        # 入口文件
│   │   ├── routers/       # API 路由（5个）
│   │   ├── services/      # 业务服务（3个）
│   │   ├── models/        # 数据模型
│   │   ├── database/      # SQLite 数据库
│   │   └── prompts/       # 提示词模板
│   ├── data/
│   │   └── xianyu.db      # SQLite 数据库文件
│   └── requirements.txt
│
├── 报价参考.xlsx           # 服务类型与价格数据
├── CLAUDE.md              # 开发指南
├── Prd.md                 # 产品需求文档
└── README.md              # 本文件
```

## API 端点

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | /api/analyze | 分析买家消息 |
| POST | /api/test-connection | 测试LLM连接 |
| GET | /api/services | 获取服务类型列表 |
| GET/PUT | /api/prompts | 获取/更新提示词 |
| GET/POST | /api/history | 历史记录列表/创建 |
| PATCH/DELETE | /api/history/{id} | 更新/删除历史记录 |
| GET/POST | /api/templates | 模板列表/创建 |
| PUT/DELETE | /api/templates/{id} | 更新/删除模板 |

## 部署

详见 [Prd.md](./Prd.md) 第八章 部署方案

## License

MIT
