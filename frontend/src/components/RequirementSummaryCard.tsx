/**
 * 需求要点卡片组件
 * 显示AI提炼的需求摘要，支持复制
 */

import { useState } from 'react';
import type { RequirementSummary } from '../types';

interface RequirementSummaryCardProps {
  summary: RequirementSummary;
  isLoading?: boolean;
}

export function RequirementSummaryCard({ summary, isLoading }: RequirementSummaryCardProps) {
  const [copied, setCopied] = useState(false);

  // 格式化为可复制的文本
  const formatAsText = (): string => {
    const lines: string[] = [];
    lines.push(`【需求要点】`);
    lines.push(`文章类型：${summary.articleType}`);
    if (summary.topic) lines.push(`主题/题目：${summary.topic}`);
    if (summary.wordCount) lines.push(`字数要求：${summary.wordCount}字`);
    if (summary.deadline) lines.push(`截止时间：${summary.deadline}`);
    if (summary.requirements && summary.requirements.length > 0) {
      lines.push(`具体要求：`);
      summary.requirements.forEach((req, i) => {
        lines.push(`  ${i + 1}. ${req}`);
      });
    }
    if (summary.notes) lines.push(`备注：${summary.notes}`);
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatAsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>正在提炼需求要点...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-100 border-b border-blue-200">
        <h4 className="font-medium text-blue-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          需求要点
        </h4>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-300'
          }`}
        >
          {copied ? '已复制' : '复制全部'}
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-4 space-y-3">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">文章类型：</span>
            <span className="font-medium text-gray-800">{summary.articleType}</span>
          </div>
          {summary.wordCount && (
            <div>
              <span className="text-gray-500">字数要求：</span>
              <span className="font-medium text-gray-800">{summary.wordCount}字</span>
            </div>
          )}
          {summary.deadline && (
            <div>
              <span className="text-gray-500">截止时间：</span>
              <span className="font-medium text-gray-800">{summary.deadline}</span>
            </div>
          )}
          {summary.topic && (
            <div className="col-span-2">
              <span className="text-gray-500">主题/题目：</span>
              <span className="font-medium text-gray-800">{summary.topic}</span>
            </div>
          )}
        </div>

        {/* 具体要求 */}
        {summary.requirements && summary.requirements.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">具体要求：</p>
            <ul className="space-y-1">
              {summary.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 备注 */}
        {summary.notes && (
          <div className="text-sm">
            <span className="text-gray-500">备注：</span>
            <span className="text-gray-700">{summary.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
