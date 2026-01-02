/**
 * 会话历史记录页面
 * 展示对话会话记录（V3）
 */

import { SessionHistoryList } from './SessionHistoryList';

interface CombinedHistoryPageProps {
  onViewSession?: (sessionId: number) => void;
}

export function CombinedHistoryPage({ onViewSession }: CombinedHistoryPageProps) {
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-medium text-gray-800">历史记录</h2>
        <p className="text-sm text-gray-500 mt-1">查看所有对话会话记录</p>
      </div>

      {/* 会话列表 */}
      <SessionHistoryList onSelectSession={onViewSession} />
    </div>
  );
}
