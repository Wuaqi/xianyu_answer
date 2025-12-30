/**
 * 会话历史记录列表
 * 用于历史记录页面中展示对话会话
 */

import { useState, useEffect } from 'react';
import type { SessionStatus, SessionDealStatus, SessionSummary } from '../types';
import { useSessionList } from '../hooks/useSession';
import { deleteSession } from '../services/sessionApi';
import { Dropdown } from './Dropdown';

interface SessionHistoryListProps {
  onSelectSession?: (sessionId: number) => void;
}

// 成交状态徽章
function DealStatusBadge({ status }: { status: SessionDealStatus }) {
  const config = {
    success: { bg: 'bg-green-100', text: 'text-green-700', label: '已成交' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: '未成交' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待定' },
  };
  const { bg, text, label } = config[status];

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${bg} ${text}`}>
      {label}
    </span>
  );
}

// 会话状态徽章
function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${
      status === 'active'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-600'
    }`}>
      {status === 'active' ? '进行中' : '已结束'}
    </span>
  );
}

export function SessionHistoryList({ onSelectSession }: SessionHistoryListProps) {
  const {
    sessions,
    total,
    page,
    totalPages,
    isLoading,
    error,
    fetchSessions,
    refresh,
  } = useSessionList();

  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [dealStatusFilter, setDealStatusFilter] = useState<SessionDealStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 初始加载
  useEffect(() => {
    fetchSessions();
  }, []);

  // 筛选变化时重新加载
  useEffect(() => {
    fetchSessions({
      page: 1,
      status: statusFilter || undefined,
      dealStatus: dealStatusFilter || undefined,
      search: searchQuery || undefined,
    });
  }, [statusFilter, dealStatusFilter]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions({
        page: 1,
        status: statusFilter || undefined,
        dealStatus: dealStatusFilter || undefined,
        search: searchQuery || undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 翻页
  const handlePageChange = (newPage: number) => {
    fetchSessions({
      page: newPage,
      status: statusFilter || undefined,
      dealStatus: dealStatusFilter || undefined,
      search: searchQuery || undefined,
    });
  };

  // 删除会话
  const handleDelete = async (sessionId: number) => {
    setIsDeleting(true);
    try {
      await deleteSession(sessionId);
      setDeleteConfirm(null);
      refresh();
    } catch (err) {
      console.error('删除会话失败:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // 格式化时间显示
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 点击会话
  const handleClick = (session: SessionSummary) => {
    if (onSelectSession) {
      onSelectSession(session.id);
    }
  };

  // 格式化会话标题（与对话助手保持一致）
  const getSessionTitle = (session: SessionSummary) => {
    // 使用文章类型 + 时间（如果有的话）
    if (session.articleType) {
      const date = new Date(session.createdAt);
      const timeStr = date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${session.articleType} ${timeStr}`;
    }
    // 回退到会话编号
    return `会话 #${session.id}`;
  };

  // 会话状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '进行中' },
    { value: 'closed', label: '已结束' },
  ];

  // 成交状态选项
  const dealStatusOptions = [
    { value: '', label: '全部成交状态' },
    { value: 'success', label: '已成交' },
    { value: 'failed', label: '未成交' },
    { value: 'pending', label: '待定' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* 筛选栏 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-3 items-center">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索消息内容..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 会话状态筛选 */}
          <Dropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(value) => setStatusFilter(value as SessionStatus | '')}
            placeholder="全部状态"
          />

          {/* 成交状态筛选 */}
          <Dropdown
            value={dealStatusFilter}
            options={dealStatusOptions}
            onChange={(value) => setDealStatusFilter(value as SessionDealStatus | '')}
            placeholder="全部成交状态"
          />

          {/* 刷新按钮 */}
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* 会话列表 */}
      <div className="divide-y divide-gray-100">
        {isLoading && sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p>加载中...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>暂无对话会话记录</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group"
              onClick={() => handleClick(session)}
            >
              <div className="flex items-start justify-between">
                {/* 左侧内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{getSessionTitle(session)}</span>
                    <SessionStatusBadge status={session.status} />
                    {session.status === 'closed' && (
                      <DealStatusBadge status={session.dealStatus} />
                    )}
                    {session.dealPrice && (
                      <span className="text-sm text-green-600 font-medium">
                        ¥{session.dealPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {session.previewMessage || '(无消息)'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{session.messageCount} 条消息</span>
                  </div>
                </div>

                {/* 右侧时间和操作 */}
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs text-gray-400">
                    {formatTime(session.updatedAt)}
                  </span>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(session.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 删除确认 */}
              {deleteConfirm === session.id && (
                <div
                  className="absolute inset-0 bg-white/95 flex items-center justify-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-sm text-gray-600">确定删除此会话？</span>
                  <button
                    onClick={() => handleDelete(session.id)}
                    disabled={isDeleting}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? '删除中...' : '确定'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            共 {total} 条记录
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
