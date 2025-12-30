# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

闲鱼代写助手 - 帮助闲鱼平台代写服务卖家专业回复买家咨询，智能挖掘需求，提升成交率。

## 业务背景

- **目标用户**：闲鱼平台文章代写服务卖家
- **核心痛点**：面对多样化代写需求时不知如何专业回复，容易丢失客户
- **解决方案**：AI驱动的对话式助手，支持多轮对话、智能分析、生成多个可选回复

## 当前版本

**V3.0** - 已完成：对话式助手（多轮对话、回复清单、会话管理、需求提炼、挽留话术）

## 技术架构

### 前端
- React 18 + TypeScript + Vite
- Tailwind CSS 样式
- localStorage 存储 LLM 配置

### 后端
- Python 3.11 + FastAPI
- SQLite 数据库（会话、消息、历史记录、模板）
- pandas + openpyxl 处理 Excel 数据
- httpx 调用大模型 API

## 开发环境

### Python
```bash
# 激活环境
source /opt/miniconda3/bin/activate xianyu

# 或直接使用
/opt/miniconda3/envs/xianyu/bin/python
```
已安装：Python 3.11, pandas, openpyxl, fastapi, httpx

### Node.js（使用 nvm）
```bash
# 加载 nvm
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 当前版本
nvm use 22  # v22.14.0
```

### 安装依赖
```bash
# Python
/opt/miniconda3/bin/conda install -n xianyu <package_name>

# Node
cd frontend && npm install <package_name>
```

## 常用命令

### 开发
```bash
# 启动前端开发服务器
cd frontend && npm run dev

# 启动后端服务
cd backend && /opt/miniconda3/envs/xianyu/bin/python run.py
```

### 构建
```bash
# 前端打包
cd frontend && npm run build
```

## 项目结构

```
xianyu_answer/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── components/          # UI 组件（24个）
│   │   │   ├── MessageInput.tsx         # 消息输入框
│   │   │   ├── AnalysisResult.tsx       # 分析结果展示
│   │   │   ├── ReplySection.tsx         # 建议回复（支持编辑）
│   │   │   ├── PriceEstimate.tsx        # 报价展示
│   │   │   ├── SettingsModal.tsx        # LLM配置弹窗
│   │   │   ├── PriceListModal.tsx       # 价目表弹窗
│   │   │   ├── PromptModal.tsx          # 提示词设置弹窗（4个标签页）
│   │   │   ├── TabBar.tsx               # 标签页切换
│   │   │   ├── Dropdown.tsx             # 自定义下拉菜单
│   │   │   ├── HistoryList.tsx          # V2历史记录列表
│   │   │   ├── HistoryFilter.tsx        # 历史记录筛选
│   │   │   ├── HistoryDetail.tsx        # 历史记录详情
│   │   │   ├── DealStatusBadge.tsx      # 成交状态徽章
│   │   │   ├── TemplatePanel.tsx        # 模板库面板
│   │   │   ├── TemplateEditModal.tsx    # 模板编辑弹窗
│   │   │   ├── SessionPanel.tsx         # [V3] 会话主面板
│   │   │   ├── ConversationView.tsx     # [V3] 对话视图
│   │   │   ├── SuggestedReplies.tsx     # [V3] 推荐回复列表
│   │   │   ├── QuickTags.tsx            # [V3] 快捷标签
│   │   │   ├── EndSessionModal.tsx      # [V3] 结束会话弹窗
│   │   │   ├── RequirementSummaryCard.tsx # [V3] 需求要点卡片
│   │   │   ├── SessionList.tsx          # [V3] 会话列表
│   │   │   ├── SessionHistoryList.tsx   # [V3] 会话历史列表
│   │   │   └── CombinedHistoryPage.tsx  # [V3] 综合历史页面
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.ts       # localStorage Hook
│   │   │   ├── useHistory.ts            # 历史记录管理
│   │   │   ├── useTemplates.ts          # 模板管理
│   │   │   └── useSession.ts            # [V3] 会话管理
│   │   ├── services/
│   │   │   ├── api.ts                   # 基础 API 调用
│   │   │   ├── historyApi.ts            # 历史记录 API
│   │   │   ├── templateApi.ts           # 模板 API
│   │   │   └── sessionApi.ts            # [V3] 会话 API
│   │   └── types/
│   │       └── index.ts                 # TypeScript 类型
│   └── package.json
│
├── backend/                     # Python 后端
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── routers/
│   │   │   ├── analyze.py       # 消息分析路由（V2快速分析）
│   │   │   ├── services.py      # 服务类型路由
│   │   │   ├── prompts.py       # 提示词路由（支持4个模板）
│   │   │   ├── history.py       # 历史记录路由
│   │   │   ├── templates.py     # 回复模板路由
│   │   │   └── sessions.py      # [V3] 会话路由
│   │   ├── services/
│   │   │   ├── llm_service.py       # 大模型调用（含V3对话分析）
│   │   │   ├── history_service.py   # 历史记录服务
│   │   │   ├── template_service.py  # 模板服务
│   │   │   └── session_service.py   # [V3] 会话服务
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic 数据模型
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── database.py      # SQLite 连接和初始化
│   │   ├── data/
│   │   │   └── services_loader.py # Excel 数据加载
│   │   └── prompts/
│   │       ├── analyze_prompt.py  # Prompt 构建
│   │       └── templates/
│   │           ├── analyze.txt      # V2 快速分析提示词
│   │           ├── analyze_v3.txt   # [V3] 对话分析提示词
│   │           └── system.txt       # 系统提示词模板
│   ├── data/
│   │   └── xianyu.db            # SQLite 数据库
│   └── requirements.txt
│
├── 报价参考.xlsx                # 服务类型与价格数据
├── CLAUDE.md                    # 本文件
├── Prd.md                       # 产品需求文档
└── README.md                    # 项目说明
```

## 关键数据文件

- `报价参考.xlsx` - 24种代写服务类型及价格表（千字计价）
- `backend/data/xianyu.db` - SQLite数据库（会话、消息、AI分析、历史记录、回复模板、挽留话术）

## 数据库表结构

| 表名 | 用途 | 版本 |
|------|------|------|
| sessions | 对话会话 | V3 |
| messages | 会话消息 | V3 |
| ai_analyses | AI分析结果 | V3 |
| retention_templates | 挽留话术模板 | V3 |
| history_records | 快速分析历史 | V2 |
| reply_templates | 回复话术模板 | V2 |

## API 端点

### V2 快速分析端点

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | /api/analyze | 分析买家消息（单次） |
| POST | /api/test-connection | 测试LLM连接 |
| GET | /api/services | 获取服务类型列表 |
| GET/PUT | /api/prompts | 获取/更新提示词（4个模板） |
| GET/POST | /api/history | 历史记录列表/创建 |
| GET/PATCH/DELETE | /api/history/{id} | 历史记录详情/更新/删除 |
| GET | /api/history/article-types | 获取文章类型列表 |
| GET/POST | /api/templates | 模板列表/创建 |
| PUT/DELETE | /api/templates/{id} | 模板更新/删除 |

### V3 对话会话端点

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | /api/sessions | 创建新会话 |
| GET | /api/sessions | 获取会话列表（支持筛选） |
| GET | /api/sessions/{id} | 获取会话详情（含消息和分析） |
| PATCH | /api/sessions/{id} | 更新会话状态 |
| DELETE | /api/sessions/{id} | 删除会话 |
| POST | /api/sessions/{id}/messages | 添加消息 |
| GET | /api/sessions/{id}/messages | 获取会话消息列表 |
| POST | /api/sessions/{id}/analyze | 发送消息并AI分析 |
| POST | /api/sessions/{id}/summarize | 提炼需求要点 |
| GET/PUT | /api/retention-template | 获取/更新挽留话术 |

## 提示词模板

在「提示词设置」中可编辑 4 个模板：

| 模板 | 文件 | 用途 |
|------|------|------|
| 快速分析 | analyze.txt | V2 单次消息分析 |
| 系统提示词 | system.txt | AI角色和行为规则 |
| 对话分析 | analyze_v3.txt | V3 多轮对话分析 |
| 挽留话术 | 数据库存储 | 未成交时的挽留模板 |

## 部署信息

- **服务器**：腾讯云轻量服务器 111.231.107.149
- **系统**：OpenCloudOS 9 + 宝塔面板
- **域名**：xianyu.wyqaii.top（阿里云DNS）
- **部署方式**：Nginx 静态文件 + Python项目管理器

## 版本历史

| 版本 | 状态 | 主要功能 |
|------|------|----------|
| V1.0 | 已完成 | 智能分析、专业回复、智能报价、服务速查 |
| V2.0 | 已完成 | 历史记录、成交标记、回复模板库 |
| V3.0 | 已完成 | 对话式助手、多轮对话、回复清单、会话管理、需求提炼、挽留话术 |
