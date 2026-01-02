import { useState } from 'react';
import type { ReactNode } from 'react';
import { MessageInput } from './components/MessageInput';
import { AnalysisResult } from './components/AnalysisResult';
import { ReplySection } from './components/ReplySection';
import { PriceEstimate } from './components/PriceEstimate';
import { SettingsModal } from './components/SettingsModal';
import { PriceListModal } from './components/PriceListModal';
import { PromptModal } from './components/PromptModal';
import { CombinedHistoryPage } from './components/CombinedHistoryPage';
import { TemplatePanel } from './components/TemplatePanel';
import { SessionPanel } from './components/SessionPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { analyzeMessage } from './services/api';
import { createHistory } from './services/historyApi';
import type { LLMConfig, AnalysisResponse, TabType } from './types';
import './index.css';

const DEFAULT_CONFIG: LLMConfig = {
  baseUrl: '',
  apiKey: '',
  modelId: '',
};

// 侧边栏/底部导航项
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
    key: 'analyze',
    label: '分析',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [editedReply, setEditedReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [showSettings, setShowSettings] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [sessionIdToLoad, setSessionIdToLoad] = useState<number | undefined>(undefined);

  const handleAnalyze = async () => {
    if (!message.trim()) return;

    if (!config.baseUrl || !config.apiKey || !config.modelId) {
      setError('请先配置大模型API');
      setShowSettings(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeMessage({
        message: message.trim(),
        llmConfig: config,
      });
      setResult(response);
      setEditedReply(response.suggestedReply);

      // 自动保存到历史记录
      try {
        await createHistory({
          buyerMessage: message.trim(),
          analysisResult: response,
        });
      } catch (err) {
        console.error('保存历史记录失败:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsertTemplate = (content: string) => {
    setEditedReply((prev) => prev + '\n' + content);
    setShowTemplatePanel(false);
  };

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
        ) : activeTab === 'analyze' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
              {/* Message Input */}
              <section className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <MessageInput
                  value={message}
                  onChange={setMessage}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
              </section>

              {/* Error */}
              {error && (
                <div className="p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm md:text-base">
                  {error}
                </div>
              )}

              {/* Results */}
              {result && (
                <>
                  {/* Analysis Result */}
                  <section className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                    <AnalysisResult result={result} />
                  </section>

                  {/* Suggested Reply */}
                  <section className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                    <ReplySection
                      reply={editedReply}
                      onReplyChange={setEditedReply}
                      onOpenTemplates={() => setShowTemplatePanel(true)}
                    />
                  </section>

                  {/* Price Estimate */}
                  <section className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                    <PriceEstimate estimate={result.priceEstimate} />
                  </section>
                </>
              )}

              {/* Price List Link */}
              <div className="text-center">
                <button
                  onClick={() => setShowPriceList(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  查看完整价目表
                </button>
              </div>
            </div>
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
      <PriceListModal
        isOpen={showPriceList}
        onClose={() => setShowPriceList(false)}
      />
      <PromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />
      <TemplatePanel
        isOpen={showTemplatePanel}
        onClose={() => setShowTemplatePanel(false)}
        onInsert={handleInsertTemplate}
      />
    </div>
  );
}

export default App;
