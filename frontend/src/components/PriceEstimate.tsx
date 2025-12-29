import type { PriceEstimate as PriceEstimateType } from '../types';

interface PriceEstimateProps {
  estimate: PriceEstimateType;
}

export function PriceEstimate({ estimate }: PriceEstimateProps) {
  const { min, max, basis, canQuote } = estimate;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-700">报价参考</h3>
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
        <div className="text-xl font-bold text-green-700">
          预估价格: ¥{min} - ¥{max}
        </div>
        <div className="text-sm text-green-600">{basis}</div>
        {!canQuote && (
          <div className="text-sm text-yellow-600 flex items-center gap-1">
            <span>⚠️</span>
            <span>最终报价需确认具体要求后确定</span>
          </div>
        )}
      </div>
    </div>
  );
}
