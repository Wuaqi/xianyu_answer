import type { AnalysisResponse } from '../types';

interface AnalysisResultProps {
  result: AnalysisResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const { detectedType, extractedInfo, missingInfo, confidence } = result;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700">分析结果</h3>

      <div className="flex flex-wrap gap-3">
        {detectedType && (
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <span className="text-sm text-blue-600">类型:</span>{' '}
            <span className="font-medium">{detectedType.name}</span>
            {confidence > 0 && (
              <span className="ml-2 text-xs text-blue-500">
                ({Math.round(confidence * 100)}%)
              </span>
            )}
          </div>
        )}

        {extractedInfo.wordCount && (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <span className="text-sm text-green-600">字数:</span>{' '}
            <span className="font-medium">{extractedInfo.wordCount}字</span>
          </div>
        )}

        {extractedInfo.deadline && (
          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg">
            <span className="text-sm text-purple-600">截止:</span>{' '}
            <span className="font-medium">{extractedInfo.deadline}</span>
          </div>
        )}

        {extractedInfo.topic && (
          <div className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
            <span className="text-sm text-orange-600">主题:</span>{' '}
            <span className="font-medium">{extractedInfo.topic}</span>
          </div>
        )}
      </div>

      {missingInfo.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-yellow-700 font-medium">缺失信息: </span>
          <span className="text-yellow-600">{missingInfo.join(' | ')}</span>
        </div>
      )}
    </div>
  );
}
