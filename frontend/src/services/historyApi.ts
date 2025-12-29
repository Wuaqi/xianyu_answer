import type {
  HistoryRecord,
  HistoryListResponse,
  CreateHistoryRequest,
  UpdateHistoryRequest,
} from '../types';

const API_BASE = '/api';

export async function createHistory(request: CreateHistoryRequest): Promise<{ id: number; createdAt: string }> {
  const response = await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || '创建历史记录失败');
  }

  return response.json();
}

export async function getHistoryList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  articleType?: string;
  dealStatus?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<HistoryListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.articleType) searchParams.set('articleType', params.articleType);
  if (params.dealStatus) searchParams.set('dealStatus', params.dealStatus);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const response = await fetch(`${API_BASE}/history?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('获取历史记录失败');
  }

  return response.json();
}

export async function getHistoryById(id: number): Promise<HistoryRecord> {
  const response = await fetch(`${API_BASE}/history/${id}`);

  if (!response.ok) {
    throw new Error('获取历史记录详情失败');
  }

  return response.json();
}

export async function updateHistory(id: number, data: UpdateHistoryRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/history/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('更新历史记录失败');
  }
}

export async function deleteHistory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/history/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('删除历史记录失败');
  }
}

export async function getArticleTypes(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/history/article-types`);

  if (!response.ok) {
    throw new Error('获取文章类型失败');
  }

  const data = await response.json();
  return data.types;
}
