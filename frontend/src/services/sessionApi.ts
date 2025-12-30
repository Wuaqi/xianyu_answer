/**
 * V3 会话 API 服务
 */

import type {
  SessionListResponse,
  SessionDetail,
  CreateSessionRequest,
  UpdateSessionRequest,
  Message,
  CreateMessageRequest,
  RetentionTemplate,
  UpdateRetentionTemplateRequest,
  SessionStatus,
  SessionDealStatus,
  SendMessageResponse,
  RequirementSummary,
  LLMConfig,
} from '../types';

const API_BASE = '/api';

// ========== 会话管理 ==========

/**
 * 创建新会话
 */
export async function createSession(request?: CreateSessionRequest): Promise<{ id: number; createdAt: string }> {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request || {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `创建会话失败: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 获取会话列表
 */
export async function getSessionList(params: {
  page?: number;
  pageSize?: number;
  status?: SessionStatus;
  dealStatus?: SessionDealStatus;
  search?: string;
} = {}): Promise<SessionListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.status) searchParams.set('status', params.status);
  if (params.dealStatus) searchParams.set('dealStatus', params.dealStatus);
  if (params.search) searchParams.set('search', params.search);

  const url = `${API_BASE}/sessions?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `获取会话列表失败: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 获取会话详情
 */
export async function getSessionById(sessionId: number): Promise<SessionDetail> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `获取会话详情失败: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 更新会话
 */
export async function updateSession(sessionId: number, request: UpdateSessionRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `更新会话失败: HTTP ${response.status}`);
  }
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `删除会话失败: HTTP ${response.status}`);
  }
}

// ========== 消息管理 ==========

/**
 * 添加消息到会话
 */
export async function addMessage(sessionId: number, request: CreateMessageRequest): Promise<Message> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `添加消息失败: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 获取会话的所有消息
 */
export async function getMessages(sessionId: number): Promise<Message[]> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `获取消息失败: HTTP ${response.status}`);
  }

  return response.json();
}

// ========== 挽留话术 ==========

/**
 * 获取默认挽留话术
 */
export async function getRetentionTemplate(): Promise<RetentionTemplate> {
  const response = await fetch(`${API_BASE}/retention-template`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('挽留话术不存在');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `获取挽留话术失败: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 更新默认挽留话术
 */
export async function updateRetentionTemplate(request: UpdateRetentionTemplateRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/retention-template`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `更新挽留话术失败: HTTP ${response.status}`);
  }
}


// ========== 消息分析 ==========

/**
 * 发送买家消息并进行AI分析
 * 返回消息和分析结果（3-5个推荐回复、提取信息等）
 */
export async function analyzeMessage(
  sessionId: number,
  content: string,
  llmConfig: LLMConfig
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      role: 'buyer',
      llmConfig,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `分析消息失败: HTTP ${response.status}`);
  }

  return response.json();
}


// ========== 需求提炼 ==========

/**
 * 提炼会话的需求要点
 * 用于结束会话时展示需求摘要
 */
export async function summarizeRequirements(
  sessionId: number,
  llmConfig: LLMConfig
): Promise<RequirementSummary> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ llmConfig }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `提炼需求失败: HTTP ${response.status}`);
  }

  return response.json();
}
