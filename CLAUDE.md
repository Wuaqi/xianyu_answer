# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

闲鱼代写助手 - 帮助闲鱼平台代写服务卖家专业回复买家咨询，智能挖掘需求，提升成交率。

## 业务背景

- **目标用户**：闲鱼平台文章代写服务卖家
- **核心痛点**：面对多样化代写需求时不知如何专业回复，容易丢失客户
- **解决方案**：AI驱动的对话式助手，支持多轮对话、智能分析、生成多个可选回复

## 当前版本

**V4.1** - 已完成：对话体验优化与功能精简

### V4.1 主要改进
1. **UI 布局调整**：推荐回复放入对话流，已选回复显示在提取信息下方
2. **报价页面**：新增「报价」菜单，可查看完整报价表
3. **报价参考优化**：对话中显示当前文章类型的单价范围
4. **报价计算器**：成交时支持难度系数调整，自动计算价格范围
5. **文件上传功能**：支持上传文档/图片，AI 结合资料分析
6. **成交需求总结**：成交时显示 AI 提炼的需求要点
7. **条件显示优化**：「仍需了解」仅在对话进行中显示
8. **移除快速分析**：删除 V2 快速分析功能及历史记录

## 技术架构

### 前端
- React 18 + TypeScript + Vite
- Tailwind CSS 样式
- localStorage 存储 LLM 配置

### 后端
- Python 3.11 + FastAPI
- SQLite 数据库（会话、消息、模板）
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
│   │   ├── components/          # UI 组件
│   │   │   ├── SessionPanel.tsx         # 会话主面板
│   │   │   ├── ConversationView.tsx     # 对话视图
│   │   │   ├── EndSessionModal.tsx      # 结束会话弹窗
│   │   │   ├── PriceCalculator.tsx      # 报价计算器
│   │   │   ├── ArticlePriceCard.tsx     # 文章单价卡片
│   │   │   ├── PriceListPage.tsx        # 报价表页面
│   │   │   ├── PriceControl.tsx         # 报价控制
│   │   │   ├── FileUpload.tsx           # 文件上传
│   │   │   ├── SuggestedReplies.tsx     # 推荐回复列表
│   │   │   ├── RequirementSummaryCard.tsx # 需求要点卡片
│   │   │   ├── SessionList.tsx          # 会话列表
│   │   │   ├── SessionHistoryList.tsx   # 会话历史列表
│   │   │   ├── CombinedHistoryPage.tsx  # 历史页面
│   │   │   ├── SettingsModal.tsx        # LLM配置弹窗
│   │   │   ├── PromptModal.tsx          # 提示词设置弹窗
│   │   │   ├── TemplatePanel.tsx        # 模板库面板
│   │   │   ├── TemplateEditModal.tsx    # 模板编辑弹窗
│   │   │   ├── Dropdown.tsx             # 自定义下拉菜单
│   │   │   └── QuickTags.tsx            # 快捷标签
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.ts       # localStorage Hook
│   │   │   ├── useTemplates.ts          # 模板管理
│   │   │   └── useSession.ts            # 会话管理
│   │   ├── services/
│   │   │   ├── api.ts                   # 基础 API 调用
│   │   │   ├── templateApi.ts           # 模板 API
│   │   │   └── sessionApi.ts            # 会话 API
│   │   └── types/
│   │       └── index.ts                 # TypeScript 类型
│   └── package.json
│
├── backend/                     # Python 后端
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── routers/
│   │   │   ├── services.py      # 服务类型路由
│   │   │   ├── prompts.py       # 提示词路由
│   │   │   ├── templates.py     # 回复模板路由
│   │   │   └── sessions.py      # 会话路由
│   │   ├── services/
│   │   │   ├── llm_service.py       # 大模型调用
│   │   │   ├── template_service.py  # 模板服务
│   │   │   └── session_service.py   # 会话服务
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
│   │           └── analyze_v3.txt # 对话分析提示词
│   ├── data/
│   │   └── xianyu.db            # SQLite 数据库
│   └── requirements.txt
│
├── 报价参考.xlsx                # 服务类型与价格数据
├── deploy.sh                    # 一键部署脚本
├── CLAUDE.md                    # 本文件
├── Prd.md                       # 产品需求文档
└── README.md                    # 项目说明
```

## 关键数据文件

- `报价参考.xlsx` - 24种代写服务类型及价格表（按千字、页、分钟、篇计价）
- `backend/data/xianyu.db` - SQLite数据库（会话、消息、AI分析、回复模板、挽留话术）

## 数据库表结构

| 表名 | 用途 |
|------|------|
| sessions | 对话会话 |
| messages | 会话消息 |
| ai_analyses | AI分析结果 |
| retention_templates | 挽留话术模板 |
| reply_templates | 回复话术模板 |
| review_templates | 要好评话术模板 |

## API 端点

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
| GET/PUT | /api/review-template | 获取/更新要好评话术 |
| GET | /api/services | 获取服务类型列表 |
| GET/PUT | /api/prompts | 获取/更新提示词 |
| GET/POST | /api/templates | 模板列表/创建 |
| PUT/DELETE | /api/templates/{id} | 模板更新/删除 |
| POST | /api/test-connection | 测试LLM连接 |

## 提示词模板

在「提示词设置」中可编辑 3 个模板：

| 模板 | 用途 |
|------|------|
| 对话分析 | 多轮对话分析提示词 |
| 挽留话术 | 未成交时的挽留模板 |
| 要好评话术 | 成交后请求好评的模板 |

## 部署信息

### 服务器配置

| 项目 | 值 |
|------|-----|
| 云服务商 | 腾讯云轻量应用服务器 |
| 服务器 IP | 111.231.107.149 |
| 操作系统 | OpenCloudOS 9 |
| 管理面板 | 宝塔 Linux 面板 |
| 本项目域名 | xianyu.wyqaii.top |
| 项目目录 | /www/wwwroot/xianyu_answer |
| Python 环境 | 宝塔虚拟环境 |
| 进程管理 | 宝塔进程守护管理器（Supervisor） |

### 访问地址

- **备案前**：`http://111.231.107.149:8080`
- **备案后**：`https://xianyu.wyqaii.top`

### 一键部署

```bash
# 本地执行部署脚本
./deploy.sh

# 部署完成后，在宝塔面板「进程守护管理器」重启 xianyu_answer
```

### 常见部署问题

| 问题 | 解决方法 |
|------|----------|
| 外部无法访问 8080 | 检查腾讯云控制台防火墙 |
| Python 项目添加失败 | 改用进程守护管理器 |
| 虚拟环境无 python | 使用 python3 代替 |
| GitHub 克隆失败 | 使用镜像 ghproxy.com |

## 版本历史

| 版本 | 状态 | 主要功能 |
|------|------|----------|
| V1.0 | 已完成 | 智能分析、专业回复、智能报价、服务速查 |
| V2.0 | 已完成 | 历史记录、成交标记、回复模板库 |
| V3.0 | 已完成 | 对话式助手、多轮对话、会话管理、需求提炼、挽留话术 |
| V4.0 | 已完成 | 移动端适配、响应式布局、底部导航、触摸优化 |
| V4.1 | 已完成 | 对话体验优化、报价页面、报价计算器、文件上传、移除快速分析 |
