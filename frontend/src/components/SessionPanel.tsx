/**
 * 会话主面板组件
 * V3 对话式助手的核心交互界面
 */

import { useState, useEffect } from 'react';
import type { LLMConfig, AIAnalysis, SessionDealStatus } from '../types';
import { ConversationView } from './ConversationView';
import { SuggestedReplies } from './SuggestedReplies';
import { EndSessionModal } from './EndSessionModal';
import { useCurrentSession } from '../hooks/useSession';
import { analyzeMessage } from '../services/sessionApi';

interface SessionPanelProps {
  llmConfig: LLMConfig | null;
  onOpenSettings: () => void;
  sessionIdToLoad?: number;
  onSessionLoaded?: () => void;
}

export function SessionPanel({ llmConfig, onOpenSettings, sessionIdToLoad, onSessionLoaded }: SessionPanelProps) {
  const {
    session,
    error,
    createSession,
    loadSession,
    endSession,
    clearSession,
  } = useCurrentSession();

  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysis | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null); // 保存失败的消息用于重试
  const [showRepliesModal, setShowRepliesModal] = useState(false);

  // 解析错误信息，返回友好提示
  const getErrorHint = (error: string): { message: string; hint: string } => {
    if (error.includes('401') || error.includes('Unauthorized')) {
      return {
        message: 'API 认证失败',
        hint: '请检查 API Key 是否正确或已过期，点击「设置」重新配置'
      };
    }
    if (error.includes('403') || error.includes('Forbidden')) {
      return {
        message: 'API 访问被拒绝',
        hint: '您的 API Key 可能没有权限，请检查账户状态'
      };
    }
    if (error.includes('429') || error.includes('Rate limit')) {
      return {
        message: '请求过于频繁',
        hint: '请稍等片刻后重试'
      };
    }
    if (error.includes('500') || error.includes('502') || error.includes('503')) {
      return {
        message: 'AI 服务暂时不可用',
        hint: '服务器繁忙，请稍后重试'
      };
    }
    if (error.includes('timeout') || error.includes('ETIMEDOUT') || error.includes('网络')) {
      return {
        message: '网络连接超时',
        hint: '请检查网络连接后重试'
      };
    }
    if (error.includes('余额') || error.includes('insufficient') || error.includes('quota')) {
      return {
        message: 'API 余额不足',
        hint: '请充值后重试'
      };
    }
    return {
      message: '分析失败',
      hint: error
    };
  };

  // 从历史记录加载指定会话（优先级最高）
  useEffect(() => {
    if (sessionIdToLoad) {
      // 清除旧的状态
      setLatestAnalysis(null);
      setAnalyzeError(null);
      setInputValue('');
      setPendingMessage(null);

      loadSession(sessionIdToLoad).then(() => {
        localStorage.setItem('currentSessionId', String(sessionIdToLoad));
        onSessionLoaded?.();
      }).catch((err) => {
        console.error('加载会话失败:', err);
        onSessionLoaded?.();
      });
    }
  }, [sessionIdToLoad]);

  // 从 localStorage 恢复会话（仅在没有指定 sessionIdToLoad 时）
  useEffect(() => {
    // 如果有 sessionIdToLoad，跳过 localStorage 恢复
    if (sessionIdToLoad) {
      return;
    }

    const savedSessionId = localStorage.getItem('currentSessionId');
    if (savedSessionId && !session) {
      const sessionId = parseInt(savedSessionId, 10);
      if (!isNaN(sessionId)) {
        loadSession(sessionId).catch(() => {
          // 如果加载失败，清除保存的 ID 并重置状态
          localStorage.removeItem('currentSessionId');
        });
      }
    }
  }, [sessionIdToLoad]);

  // 当出现"会话不存在"错误时，自动清理并准备新会话
  useEffect(() => {
    if (error && error.includes('不存在')) {
      localStorage.removeItem('currentSessionId');
      // 3秒后自动清除错误
      const timer = setTimeout(() => {
        clearSession();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearSession]);

  // 保存当前会话 ID 到 localStorage
  useEffect(() => {
    if (session?.id) {
      localStorage.setItem('currentSessionId', String(session.id));
    }
  }, [session?.id]);

  // 获取最新分析（当会话变更时更新）
  useEffect(() => {
    if (session) {
      setLatestAnalysis(session.latestAnalysis || null);
    }
  }, [session]);

  // 发送消息并分析
  const handleSendMessage = async (messageContent?: string) => {
    // 如果传入的是事件对象（点击按钮时），使用 inputValue
    const content = (typeof messageContent === 'string' ? messageContent : inputValue).trim();
    if (!content) return;

    // 检查 LLM 配置
    if (!llmConfig) {
      onOpenSettings();
      return;
    }

    // 立即显示发送的消息
    setPendingMessage(content);
    setIsAnalyzing(true);
    setInputValue('');
    setAnalyzeError(null);
    setFailedMessage(null);

    try {
      let currentSessionId = session?.id;

      // 如果没有当前会话，创建新会话
      if (!currentSessionId) {
        currentSessionId = await createSession();
      }

      // 发送消息并获取分析
      const response = await analyzeMessage(currentSessionId, content, llmConfig);

      // 更新最新分析
      if (response.analysis) {
        setLatestAnalysis(response.analysis);
      } else {
        // 分析失败但消息已发送，保存消息用于重试
        setFailedMessage(content);
        setAnalyzeError(response.error || 'AI 分析失败，请检查网络连接或稍后重试');
      }

      // 重新加载会话以获取最新消息列表
      await loadSession(currentSessionId);

    } catch (err) {
      console.error('发送消息失败:', err);
      const errorMsg = err instanceof Error ? err.message : '发送消息失败';
      setFailedMessage(content);
      setAnalyzeError(errorMsg);
    } finally {
      setIsAnalyzing(false);
      setPendingMessage(null);
    }
  };

  // 重试分析失败的消息
  const handleRetry = () => {
    if (failedMessage) {
      handleSendMessage(failedMessage);
    }
  };

  // 开始新会话
  const handleNewSession = () => {
    clearSession();
    setLatestAnalysis(null);
    setInputValue('');
    setAnalyzeError(null);
    localStorage.removeItem('currentSessionId');
  };

  // 结束会话
  const handleEndSession = async (data: {
    dealStatus: SessionDealStatus;
    dealPrice?: number;
    articleType?: string;
  }) => {
    if (!session) return;

    try {
      await endSession(session.id, data);
      setShowEndModal(false);
    } catch (err) {
      console.error('结束会话失败:', err);
    }
  };

  // 键盘事件：Ctrl+Enter 发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 格式化会话标题
  const getSessionTitle = () => {
    if (!session) return '新对话';

    // 优先使用文章类型 + 时间
    const articleType = session.articleType || latestAnalysis?.extractedInfo?.articleType;
    if (articleType) {
      const date = new Date(session.createdAt);
      const timeStr = date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${articleType} ${timeStr}`;
    }

    // 回退到会话编号
    return `会话 #${session.id}`;
  };

  // 推荐回复数量
  const repliesCount = latestAnalysis?.suggestedReplies?.length || 0;

  return (
    <div className="flex flex-col h-full relative">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <h2 className="text-base md:text-lg font-medium text-gray-800 truncate">
            {getSessionTitle()}
          </h2>
          {session && (
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <span className={`px-1.5 md:px-2 py-0.5 text-xs rounded ${
                session.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {session.status === 'active' ? '进行中' : '已结束'}
              </span>
              {session.status === 'closed' && (
                <span className={`hidden sm:inline-block px-1.5 md:px-2 py-0.5 text-xs rounded ${
                  session.dealStatus === 'success'
                    ? 'bg-green-100 text-green-700'
                    : session.dealStatus === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {session.dealStatus === 'success' ? '已成交' :
                   session.dealStatus === 'failed' ? '未成交' : '待定'}
                  {session.dealStatus === 'success' && session.dealPrice && (
                    <span className="ml-1">¥{session.dealPrice}</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {session && session.status === 'active' && (
            <>
              <button
                onClick={() => setShowEndModal(true)}
                className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
              >
                结束
              </button>
              <button
                onClick={handleNewSession}
                className="hidden sm:block px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                新建
              </button>
            </>
          )}
          {session && session.status === 'closed' && (
            <button
              onClick={handleNewSession}
              className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              新对话
            </button>
          )}
        </div>
      </div>

      {/* 主内容区：桌面左右分栏，移动端全屏对话 */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* 左侧：对话视图（移动端全屏） */}
        <div className="flex-1 flex flex-col md:border-r border-gray-200 bg-white min-h-0">
          <ConversationView
            messages={session?.messages || []}
            isLoading={isAnalyzing}
            pendingMessage={pendingMessage}
          />
        </div>

        {/* 右侧：推荐回复和状态信息（仅桌面端显示） */}
        <div className="hidden md:flex md:w-96 flex-col bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 推荐回复 */}
            {latestAnalysis && latestAnalysis.suggestedReplies.length > 0 && (
              <SuggestedReplies
                replies={latestAnalysis.suggestedReplies}
              />
            )}

            {/* 报价信息 */}
            {latestAnalysis?.canQuote && latestAnalysis.priceEstimate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  建议报价
                </h4>
                <div className="text-2xl font-bold text-green-700">
                  ¥{latestAnalysis.priceEstimate.min} - ¥{latestAnalysis.priceEstimate.max}
                </div>
                {latestAnalysis.priceEstimate.basis && (
                  <p className="mt-2 text-sm text-green-600">
                    {latestAnalysis.priceEstimate.basis}
                  </p>
                )}
              </div>
            )}

            {/* 分析错误提示 */}
            {analyzeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800">{getErrorHint(analyzeError).message}</h4>
                    <p className="mt-1 text-sm text-red-600">{getErrorHint(analyzeError).hint}</p>
                    <div className="mt-3 flex items-center gap-2">
                      {failedMessage && (
                        <button
                          onClick={handleRetry}
                          disabled={isAnalyzing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          重新分析
                        </button>
                      )}
                      <button
                        onClick={() => { setAnalyzeError(null); setFailedMessage(null); }}
                        className="text-xs text-red-700 hover:text-red-800 underline"
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 空状态 */}
            {!latestAnalysis && !isAnalyzing && !analyzeError && (
              <div className="text-center text-gray-400 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p>输入买家消息后，AI将生成回复建议</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部输入区（固定在底部） */}
      <div className="border-t border-gray-200 p-3 md:p-4 bg-white">
        {/* 会话已结束提示 */}
        {session?.status === 'closed' ? (
          <div className="text-center py-2 text-gray-500">
            <p className="text-sm">会话已结束</p>
            <button
              onClick={handleNewSession}
              className="mt-1 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              开启新对话
            </button>
          </div>
        ) : (
          <>
            {/* 移动端：查看推荐回复按钮 */}
            {repliesCount > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowRepliesModal(true)}
                  className="md:hidden px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  查看回复 ({repliesCount})
                </button>
              </div>
            )}

            {/* 输入框 */}
            <div className="flex gap-2 md:gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入买家消息..."
                className="flex-1 p-2 md:p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[50px] md:min-h-[60px] text-sm md:text-base"
                disabled={isAnalyzing}
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isAnalyzing || !llmConfig}
                className="px-4 md:px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
              >
                {isAnalyzing ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  '分析'
                )}
              </button>
            </div>

            {/* LLM 未配置提示 */}
            {!llmConfig && (
              <p className="mt-2 text-xs text-amber-600">
                请先
                <button onClick={onOpenSettings} className="underline hover:text-amber-700">
                  配置大模型
                </button>
                再进行分析
              </p>
            )}

            {/* 移动端分析错误提示 */}
            {analyzeError && (
              <div className="md:hidden mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-800">{getErrorHint(analyzeError).message}</p>
                    <p className="text-xs text-red-600 mt-0.5">{getErrorHint(analyzeError).hint}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {failedMessage && (
                        <button
                          onClick={handleRetry}
                          disabled={isAnalyzing}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          重试
                        </button>
                      )}
                      <button
                        onClick={() => { setAnalyzeError(null); setFailedMessage(null); }}
                        className="text-xs text-red-700 underline"
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 移动端推荐回复弹窗 */}
      {showRepliesModal && (
        <div className="md:hidden fixed inset-0 z-50 bg-gray-100">
          {/* 弹窗头部 */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">推荐回复</h3>
            <button
              onClick={() => setShowRepliesModal(false)}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 弹窗内容 */}
          <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
            {/* 推荐回复列表 */}
            {latestAnalysis && latestAnalysis.suggestedReplies.length > 0 && (
              <SuggestedReplies
                replies={latestAnalysis.suggestedReplies}
              />
            )}

            {/* 报价信息 */}
            {latestAnalysis?.canQuote && latestAnalysis.priceEstimate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  建议报价
                </h4>
                <div className="text-2xl font-bold text-green-700">
                  ¥{latestAnalysis.priceEstimate.min} - ¥{latestAnalysis.priceEstimate.max}
                </div>
                {latestAnalysis.priceEstimate.basis && (
                  <p className="mt-2 text-sm text-green-600">
                    {latestAnalysis.priceEstimate.basis}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 底部返回按钮 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-bottom">
            <button
              onClick={() => setShowRepliesModal(false)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg"
            >
              返回对话
            </button>
          </div>
        </div>
      )}

      {/* 结束会话弹窗 */}
      {session && (
        <EndSessionModal
          isOpen={showEndModal}
          onClose={() => setShowEndModal(false)}
          session={session}
          llmConfig={llmConfig}
          onConfirm={handleEndSession}
        />
      )}
    </div>
  );
}
