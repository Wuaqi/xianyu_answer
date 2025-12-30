/**
 * 快捷标签组件
 * 显示AI推荐的快捷操作标签，点击可触发相应动作
 */

interface QuickTagsProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  canQuote?: boolean;
}

// 预设的快捷话术
const TAG_PHRASES: Record<string, string> = {
  '询问字数': '请问您这篇文章大概需要多少字呢?',
  '询问截止时间': '请问您的截止时间是什么时候?',
  '询问参考资料': '请问您有参考资料或者格式要求吗?',
  '确认需求': '好的，我确认一下您的需求...',
  '发送报价': '', // 特殊处理，触发报价展示
  '询问格式要求': '请问对格式有什么特殊要求吗?比如字体、行间距等',
  '询问查重要求': '请问需要查重吗?查重率要求多少?',
  '询问主题': '请问文章的主题或题目是什么?',
};

export function QuickTags({ tags, onTagClick, canQuote }: QuickTagsProps) {
  if (!tags || tags.length === 0) return null;

  const handleClick = (tag: string) => {
    if (onTagClick) {
      const phrase = TAG_PHRASES[tag] || tag;
      onTagClick(phrase);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">快捷操作</span>
        {canQuote && (
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
            信息充足，可报价
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => {
          const isQuoteTag = tag === '发送报价';
          return (
            <button
              key={index}
              onClick={() => handleClick(tag)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                isQuoteTag
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
