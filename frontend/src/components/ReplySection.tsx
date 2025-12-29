import { useState } from 'react';

interface ReplySectionProps {
  reply: string;
  onReplyChange?: (reply: string) => void;
  onOpenTemplates?: () => void;
}

export function ReplySection({ reply, onReplyChange, onOpenTemplates }: ReplySectionProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-700">建议回复</h3>
        <div className="flex items-center gap-2">
          {onOpenTemplates && (
            <button
              onClick={onOpenTemplates}
              className="px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            >
              模板库
            </button>
          )}
          {onReplyChange && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              {isEditing ? '完成' : '编辑'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {isEditing && onReplyChange ? (
        <textarea
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg min-h-[200px] resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg whitespace-pre-wrap text-gray-700">
          {reply}
        </div>
      )}
    </div>
  );
}
