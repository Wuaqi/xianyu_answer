import { useState, useEffect } from 'react';
import type { ReplyTemplate } from '../types';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateEditModal } from './TemplateEditModal';

interface TemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

export function TemplatePanel({ isOpen, onClose, onInsert }: TemplatePanelProps) {
  const {
    templates,
    isLoading,
    error,
    fetchTemplates,
    addTemplate,
    editTemplate,
    removeTemplate,
  } = useTemplates();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReplyTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async (template: ReplyTemplate) => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleInsert = (template: ReplyTemplate) => {
    onInsert(template.content);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowEditModal(true);
  };

  const handleEdit = (template: ReplyTemplate) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await removeTemplate(id);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleSave = async (data: { title: string; content: string }) => {
    if (editingTemplate) {
      await editTemplate(editingTemplate.id, data);
    } else {
      await addTemplate(data);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">回复模板库</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              新建模板
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}

          {!isLoading && !error && templates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无模板，点击"新建模板"添加
            </div>
          )}

          {!isLoading && !error && templates.length > 0 && (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{template.title}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleInsert(template)}
                        className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                      >
                        插入
                      </button>
                      <button
                        onClick={() => handleCopy(template)}
                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                      >
                        {copiedId === template.id ? '已复制' : '复制'}
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {template.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            点击"插入"将模板内容添加到回复末尾，点击"复制"复制到剪贴板
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      <TemplateEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
        initialData={editingTemplate ? { title: editingTemplate.title, content: editingTemplate.content } : undefined}
        mode={editingTemplate ? 'edit' : 'create'}
      />
    </div>
  );
}
