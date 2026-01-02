/**
 * 对话视图组件
 * 显示会话中的所有消息和分析结果
 */

import { useState } from 'react';
import type { MessageWithAnalysis, ExtractedInfoV3, AIAnalysis, SessionStatus } from '../types';

interface ConversationViewProps {
  messages: MessageWithAnalysis[];
  isLoading?: boolean;
  pendingMessage?: string | null;
  latestAnalysis?: AIAnalysis | null;
  sessionStatus?: SessionStatus;  // 会话状态
  onSelectReply?: (reply: string) => void;  // 选择回复的回调
  selectedReplies?: Record<number, string>;  // 每轮对话选中的回复 { messageId: reply }
}

/**
 * 格式化时间显示
 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 消息气泡组件
 */
function MessageBubble({
  role,
  content,
  createdAt,
  isPending = false,
}: {
  role: 'buyer' | 'seller';
  content: string;
  createdAt?: string;
  isPending?: boolean;
}) {
  const isBuyer = role === 'buyer';

  return (
    <div className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] md:max-w-[80%] ${isBuyer ? 'order-1' : 'order-2'}`}>
        <div className={`flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 ${isBuyer ? '' : 'justify-end'}`}>
          <span className={`text-xs font-medium ${isBuyer ? 'text-blue-600' : 'text-green-600'}`}>
            {isBuyer ? '买家' : '卖家'}
          </span>
          <span className="text-xs text-gray-400">
            {isPending ? '发送中...' : (createdAt ? formatTime(createdAt) : '')}
          </span>
        </div>
        <div
          className={`px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
            isBuyer
              ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
              : 'bg-blue-500 text-white rounded-tr-sm'
          } ${isPending ? 'opacity-70' : ''}`}
        >
          <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 提取信息展示组件
 */
function ExtractedInfoCard({ info }: { info: ExtractedInfoV3 }) {
  const hasAnyInfo = info.articleType || info.topic ||
                     (info.wordCount != null && info.wordCount > 0) ||
                     info.deadline || info.hasReference !== undefined ||
                     (info.specialRequirements && info.specialRequirements.length > 0);

  if (!hasAnyInfo) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 md:p-3 text-xs md:text-sm">
      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
        <svg className="w-3.5 md:w-4 h-3.5 md:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium text-blue-700">已提取信息</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-gray-600">
        {info.articleType && (
          <div><span className="text-gray-400">类型:</span> {info.articleType}</div>
        )}
        {info.topic && (
          <div><span className="text-gray-400">主题:</span> {info.topic}</div>
        )}
        {info.wordCount != null && info.wordCount > 0 ? (
          <div><span className="text-gray-400">字数:</span> {info.wordCount}字</div>
        ) : null}
        {info.deadline && (
          <div><span className="text-gray-400">截止:</span> {info.deadline}</div>
        )}
        {info.hasReference !== undefined && (
          <div>
            <span className="text-gray-400">资料:</span> {info.hasReference ? '有' : '无'}
          </div>
        )}
        {info.specialRequirements && info.specialRequirements.length > 0 && (
          <div className="col-span-2">
            <span className="text-gray-400">要求:</span> {info.specialRequirements.join('、')}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 已选择的回复显示
 */
function SelectedReplyCard({ reply }: { reply: string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3 text-xs md:text-sm">
      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
        <svg className="w-3.5 md:w-4 h-3.5 md:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium text-green-700">已选回复</span>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{reply}</p>
    </div>
  );
}

/**
 * 缺失信息提示（导出供侧边栏使用）
 */
export function MissingInfoAlert({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 md:p-3 text-xs md:text-sm">
      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
        <svg className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-medium text-amber-700">仍需了解</span>
      </div>
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-1.5 md:px-2 py-0.5 md:py-1 bg-amber-100 text-amber-700 rounded text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * 可选择的推荐回复组件
 */
function SelectableReplies({
  replies,
  onSelect,
}: {
  replies: string[];
  onSelect: (reply: string) => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 兼容 HTTP 环境的复制函数
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback
      }
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  };

  const handleCopyAndSelect = async (reply: string, index: number) => {
    const success = await copyToClipboard(reply);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
        onSelect(reply);
      }, 500);
    }
  };

  const styleLabels = ['亲切友好', '专业简洁', '热情积极', '其他风格'];

  return (
    <div className="space-y-2">
      <h4 className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1.5">
        <svg className="w-3.5 md:w-4 h-3.5 md:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        推荐回复（点击选用）
      </h4>
      <div className="space-y-2">
        {replies.map((reply, index) => (
          <button
            key={index}
            onClick={() => handleCopyAndSelect(reply, index)}
            className={`w-full text-left border rounded-lg p-2 md:p-3 transition-all ${
              copiedIndex === index
                ? 'border-green-400 bg-green-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{styleLabels[index] || `选项 ${index + 1}`}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                copiedIndex === index ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {copiedIndex === index ? '已复制' : '点击选用'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-700 line-clamp-3">{reply}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConversationView({
  messages,
  isLoading,
  pendingMessage,
  latestAnalysis,
  sessionStatus = 'active',
  onSelectReply,
  selectedReplies = {},
}: ConversationViewProps) {
  // 如果没有消息且没有待发送消息，显示空状态
  if (messages.length === 0 && !pendingMessage) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <div className="text-center">
          <svg className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-3 md:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm md:text-base">输入买家消息开始对话</p>
        </div>
      </div>
    );
  }

  // 找到最后一条买家消息
  const lastBuyerMessage = [...messages].reverse().find(m => m.message.role === 'buyer');
  const lastBuyerMessageId = lastBuyerMessage?.message.id;
  const isSessionActive = sessionStatus === 'active';

  return (
    <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 p-3 md:p-4">
      {messages.map(({ message, analysis }, index) => {
        const isLastBuyerMessage = message.id === lastBuyerMessageId && message.role === 'buyer';
        const selectedReply = selectedReplies[message.id];
        const isLastMessage = index === messages.length - 1;

        return (
          <div key={message.id} className="space-y-2 md:space-y-3">
            {/* 消息气泡 */}
            <MessageBubble
              role={message.role as 'buyer' | 'seller'}
              content={message.content}
              createdAt={message.createdAt}
            />

            {/* 买家消息后的分析结果 */}
            {message.role === 'buyer' && analysis && (
              <div className="ml-2 md:ml-4 space-y-2 md:space-y-3">
                {/* 如果这轮已选择了回复，显示已选回复 */}
                {selectedReply && (
                  <SelectedReplyCard reply={selectedReply} />
                )}

                {/* 最后一条买家消息：显示提取信息和推荐回复 */}
                {isLastBuyerMessage && isLastMessage && (
                  <>
                    {/* 已提取信息 */}
                    <ExtractedInfoCard info={analysis.extractedInfo} />

                    {/* 如果会话进行中且未选择回复，显示推荐回复 */}
                    {isSessionActive && !selectedReply && latestAnalysis && latestAnalysis.suggestedReplies.length > 0 && onSelectReply && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
                        <SelectableReplies
                          replies={latestAnalysis.suggestedReplies}
                          onSelect={onSelectReply}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* 非最后一条买家消息：如果已选择回复就显示，否则不显示 */}
                {!isLastBuyerMessage && !isLastMessage && selectedReply && (
                  <SelectedReplyCard reply={selectedReply} />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 待发送的消息（立即显示） */}
      {pendingMessage && (
        <div className="space-y-2 md:space-y-3">
          <MessageBubble
            role="buyer"
            content={pendingMessage}
            isPending={true}
          />
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center py-3 md:py-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <svg className="w-4 md:w-5 h-4 md:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>AI分析中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
