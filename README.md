# 闲鱼代写助手

帮助闲鱼平台代写服务卖家专业回复买家咨询，智能挖掘需求，提升成交率。

## 功能特性

### V1 核心功能
- **智能分析**：自动识别24种文章类型，提取买家需求信息
- **专业回复**：生成亲切友好专业的回复话术
- **需求挖掘**：自动识别缺失信息，生成追问话术
- **智能报价**：根据类型/字数/复杂度/紧急程度给出价格区间
- **服务速查**：完整价目表，支持搜索筛选
- **提示词配置**：可自定义分析提示词和系统提示词

### V2 历史与模板
- **历史记录**：自动保存分析记录，支持搜索筛选
- **成交标记**：标记订单成交状态（待定/已成交/未成交）
- **文章类型标记**：标记实际文章类型，支持自定义
- **回复模板库**：预设常用话术，支持增删改
- **回复编辑**：支持手动编辑生成的回复

### V3 对话式助手
- **多轮对话**：引入"会话"概念，一个买家=一个会话，保持上下文连续性
- **回复清单**：返回3-5个可选回复，每个有独立复制按钮
- **会话管理**：会话状态管理（进行中/已结束），区分活跃和历史对话
- **智能报价时机**：信息足够时自动提示"可以报价"
- **会话结束标记**：结束时标记成交状态、成交价格、文章类型
- **需求要点提炼**：成交时自动提炼用户需求要点，方便执行订单
- **挽留话术**：未成交时提供可配置的挽留话术模板
- **快捷回复标签**：常用快捷标签，点击即插入
- **历史记录删除**：支持删除无参考价值的记录

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

### 对话助手模式（推荐）

1. 点击左侧「设置」配置大模型API
2. 在「对话助手」标签页粘贴买家消息
3. 点击「分析」获取 AI 分析和多个推荐回复
4. 点击推荐回复的「复制」按钮，粘贴到闲鱼
5. 继续粘贴买家的回复，进行多轮对话
6. 信息足够时，AI 会提示可以报价
7. 对话结束后点击「结束会话」标记成交状态

### 快速分析模式

1. 在「快速分析」标签页粘贴买家消息
2. 点击「分析并生成回复」
3. 查看分析结果和建议回复
4. 可编辑回复或从模板库插入话术

### 历史记录

- 「历史记录」标签页展示所有会话和快速分析记录
- 支持按状态、类型筛选
- 点击会话可查看完整对话内容
- 支持删除无用记录

## 项目结构

```
xianyu_answer/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # UI 组件（24个）
│   │   ├── hooks/         # 自定义 Hooks（4个）
│   │   ├── services/      # API 调用（4个）
│   │   └── types/         # TypeScript 类型
│   └── package.json
│
├── backend/               # FastAPI 后端
│   ├── app/
│   │   ├── main.py        # 入口文件
│   │   ├── routers/       # API 路由（6个）
│   │   ├── services/      # 业务服务（4个）
│   │   ├── models/        # 数据模型
│   │   ├── database/      # SQLite 数据库
│   │   └── prompts/       # 提示词模板（3个）
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

### V2 快速分析

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

### V3 对话会话

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | /api/sessions | 创建新会话 |
| GET | /api/sessions | 获取会话列表 |
| GET | /api/sessions/{id} | 获取会话详情 |
| PATCH | /api/sessions/{id} | 更新会话状态 |
| DELETE | /api/sessions/{id} | 删除会话 |
| POST | /api/sessions/{id}/analyze | 发送消息并分析 |
| POST | /api/sessions/{id}/summarize | 提炼需求要点 |
| GET/PUT | /api/retention-template | 挽留话术模板 |

## 提示词配置

在「提示词」设置中可编辑 4 个模板：

- **快速分析**：V2 单次消息分析的提示词
- **系统提示词**：AI 角色和行为规则
- **对话分析**：V3 多轮对话分析的提示词
- **挽留话术**：未成交时的挽留模板

## 部署

详见 [Prd.md](./Prd.md) 第八章 部署方案

## License

MIT
