/**
 * 报价控制组件
 * 允许用户调整报价系数并生成最终报价
 */

import { useState, useEffect } from 'react';
import type { PriceEstimateV3 } from '../types';

interface PriceControlProps {
  priceEstimate: PriceEstimateV3;
  onCopyPrice?: (text: string) => void;
}

// 可选的系数列表
const COEFFICIENT_OPTIONS = [
  { value: 0.8, label: '8折' },
  { value: 0.9, label: '9折' },
  { value: 1.0, label: '原价' },
  { value: 1.1, label: '+10%' },
  { value: 1.2, label: '+20%' },
];

// 兼容 HTTP 环境的复制函数
const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    document.body.removeChild(textarea);
    return false;
  }
};

export function PriceControl({ priceEstimate, onCopyPrice }: PriceControlProps) {
  // 从 localStorage 读取系数，默认 1.0
  const [coefficient, setCoefficient] = useState(() => {
    const saved = localStorage.getItem('priceCoefficient');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [copied, setCopied] = useState(false);

  // 保存系数到 localStorage
  useEffect(() => {
    localStorage.setItem('priceCoefficient', String(coefficient));
  }, [coefficient]);

  if (!priceEstimate.canQuote || !priceEstimate.min || !priceEstimate.max) {
    return null;
  }

  // 计算调整后的价格
  const adjustedMin = Math.round(priceEstimate.min * coefficient);
  const adjustedMax = Math.round(priceEstimate.max * coefficient);

  // 复制价格文本
  const handleCopyPrice = async () => {
    const priceText = adjustedMin === adjustedMax
      ? `${adjustedMin}元`
      : `${adjustedMin}-${adjustedMax}元`;

    const success = await copyToClipboard(priceText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyPrice?.(priceText);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-green-800">报价参考</h4>
        <button
          onClick={handleCopyPrice}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            copied
              ? 'bg-green-200 text-green-800'
              : 'bg-green-100 hover:bg-green-200 text-green-700'
          }`}
        >
          {copied ? '已复制' : '复制价格'}
        </button>
      </div>

      {/* 价格显示 */}
      <div className="text-2xl font-bold text-green-700 mb-3">
        {adjustedMin === adjustedMax ? (
          <>¥{adjustedMin}</>
        ) : (
          <>¥{adjustedMin} - ¥{adjustedMax}</>
        )}
      </div>

      {/* 系数调整 */}
      <div className="mb-3">
        <div className="text-xs text-green-600 mb-2">调整系数：</div>
        <div className="flex flex-wrap gap-1.5">
          {COEFFICIENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setCoefficient(option.value)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                coefficient === option.value
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 原价参考 */}
      {coefficient !== 1.0 && (
        <div className="text-xs text-green-500 mb-2">
          原价：¥{priceEstimate.min} - ¥{priceEstimate.max}
        </div>
      )}

      {/* 计算依据 */}
      {priceEstimate.basis && (
        <p className="text-xs text-green-600 border-t border-green-200 pt-2 mt-2">
          {priceEstimate.basis}
        </p>
      )}
    </div>
  );
}
