import { Dropdown } from './Dropdown';

interface HistoryFilterProps {
  search: string;
  articleType: string;
  dealStatus: string;
  articleTypes: string[];
  onSearchChange: (value: string) => void;
  onArticleTypeChange: (value: string) => void;
  onDealStatusChange: (value: string) => void;
  onSearch: () => void;
}

export function HistoryFilter({
  search,
  articleType,
  dealStatus,
  articleTypes,
  onSearchChange,
  onArticleTypeChange,
  onDealStatusChange,
  onSearch,
}: HistoryFilterProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // 文章类型选项
  const typeOptions = [
    { value: '', label: '全部类型' },
    ...articleTypes.map((type) => ({ value: type, label: type })),
  ];

  // 成交状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待定' },
    { value: 'closed', label: '已成交' },
    { value: 'failed', label: '未成交' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      {/* 搜索框 */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索消息内容..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* 文章类型筛选 */}
      <Dropdown
        value={articleType}
        options={typeOptions}
        onChange={onArticleTypeChange}
        placeholder="全部类型"
      />

      {/* 成交状态筛选 */}
      <Dropdown
        value={dealStatus}
        options={statusOptions}
        onChange={onDealStatusChange}
        placeholder="全部状态"
      />

      {/* 搜索按钮 */}
      <button
        onClick={onSearch}
        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow"
      >
        搜索
      </button>
    </div>
  );
}
