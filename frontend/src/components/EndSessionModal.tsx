/**
 * 结束会话弹窗
 * 选择成交状态，记录成交信息或显示挽留话术
 */

import { useState, useEffect } from 'react';
import type { SessionDetail, SessionDealStatus, RequirementSummary, LLMConfig } from '../types';
import { RequirementSummaryCard } from './RequirementSummaryCard';
import { summarizeRequirements, getRetentionTemplate } from '../services/sessionApi';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionDetail;
  llmConfig: LLMConfig | null;
  onConfirm: (data: {
    dealStatus: SessionDealStatus;
    dealPrice?: number;
    articleType?: string;
  }) => void;
}

// 常见文章类型
const ARTICLE_TYPES = [
  '论文',
  '报告',
  '总结',
  '演讲稿',
  '新闻稿',
  '软文',
  '公文',
  '申报书',
  '策划书',
  '其他',
];

export function EndSessionModal({
  isOpen,
  onClose,
  session,
  llmConfig,
  onConfirm,
}: EndSessionModalProps) {
  const [dealStatus, setDealStatus] = useState<SessionDealStatus>('pending');
  const [dealPrice, setDealPrice] = useState<string>('');
  const [articleType, setArticleType] = useState<string>('');
  const [customType, setCustomType] = useState<string>('');
  const [requirementSummary, setRequirementSummary] = useState<RequirementSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [retentionTemplate, setRetentionTemplate] = useState<string>('');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [copied, setCopied] = useState(false);

  // 当选择成交时，自动提炼需求要点
  useEffect(() => {
    if (dealStatus === 'success' && llmConfig && !requirementSummary && !isLoadingSummary) {
      loadRequirementSummary();
    }
  }, [dealStatus, llmConfig]);

  // 当选择未成交时，加载挽留话术
  useEffect(() => {
    if (dealStatus === 'failed' && !retentionTemplate && !isLoadingTemplate) {
      loadRetentionTemplate();
    }
  }, [dealStatus]);

  // 从会话最新分析中获取文章类型
  useEffect(() => {
    if (session.latestAnalysis?.extractedInfo?.articleType) {
      const type = session.latestAnalysis.extractedInfo.articleType;
      if (ARTICLE_TYPES.includes(type)) {
        setArticleType(type);
      } else {
        setArticleType('其他');
        setCustomType(type);
      }
    }
  }, [session]);

  const loadRequirementSummary = async () => {
    if (!llmConfig) return;

    setIsLoadingSummary(true);
    try {
      const summary = await summarizeRequirements(session.id, llmConfig);
      setRequirementSummary(summary);

      // 自动填充文章类型
      if (summary.articleType && !articleType) {
        if (ARTICLE_TYPES.includes(summary.articleType)) {
          setArticleType(summary.articleType);
        } else {
          setArticleType('其他');
          setCustomType(summary.articleType);
        }
      }
    } catch (err) {
      console.error('提炼需求要点失败:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadRetentionTemplate = async () => {
    setIsLoadingTemplate(true);
    try {
      const template = await getRetentionTemplate();
      setRetentionTemplate(template.content);
    } catch (err) {
      console.error('加载挽留话术失败:', err);
      // 使用默认话术
      setRetentionTemplate('亲，看到您还没有下单，是有什么顾虑吗？我们可以再聊聊~');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleCopyRetention = async () => {
    try {
      await navigator.clipboard.writeText(retentionTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleConfirm = () => {
    const finalArticleType = articleType === '其他' ? customType : articleType;

    onConfirm({
      dealStatus,
      dealPrice: dealStatus === 'success' ? parseInt(dealPrice) || undefined : undefined,
      articleType: dealStatus === 'success' ? finalArticleType : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">结束会话</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 成交状态选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">成交状态</label>
            <div className="flex gap-3">
              <button
                onClick={() => setDealStatus('success')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  dealStatus === 'success'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">已成交</span>
                </div>
              </button>
              <button
                onClick={() => setDealStatus('failed')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  dealStatus === 'failed'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-medium">未成交</span>
                </div>
              </button>
              <button
                onClick={() => setDealStatus('pending')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  dealStatus === 'pending'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">待定</span>
                </div>
              </button>
            </div>
          </div>

          {/* 成交信息 */}
          {dealStatus === 'success' && (
            <div className="space-y-4">
              {/* 成交价格 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">成交价格</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    placeholder="请输入成交价格"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 文章类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">文章类型</label>
                <select
                  value={articleType}
                  onChange={(e) => setArticleType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">请选择</option>
                  {ARTICLE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {articleType === '其他' && (
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="请输入文章类型"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* 需求要点 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">需求要点</label>
                {requirementSummary ? (
                  <RequirementSummaryCard summary={requirementSummary} />
                ) : isLoadingSummary ? (
                  <RequirementSummaryCard
                    summary={{ articleType: '', requirements: [] }}
                    isLoading={true}
                  />
                ) : llmConfig ? (
                  <button
                    onClick={loadRequirementSummary}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    点击提炼需求要点
                  </button>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                    请先配置大模型API才能提炼需求要点
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 未成交 - 挽留话术 */}
          {dealStatus === 'failed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">挽留话术</label>
              <div className="relative">
                <textarea
                  value={retentionTemplate}
                  onChange={(e) => setRetentionTemplate(e.target.value)}
                  placeholder="加载中..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-y"
                  disabled={isLoadingTemplate}
                />
                <button
                  onClick={handleCopyRetention}
                  disabled={isLoadingTemplate || !retentionTemplate}
                  className={`absolute top-2 right-2 px-3 py-1 text-xs rounded transition-colors ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                复制话术发送给买家，尝试挽留订单
              </p>
            </div>
          )}

          {/* 待定说明 */}
          {dealStatus === 'pending' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                会话将被标记为待定状态，您可以稍后继续跟进。
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 text-white rounded-lg transition-colors ${
              dealStatus === 'success'
                ? 'bg-green-600 hover:bg-green-700'
                : dealStatus === 'failed'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            确认结束
          </button>
        </div>
      </div>
    </div>
  );
}
