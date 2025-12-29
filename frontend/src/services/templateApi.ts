import type {
  ReplyTemplate,
  TemplateListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../types';

const API_BASE = '/api';

export async function getTemplates(): Promise<ReplyTemplate[]> {
  const response = await fetch(`${API_BASE}/templates`);

  if (!response.ok) {
    throw new Error('获取模板列表失败');
  }

  const data: TemplateListResponse = await response.json();
  return data.items;
}

export async function createTemplate(request: CreateTemplateRequest): Promise<ReplyTemplate> {
  const response = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || '创建模板失败');
  }

  return response.json();
}

export async function updateTemplate(id: number, request: UpdateTemplateRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('更新模板失败');
  }
}

export async function deleteTemplate(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('删除模板失败');
  }
}
