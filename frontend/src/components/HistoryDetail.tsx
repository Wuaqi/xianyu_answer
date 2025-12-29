import { useState, useEffect } from 'react';
import type { HistoryRecord, DealStatus } from '../types';
import { DealStatusBadge } from './DealStatusBadge';

interface HistoryDetailProps {
  record: HistoryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: { articleType?: string; dealStatus?: DealStatus }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  articleTypes: string[];
}

export function HistoryDetail({
  record,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  articleTypes,
}: HistoryDetailProps) {
  const [articleType, setArticleType] = useState('');
  const [customType, setCustomType] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setArticleType(record.articleType || '');
      setCustomType('');
      setShowCustomInput(false);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalType = showCustomInput ? customType : articleType;
      await onUpdate(record.id, {
        articleType: finalType || undefined,
      });
      onClose();
    } catch (err) {
      console.error('保存失败:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await onDelete(record.id);
      onClose();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleStatusChange = async (status: DealStatus) => {
    try {
      await onUpdate(record.id, { dealStatus: status });
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">历史记录详情</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* 时间和状态 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
            <DealStatusBadge status={record.dealStatus} onChange={handleStatusChange} />
          </div>

          {/* 买家消息 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">买家消息</h3>
            <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
              {record.buyerMessage}
            </div>
          </div>

          {/* 识别结果 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">识别类型</h3>
              <p className="text-sm">{record.detectedTypeName || '未识别'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">置信度</h3>
              <p className="text-sm">{Math.round(record.confidence * 100)}%</p>
            </div>
          </div>

          {/* 提取信息 */}
          {record.extractedInfo && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">提取信息</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {record.extractedInfo.topic && (
                  <p>
                    <span className="text-gray-500">主题：</span>
                    {record.extractedInfo.topic}
                  </p>
                )}
                {record.extractedInfo.wordCount && (
                  <p>
                    <span className="text-gray-500">字数：</span>
                    {record.extractedInfo.wordCount}
                  </p>
                )}
                {record.extractedInfo.deadline && (
                  <p>
                    <span className="text-gray-500">截止时间：</span>
                    {record.extractedInfo.deadline}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 报价 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">报价参考</h3>
            <p className="text-sm">
              ¥{record.priceMin} - ¥{record.priceMax}
              {record.priceBasis && (
                <span className="text-gray-500 ml-2">({record.priceBasis})</span>
              )}
            </p>
          </div>

          {/* 生成的回复 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">生成的回复</h3>
            <div className="bg-blue-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
              {record.suggestedReply}
            </div>
          </div>

          {/* 文章类型标记 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">文章类型标记</h3>
            <div className="flex gap-2 items-center">
              {!showCustomInput ? (
                <>
                  <select
                    value={articleType}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setShowCustomInput(true);
                        setArticleType('');
                      } else {
                        setArticleType(e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">选择类型...</option>
                    {articleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="__custom__">+ 自定义类型</option>
                  </select>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="输入自定义类型"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomType('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
          >
            删除记录
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
