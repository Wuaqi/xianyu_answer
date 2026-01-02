import type { ServiceType, LLMConfig, PromptTemplates } from '../types';

const API_BASE = '/api';

export async function getServices(): Promise<ServiceType[]> {
  const response = await fetch(`${API_BASE}/services`);

  if (!response.ok) {
    throw new Error('获取服务列表失败');
  }

  return response.json();
}

export async function testConnection(config: LLMConfig): Promise<boolean> {
  const response = await fetch(`${API_BASE}/test-connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '连接失败' }));
    throw new Error(error.detail || '连接测试失败');
  }

  return true;
}

export async function getPrompts(): Promise<PromptTemplates> {
  const response = await fetch(`${API_BASE}/prompts`);

  if (!response.ok) {
    throw new Error('获取提示词失败');
  }

  return response.json();
}

export async function updatePrompts(prompts: Partial<PromptTemplates>): Promise<void> {
  const response = await fetch(`${API_BASE}/prompts`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prompts),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '保存失败' }));
    throw new Error(error.detail || '保存提示词失败');
  }
}
