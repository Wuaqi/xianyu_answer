/**
 * 对话视图组件
 * 显示会话中的所有消息和分析结果
 */

import type { MessageWithAnalysis, ExtractedInfoV3 } from '../types';

interface ConversationViewProps {
  messages: MessageWithAnalysis[];
  isLoading?: boolean;
  pendingMessage?: string | null;
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
      <div className={`max-w-[80%] ${isBuyer ? 'order-1' : 'order-2'}`}>
        <div className={`flex items-center gap-2 mb-1 ${isBuyer ? '' : 'justify-end'}`}>
          <span className={`text-xs font-medium ${isBuyer ? 'text-blue-600' : 'text-green-600'}`}>
            {isBuyer ? '买家' : '卖家'}
          </span>
          <span className="text-xs text-gray-400">
            {isPending ? '发送中...' : (createdAt ? formatTime(createdAt) : '')}
          </span>
        </div>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isBuyer
              ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
              : 'bg-blue-500 text-white rounded-tr-sm'
          } ${isPending ? 'opacity-70' : ''}`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 提取信息展示组件
 */
function ExtractedInfoCard({ info }: { info: ExtractedInfoV3 }) {
  const hasAnyInfo = info.articleType || info.topic || info.wordCount ||
                     info.deadline || info.hasReference !== undefined ||
                     (info.specialRequirements && info.specialRequirements.length > 0);

  if (!hasAnyInfo) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium text-blue-700">已提取信息</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-gray-600">
        {info.articleType && (
          <div><span className="text-gray-400">类型:</span> {info.articleType}</div>
        )}
        {info.topic && (
          <div><span className="text-gray-400">主题:</span> {info.topic}</div>
        )}
        {info.wordCount && (
          <div><span className="text-gray-400">字数:</span> {info.wordCount}字</div>
        )}
        {info.deadline && (
          <div><span className="text-gray-400">截止:</span> {info.deadline}</div>
        )}
        {info.hasReference !== undefined && (
          <div>
            <span className="text-gray-400">参考资料:</span> {info.hasReference ? '有' : '无'}
          </div>
        )}
        {info.specialRequirements && info.specialRequirements.length > 0 && (
          <div className="col-span-2">
            <span className="text-gray-400">特殊要求:</span> {info.specialRequirements.join('、')}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 缺失信息提示
 */
function MissingInfoAlert({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-medium text-amber-700">仍需了解</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ConversationView({ messages, isLoading, pendingMessage }: ConversationViewProps) {
  // 如果没有消息且没有待发送消息，显示空状态
  if (messages.length === 0 && !pendingMessage) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>输入买家消息开始对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map(({ message, analysis }) => (
        <div key={message.id} className="space-y-3">
          {/* 消息气泡 */}
          <MessageBubble
            role={message.role as 'buyer' | 'seller'}
            content={message.content}
            createdAt={message.createdAt}
          />

          {/* 买家消息后显示分析结果 */}
          {message.role === 'buyer' && analysis && (
            <div className="ml-4 space-y-2">
              <ExtractedInfoCard info={analysis.extractedInfo} />
              <MissingInfoAlert items={analysis.missingInfo} />
            </div>
          )}
        </div>
      ))}

      {/* 待发送的消息（立即显示） */}
      {pendingMessage && (
        <div className="space-y-3">
          <MessageBubble
            role="buyer"
            content={pendingMessage}
            isPending={true}
          />
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
