import { useState, useEffect } from 'react';
import type { PromptTemplates } from '../types';
import { getPrompts, updatePrompts } from '../services/api';
import { getRetentionTemplate, updateRetentionTemplate, getReviewTemplate, updateReviewTemplate } from '../services/sessionApi';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PromptTab = 'analyze_v3' | 'retention' | 'review';

const TAB_CONFIG: { key: PromptTab; label: string; description: string }[] = [
  {
    key: 'analyze_v3',
    label: '对话分析',
    description: '对话助手的分析提示词，可用变量：{conversation_history}（对话历史）、{accumulated_info}（已提取信息）、{service_list}（服务列表）',
  },
  {
    key: 'retention',
    label: '挽留话术',
    description: '当会话未成交时，用于挽留客户的话术模板',
  },
  {
    key: 'review',
    label: '要好评',
    description: '成交后发送给客户的好评请求话术模板',
  },
];

export function PromptModal({ isOpen, onClose }: PromptModalProps) {
  const [prompts, setPrompts] = useState<PromptTemplates>({
    analyze_v3: '',
    retention: '',
    review: '',
  });
  const [activeTab, setActiveTab] = useState<PromptTab>('analyze_v3');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setMessage(null);

      // 并行加载提示词、挽留话术和要好评话术
      Promise.all([
        getPrompts(),
        getRetentionTemplate().catch(() => ({ content: '亲，看到您还没有下单，是有什么顾虑吗？我们可以再聊聊~' })),
        getReviewTemplate().catch(() => ({ content: '感谢您的信任和支持！如果对这次服务满意的话，麻烦给个好评哦～' })),
      ])
        .then(([promptsData, retentionData, reviewData]) => {
          setPrompts({
            analyze_v3: promptsData.analyze_v3,
            retention: retentionData.content,
            review: reviewData.content,
          });
        })
        .catch((err) => setMessage({ type: 'error', text: err.message }))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // 保存提示词
      await updatePrompts({
        analyze_v3: prompts.analyze_v3,
      });

      // 保存挽留话术
      await updateRetentionTemplate({ content: prompts.retention });

      // 保存要好评话术
      await updateReviewTemplate({ content: prompts.review });

      setMessage({ type: 'success', text: '保存成功' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (value: string) => {
    setPrompts((prev) => ({ ...prev, [activeTab]: value }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4 h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">提示词设置</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              加载中...
            </div>
          ) : (
            <>
              <div className="mb-2 text-sm text-gray-600">
                <span>{TAB_CONFIG.find((t) => t.key === activeTab)?.description}</span>
              </div>
              <textarea
                value={prompts[activeTab]}
                onChange={(e) => handleChange(e.target.value)}
                className="flex-1 w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`输入${TAB_CONFIG.find((t) => t.key === activeTab)?.label}提示词...`}
              />
            </>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-4 mb-2 p-2 text-sm rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
