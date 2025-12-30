/**
 * 推荐回复组件
 * 显示3-5个AI生成的回复选项，每个都有复制按钮
 */

import { useState } from 'react';

interface SuggestedRepliesProps {
  replies: string[];
  onSelect?: (reply: string) => void;
}

export function SuggestedReplies({ replies, onSelect }: SuggestedRepliesProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!replies || replies.length === 0) return null;

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSelect = (reply: string) => {
    if (onSelect) {
      onSelect(reply);
    }
  };

  // 回复风格标签
  const styleLabels = ['亲切友好', '专业简洁', '热情积极', '包含报价', '其他风格'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          推荐回复 ({replies.length})
        </h3>
      </div>

      <div className="space-y-2">
        {replies.map((reply, index) => {
          const isExpanded = expandedIndex === index;
          const isCopied = copiedIndex === index;
          const displayText = isExpanded || reply.length <= 100
            ? reply
            : reply.slice(0, 100) + '...';

          return (
            <div
              key={index}
              className="group border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {/* 头部：风格标签 */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <span className="text-xs font-medium text-gray-500">
                  {styleLabels[index] || `选项 ${index + 1}`}
                </span>
                <div className="flex items-center gap-2">
                  {onSelect && (
                    <button
                      onClick={() => handleSelect(reply)}
                      className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                    >
                      使用
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(reply, index)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      isCopied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                  >
                    {isCopied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>

              {/* 内容区 */}
              <div className="p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {displayText}
                </p>
                {reply.length > 100 && (
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-600"
                  >
                    {isExpanded ? '收起' : '展开全部'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
