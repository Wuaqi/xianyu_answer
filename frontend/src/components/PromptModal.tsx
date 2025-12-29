import { useState, useEffect } from 'react';
import type { PromptTemplates } from '../types';
import { getPrompts, updatePrompts } from '../services/api';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromptModal({ isOpen, onClose }: PromptModalProps) {
  const [prompts, setPrompts] = useState<PromptTemplates>({ analyze: '', system: '' });
  const [activeTab, setActiveTab] = useState<'analyze' | 'system'>('analyze');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setMessage(null);
      getPrompts()
        .then(setPrompts)
        .catch((err) => setMessage({ type: 'error', text: err.message }))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updatePrompts(prompts);
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
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'analyze'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            分析提示词
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'system'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            系统提示词
          </button>
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
                {activeTab === 'analyze' ? (
                  <span>
                    可用变量：<code className="bg-gray-100 px-1 rounded">{'{message}'}</code>（买家消息）、
                    <code className="bg-gray-100 px-1 rounded">{'{service_list}'}</code>（服务列表）、
                    <code className="bg-gray-100 px-1 rounded">{'{service_count}'}</code>（服务数量）
                  </span>
                ) : (
                  <span>系统提示词用于设定 AI 的角色和行为规则</span>
                )}
              </div>
              <textarea
                value={prompts[activeTab]}
                onChange={(e) => handleChange(e.target.value)}
                className="flex-1 w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={activeTab === 'analyze' ? '输入分析提示词模板...' : '输入系统提示词...'}
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
