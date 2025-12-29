import { useState } from 'react';
import { MessageInput } from './components/MessageInput';
import { AnalysisResult } from './components/AnalysisResult';
import { ReplySection } from './components/ReplySection';
import { PriceEstimate } from './components/PriceEstimate';
import { SettingsModal } from './components/SettingsModal';
import { PriceListModal } from './components/PriceListModal';
import { PromptModal } from './components/PromptModal';
import { TabBar } from './components/TabBar';
import { HistoryList } from './components/HistoryList';
import { TemplatePanel } from './components/TemplatePanel';
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

function App() {
  const [config, setConfig] = useLocalStorage<LLMConfig>('llm-config', DEFAULT_CONFIG);
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [editedReply, setEditedReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('analyze');
  const [showSettings, setShowSettings] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">闲鱼代写助手</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPromptModal(true)}
              className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-colors"
            >
              提示词
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-colors"
            >
              设置
            </button>
          </div>
        </header>

        {/* Tab Bar */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="space-y-6">
          {activeTab === 'analyze' ? (
            <>
              {/* Message Input */}
              <section className="bg-white rounded-xl shadow-sm p-6">
                <MessageInput
                  value={message}
                  onChange={setMessage}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />
              </section>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}

              {/* Results */}
              {result && (
                <>
                  {/* Analysis Result */}
                  <section className="bg-white rounded-xl shadow-sm p-6">
                    <AnalysisResult result={result} />
                  </section>

                  {/* Suggested Reply */}
                  <section className="bg-white rounded-xl shadow-sm p-6">
                    <ReplySection
                      reply={editedReply}
                      onReplyChange={setEditedReply}
                      onOpenTemplates={() => setShowTemplatePanel(true)}
                    />
                  </section>

                  {/* Price Estimate */}
                  <section className="bg-white rounded-xl shadow-sm p-6">
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
            </>
          ) : (
            <HistoryList />
          )}
        </main>
      </div>

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
