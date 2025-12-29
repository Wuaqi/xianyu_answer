import { useState, useEffect } from 'react';
import type { HistoryRecord, DealStatus } from '../types';
import { useHistory } from '../hooks/useHistory';
import { HistoryFilter } from './HistoryFilter';
import { HistoryDetail } from './HistoryDetail';
import { DealStatusBadge } from './DealStatusBadge';

export function HistoryList() {
  const {
    records,
    total,
    page,
    totalPages,
    isLoading,
    error,
    articleTypes,
    fetchRecords,
    updateRecord,
    deleteRecord,
    fetchArticleTypes,
  } = useHistory();

  const [search, setSearch] = useState('');
  const [articleType, setArticleType] = useState('');
  const [dealStatus, setDealStatus] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchRecords({ page: 1 });
    fetchArticleTypes();
  }, []);

  const handleSearch = () => {
    fetchRecords({
      page: 1,
      search,
      articleType,
      dealStatus,
    });
  };

  const handlePageChange = (newPage: number) => {
    fetchRecords({
      page: newPage,
      search,
      articleType,
      dealStatus,
    });
  };

  const handleStatusChange = async (id: number, status: DealStatus) => {
    try {
      await updateRecord(id, { dealStatus: status });
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const handleViewDetail = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* 筛选条件 */}
      <HistoryFilter
        search={search}
        articleType={articleType}
        dealStatus={dealStatus}
        articleTypes={articleTypes}
        onSearchChange={setSearch}
        onArticleTypeChange={setArticleType}
        onDealStatusChange={setDealStatus}
        onSearch={handleSearch}
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-center py-8 text-red-500">{error}</div>
      )}

      {/* 空状态 */}
      {!isLoading && !error && records.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暂无历史记录
        </div>
      )}

      {/* 列表 */}
      {!isLoading && !error && records.length > 0 && (
        <>
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleViewDetail(record)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 左侧内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(record.createdAt)}
                      </span>
                      {record.detectedTypeName && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {record.detectedTypeName}
                        </span>
                      )}
                      {record.articleType && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                          {record.articleType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {truncateText(record.buyerMessage, 100)}
                    </p>
                    <p className="text-xs text-gray-500">
                      报价: ¥{record.priceMin} - ¥{record.priceMax}
                    </p>
                  </div>

                  {/* 右侧状态 */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <DealStatusBadge
                      status={record.dealStatus}
                      onChange={(status) => handleStatusChange(record.id, status)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-gray-500">
                共 {total} 条记录，第 {page}/{totalPages} 页
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 详情弹窗 */}
      <HistoryDetail
        record={selectedRecord}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onUpdate={updateRecord}
        onDelete={deleteRecord}
        articleTypes={articleTypes}
      />
    </div>
  );
}
