import { useState, useCallback } from 'react';
import type { HistoryRecord, HistoryListResponse, UpdateHistoryRequest } from '../types';
import { getHistoryList, updateHistory, deleteHistory, getArticleTypes } from '../services/historyApi';

interface UseHistoryReturn {
  records: HistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  articleTypes: string[];
  fetchRecords: (params?: {
    page?: number;
    search?: string;
    articleType?: string;
    dealStatus?: string;
  }) => Promise<void>;
  updateRecord: (id: number, data: UpdateHistoryRequest) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  fetchArticleTypes: () => Promise<void>;
  setPage: (page: number) => void;
}

export function useHistory(): UseHistoryReturn {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articleTypes, setArticleTypes] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<{
    search?: string;
    articleType?: string;
    dealStatus?: string;
  }>({});

  const fetchRecords = useCallback(async (params?: {
    page?: number;
    search?: string;
    articleType?: string;
    dealStatus?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    const newPage = params?.page ?? page;
    const filters = {
      search: params?.search ?? currentFilters.search,
      articleType: params?.articleType ?? currentFilters.articleType,
      dealStatus: params?.dealStatus ?? currentFilters.dealStatus,
    };

    // 更新当前筛选条件
    if (params) {
      setCurrentFilters(filters);
      if (params.page) setPage(params.page);
    }

    try {
      const response: HistoryListResponse = await getHistoryList({
        page: newPage,
        pageSize,
        ...filters,
      });

      setRecords(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取历史记录失败');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, currentFilters]);

  const updateRecord = useCallback(async (id: number, data: UpdateHistoryRequest) => {
    try {
      await updateHistory(id, data);
      // 更新本地状态
      setRecords((prev) =>
        prev.map((record) =>
          record.id === id
            ? {
                ...record,
                articleType: data.articleType ?? record.articleType,
                dealStatus: data.dealStatus ?? record.dealStatus,
              }
            : record
        )
      );
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteRecord = useCallback(async (id: number) => {
    try {
      await deleteHistory(id);
      // 从本地状态中移除
      setRecords((prev) => prev.filter((record) => record.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      throw err;
    }
  }, []);

  const fetchArticleTypes = useCallback(async () => {
    try {
      const types = await getArticleTypes();
      setArticleTypes(types);
    } catch (err) {
      console.error('获取文章类型失败:', err);
    }
  }, []);

  return {
    records,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    articleTypes,
    fetchRecords,
    updateRecord,
    deleteRecord,
    fetchArticleTypes,
    setPage,
  };
}
