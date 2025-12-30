/**
 * V3 会话管理 Hook
 */

import { useState, useCallback } from 'react';
import type {
  SessionSummary,
  SessionDetail,
  SessionStatus,
  SessionDealStatus,
  UpdateSessionRequest,
  CreateMessageRequest,
  Message,
} from '../types';
import {
  createSession as apiCreateSession,
  getSessionList,
  getSessionById,
  updateSession as apiUpdateSession,
  deleteSession as apiDeleteSession,
  addMessage as apiAddMessage,
} from '../services/sessionApi';

interface UseSessionListReturn {
  sessions: SessionSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  fetchSessions: (params?: {
    page?: number;
    pageSize?: number;
    status?: SessionStatus;
    dealStatus?: SessionDealStatus;
    search?: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
}

interface UseCurrentSessionReturn {
  session: SessionDetail | null;
  isLoading: boolean;
  error: string | null;
  loadSession: (sessionId: number) => Promise<void>;
  createSession: (firstMessage?: string) => Promise<number>;
  updateSession: (sessionId: number, request: UpdateSessionRequest) => Promise<void>;
  deleteSession: (sessionId: number) => Promise<void>;
  addMessage: (sessionId: number, request: CreateMessageRequest) => Promise<Message>;
  endSession: (sessionId: number, data: {
    dealStatus: SessionDealStatus;
    dealPrice?: number;
    articleType?: string;
  }) => Promise<void>;
  clearSession: () => void;
}

/**
 * 会话列表管理 Hook
 */
export function useSessionList(): UseSessionListReturn {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<{
    page?: number;
    pageSize?: number;
    status?: SessionStatus;
    dealStatus?: SessionDealStatus;
    search?: string;
  }>({});

  const fetchSessions = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    status?: SessionStatus;
    dealStatus?: SessionDealStatus;
    search?: string;
  } = {}) => {
    setIsLoading(true);
    setError(null);
    setLastParams(params);

    try {
      const response = await getSessionList(params);
      setSessions(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.pageSize);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取会话列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchSessions(lastParams);
  }, [fetchSessions, lastParams]);

  return {
    sessions,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    fetchSessions,
    refresh,
  };
}

/**
 * 当前会话管理 Hook
 */
export function useCurrentSession(): UseCurrentSessionReturn {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getSessionById(sessionId);
      setSession(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取会话详情失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(async (firstMessage?: string): Promise<number> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCreateSession({ firstMessage });
      // 加载新创建的会话
      await loadSession(result.id);
      return result.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建会话失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadSession]);

  const updateSession = useCallback(async (sessionId: number, request: UpdateSessionRequest) => {
    setError(null);

    try {
      await apiUpdateSession(sessionId, request);
      // 重新加载会话
      if (session?.id === sessionId) {
        await loadSession(sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新会话失败');
      throw err;
    }
  }, [session, loadSession]);

  const deleteSession = useCallback(async (sessionId: number) => {
    setError(null);

    try {
      await apiDeleteSession(sessionId);
      // 如果删除的是当前会话，清空状态
      if (session?.id === sessionId) {
        setSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除会话失败');
      throw err;
    }
  }, [session]);

  const addMessage = useCallback(async (sessionId: number, request: CreateMessageRequest): Promise<Message> => {
    setError(null);

    try {
      const message = await apiAddMessage(sessionId, request);
      // 重新加载会话以获取最新状态
      if (session?.id === sessionId) {
        await loadSession(sessionId);
      }
      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加消息失败');
      throw err;
    }
  }, [session, loadSession]);

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  const endSession = useCallback(async (sessionId: number, data: {
    dealStatus: SessionDealStatus;
    dealPrice?: number;
    articleType?: string;
  }) => {
    setError(null);

    try {
      await apiUpdateSession(sessionId, {
        status: 'closed',
        dealStatus: data.dealStatus,
        dealPrice: data.dealPrice,
        articleType: data.articleType,
      });
      // 重新加载会话
      if (session?.id === sessionId) {
        await loadSession(sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '结束会话失败');
      throw err;
    }
  }, [session, loadSession]);

  return {
    session,
    isLoading,
    error,
    loadSession,
    createSession,
    updateSession,
    deleteSession,
    addMessage,
    endSession,
    clearSession,
  };
}
