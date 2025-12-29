import { useState, useCallback } from 'react';
import type { ReplyTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '../types';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/templateApi';

interface UseTemplatesReturn {
  templates: ReplyTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  addTemplate: (data: CreateTemplateRequest) => Promise<void>;
  editTemplate: (id: number, data: UpdateTemplateRequest) => Promise<void>;
  removeTemplate: (id: number) => Promise<void>;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取模板失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTemplate = useCallback(async (data: CreateTemplateRequest) => {
    try {
      const newTemplate = await createTemplate(data);
      setTemplates((prev) => [...prev, newTemplate]);
    } catch (err) {
      throw err;
    }
  }, []);

  const editTemplate = useCallback(async (id: number, data: UpdateTemplateRequest) => {
    try {
      await updateTemplate(id, data);
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    } catch (err) {
      throw err;
    }
  }, []);

  const removeTemplate = useCallback(async (id: number) => {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    addTemplate,
    editTemplate,
    removeTemplate,
  };
}
