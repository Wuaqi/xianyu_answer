interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function MessageInput({ value, onChange, onAnalyze, isAnalyzing }: MessageInputProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-medium text-gray-700">粘贴买家消息</label>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            清空
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在这里粘贴买家的咨询消息..."
        className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      <button
        onClick={onAnalyze}
        disabled={!value.trim() || isAnalyzing}
        className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? '分析中...' : '分析并生成回复'}
      </button>
    </div>
  );
}
