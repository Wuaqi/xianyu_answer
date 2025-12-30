/**
 * 组合历史记录页面
 * 整合快速分析记录（V2）和对话会话记录（V3）
 */

import { useState } from 'react';
import { HistoryList } from './HistoryList';
import { SessionHistoryList } from './SessionHistoryList';

type RecordType = 'all' | 'quick' | 'session';

interface CombinedHistoryPageProps {
  onViewSession?: (sessionId: number) => void;
}

export function CombinedHistoryPage({ onViewSession }: CombinedHistoryPageProps) {
  const [recordType, setRecordType] = useState<RecordType>('all');

  return (
    <div className="space-y-4">
      {/* 类型筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">记录类型:</span>
          <button
            onClick={() => setRecordType('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              recordType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setRecordType('quick')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              recordType === 'quick'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            快速分析
          </button>
          <button
            onClick={() => setRecordType('session')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              recordType === 'session'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            对话会话
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      {recordType === 'all' ? (
        <div className="space-y-6">
          {/* 对话会话 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-1">对话会话</h3>
            <SessionHistoryList onSelectSession={onViewSession} />
          </div>
          {/* 快速分析 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-1">快速分析</h3>
            <HistoryList />
          </div>
        </div>
      ) : recordType === 'quick' ? (
        <HistoryList />
      ) : (
        <SessionHistoryList onSelectSession={onViewSession} />
      )}
    </div>
  );
}
