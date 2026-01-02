import { useState } from 'react';
import type { ReactNode } from 'react';
import { SettingsModal } from './components/SettingsModal';
import { PromptModal } from './components/PromptModal';
import { CombinedHistoryPage } from './components/CombinedHistoryPage';
import { SessionPanel } from './components/SessionPanel';
import { PriceListPage } from './components/PriceListPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { LLMConfig, TabType } from './types';
import './index.css';

const DEFAULT_CONFIG: LLMConfig = {
  baseUrl: '',
  apiKey: '',
  modelId: '',
};

// 侧边栏/底部导航项（移除了快速分析）
const NAV_ITEMS: { key: TabType; label: string; icon: ReactNode }[] = [
  {
    key: 'sessions',
    label: '对话',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    key: 'pricing',
    label: '报价',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'history',
    label: '历史',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// 底部工具按钮
const TOOL_ITEMS = [
  {
    key: 'prompt',
    label: '提示词',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: '设置',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function App() {
  const [config, setConfig] = useLocalStorage<LLMConfig>('llm-config', DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [showSettings, setShowSettings] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [sessionIdToLoad, setSessionIdToLoad] = useState<number | undefined>(undefined);

  // 从历史记录查看会话
  const handleViewSession = (sessionId: number) => {
    setSessionIdToLoad(sessionId);
    setActiveTab('sessions');
  };

  // 会话加载完成后清除
  const handleSessionLoaded = () => {
    setSessionIdToLoad(undefined);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-100">
      {/* 桌面端左侧边栏 - 移动端隐藏 */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">闲鱼代写助手</h1>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeTab === item.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 底部工具按钮 */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          {TOOL_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => item.key === 'prompt' ? setShowPromptModal(true) : setShowSettings(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {activeTab === 'sessions' ? (
          <SessionPanel
            llmConfig={config.baseUrl && config.apiKey && config.modelId ? config : null}
            onOpenSettings={() => setShowSettings(true)}
            sessionIdToLoad={sessionIdToLoad}
            onSessionLoaded={handleSessionLoaded}
          />
        ) : activeTab === 'pricing' ? (
          <div className="flex-1 overflow-y-auto">
            <PriceListPage />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
              <CombinedHistoryPage onViewSession={handleViewSession} />
            </div>
          </div>
        )}
      </main>

      {/* 移动端底部导航栏 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-1 safe-area-bottom z-50">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === item.key
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
        {TOOL_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => item.key === 'prompt' ? setShowPromptModal(true) : setShowSettings(true)}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-gray-500 transition-colors"
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onSave={setConfig}
      />
      <PromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />
    </div>
  );
}

export default App;
