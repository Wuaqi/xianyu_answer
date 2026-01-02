/**
 * 推荐回复组件
 * 显示3-5个AI生成的回复选项，每个都有复制按钮
 */

import { useState } from 'react';

interface SuggestedRepliesProps {
  replies: string[];
}

// 兼容 HTTP 环境的复制函数
const copyToClipboard = async (text: string): Promise<boolean> => {
  // 优先使用 Clipboard API（HTTPS 环境）
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback to execCommand
    }
  }

  // Fallback：使用 textarea + execCommand（兼容 HTTP）
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
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

export function SuggestedReplies({ replies }: SuggestedRepliesProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!replies || replies.length === 0) return null;

  const handleCopy = async (text: string, index: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      console.error('复制失败');
    }
  };

  // 回复风格标签
  const styleLabels = ['亲切友好', '专业简洁', '热情积极', '包含报价', '其他风格'];

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1.5 md:gap-2">
          <svg className="w-3.5 md:w-4 h-3.5 md:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          const displayText = isExpanded || reply.length <= 80
            ? reply
            : reply.slice(0, 80) + '...';

          return (
            <div
              key={index}
              className="group border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {/* 头部：风格标签 */}
              <div className="flex items-center justify-between px-2.5 md:px-3 py-1.5 md:py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <span className="text-xs font-medium text-gray-500">
                  {styleLabels[index] || `选项 ${index + 1}`}
                </span>
                <button
                  onClick={() => handleCopy(reply, index)}
                  className={`px-2.5 md:px-3 py-1 md:py-1.5 text-xs rounded transition-colors active:scale-95 ${
                    isCopied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  {isCopied ? '已复制' : '复制'}
                </button>
              </div>

              {/* 内容区 */}
              <div className="p-2.5 md:p-3">
                <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {displayText}
                </p>
                {reply.length > 80 && (
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="mt-1.5 md:mt-2 text-xs text-blue-500 hover:text-blue-600"
                  >
                    {isExpanded ? '收起' : '展开'}
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
