/**
 * 报价计算器组件
 * 根据 AI 分析结果自动匹配报价表，用户选择难度系数和数量
 * 显示价格范围（简单价到复杂价）
 */

import { useState, useEffect, useMemo } from 'react';
import type { ServiceType, ExtractedInfoV3 } from '../types';
import { getServices } from '../services/api';

interface PriceCalculatorProps {
  extractedInfo?: ExtractedInfoV3;  // AI 提取的信息
  onPriceChange?: (price: number | null) => void;  // 当价格变化时回调
}

// 难度系数选项
const DIFFICULTY_OPTIONS = [
  { value: 1.0, label: '简单', description: '常规要求，无特殊复杂度' },
  { value: 1.2, label: '中等', description: '有一定要求，需要仔细处理' },
  { value: 1.5, label: '复杂', description: '要求较高，需要专业处理' },
  { value: 2.0, label: '特殊', description: '非常复杂或加急处理' },
];

// 单位显示映射
const UNIT_LABELS: Record<string, string> = {
  thousand: '千字',
  page: '页',
  minute: '分钟',
  piece: '篇',
};

export function PriceCalculator({ extractedInfo, onPriceChange }: PriceCalculatorProps) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 用户可调整的参数
  const [difficulty, setDifficulty] = useState<number>(1.0);
  const [customDifficulty, setCustomDifficulty] = useState<string>('1');  // 自定义系数输入框
  const [manualQuantity, setManualQuantity] = useState<string>('');

  // 加载服务列表
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError('加载服务列表失败');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据 AI 提取的信息自动匹配服务类型
  const matchedService = useMemo(() => {
    if (!extractedInfo?.articleType || services.length === 0) return null;

    const articleType = extractedInfo.articleType.toLowerCase();

    // 尝试精确匹配
    let matched = services.find(s => {
      const serviceName = s.name.toLowerCase();
      return serviceName.includes(articleType) || articleType.includes(serviceName.replace(/[（(].+[)）]/g, '').trim());
    });

    // 模糊匹配常见类型
    if (!matched) {
      if (articleType.includes('ppt') || articleType.includes('演示')) {
        matched = services.find(s => s.name.toLowerCase().includes('ppt'));
      } else if (articleType.includes('论文')) {
        matched = services.find(s => s.name.includes('文献综述') || s.name.includes('报告'));
      } else if (articleType.includes('报告')) {
        matched = services.find(s => s.name.includes('报告'));
      } else if (articleType.includes('策划')) {
        matched = services.find(s => s.name.includes('策划'));
      } else if (articleType.includes('演讲')) {
        matched = services.find(s => s.name.includes('演讲'));
      } else if (articleType.includes('公文')) {
        matched = services.find(s => s.name.includes('公文'));
      }
    }

    return matched;
  }, [extractedInfo?.articleType, services]);

  // 获取单位标签
  const unitLabel = matchedService ? UNIT_LABELS[matchedService.unit] || '千字' : '千字';

  // 根据 AI 提取的信息计算初始数量（用于自动填充）
  useEffect(() => {
    if (!extractedInfo?.wordCount || !matchedService) return;

    const wc = extractedInfo.wordCount;
    let autoQuantity: number;

    switch (matchedService.unit) {
      case 'thousand':
        // 字数转千字，向上取整到0.5
        autoQuantity = Math.ceil(wc / 500) * 0.5;
        break;
      case 'page':
        // PPT等按页计算
        // 如果字数很大（>100），可能是误识别为字数，尝试估算页数
        autoQuantity = wc > 100 ? Math.ceil(wc / 300) : wc;
        break;
      case 'minute':
        autoQuantity = wc;
        break;
      case 'piece':
        autoQuantity = wc > 10 ? 1 : wc;
        break;
      default:
        autoQuantity = Math.ceil(wc / 1000);
    }

    setManualQuantity(String(autoQuantity));
  }, [extractedInfo?.wordCount, matchedService]);

  // 获取最终数量
  const quantity = useMemo(() => {
    const qty = parseFloat(manualQuantity);
    return isNaN(qty) || qty <= 0 ? null : qty;
  }, [manualQuantity]);

  // 计算价格范围
  const priceRange = useMemo(() => {
    if (!matchedService || !quantity || quantity <= 0) return null;

    const simplePrice = matchedService.priceSimple;
    const complexPrice = matchedService.priceComplex;

    if (!simplePrice && !complexPrice) return null;

    // 计算最低价和最高价
    const minBasePrice = simplePrice || complexPrice!;
    const maxBasePrice = complexPrice || simplePrice!;

    const minPrice = Math.round(minBasePrice * quantity * difficulty);
    const maxPrice = Math.round(maxBasePrice * quantity * difficulty);

    // 千字计价时，最低价格保护（千字20元）
    let finalMin = minPrice;
    let finalMax = maxPrice;
    if (matchedService.unit === 'thousand') {
      const minProtection = Math.round(20 * quantity * difficulty);
      finalMin = Math.max(minPrice, minProtection);
      finalMax = Math.max(maxPrice, minProtection);
    }

    return {
      min: finalMin,
      max: finalMax,
      baseMin: minBasePrice,
      baseMax: maxBasePrice,
    };
  }, [matchedService, quantity, difficulty]);

  // 当价格变化时通知父组件
  useEffect(() => {
    if (priceRange) {
      // 返回价格范围的中间值
      const avgPrice = Math.round((priceRange.min + priceRange.max) / 2);
      onPriceChange?.(avgPrice);
    } else {
      onPriceChange?.(null);
    }
  }, [priceRange, onPriceChange]);

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  // 如果没有 AI 分析信息
  if (!extractedInfo?.articleType) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-700">
          暂无 AI 分析信息，请使用手动输入模式
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      {/* 自动识别的信息 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-blue-800">AI 识别信息</h4>

        {/* 匹配的报价表项 */}
        {matchedService ? (
          <div className="bg-white rounded px-3 py-2 border border-blue-100">
            <span className="text-blue-500 text-xs">匹配报价表</span>
            <p className="text-blue-800 font-medium">
              {matchedService.name} - ¥{matchedService.priceSimple || '?'}
              {matchedService.priceComplex && `~${matchedService.priceComplex}`}/{unitLabel}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 rounded px-3 py-2 border border-amber-200">
            <p className="text-amber-700 text-sm">
              "{extractedInfo.articleType}" 未匹配到报价表，请使用手动输入
            </p>
          </div>
        )}
      </div>

      {matchedService && (
        <>
          {/* 数量输入 */}
          <div>
            <label className="block text-xs text-blue-600 mb-1">
              数量（{unitLabel}）
              {extractedInfo.wordCount != null && extractedInfo.wordCount > 0 ? (
                <span className="ml-1 text-blue-400">AI识别: {extractedInfo.wordCount}字</span>
              ) : null}
            </label>
            <input
              type="number"
              value={manualQuantity}
              onChange={(e) => setManualQuantity(e.target.value)}
              placeholder={`输入${unitLabel}数`}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>

          {/* 难度系数选择 */}
          <div>
            <label className="block text-xs text-blue-600 mb-2">
              难度系数
            </label>
            {/* 预设系数按钮 */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDifficulty(option.value);
                    setCustomDifficulty(String(option.value));
                  }}
                  className={`px-2 py-2 text-sm rounded-lg transition-colors ${
                    difficulty === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                  }`}
                  title={option.description}
                >
                  <div className="font-medium text-xs">{option.label}</div>
                  <div className="text-xs opacity-75">×{option.value}</div>
                </button>
              ))}
            </div>
            {/* 自定义系数输入 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-500">自定义：</span>
              <div className="flex items-center gap-1 flex-1">
                <span className="text-blue-600 text-sm">×</span>
                <input
                  type="number"
                  value={customDifficulty}
                  onChange={(e) => {
                    setCustomDifficulty(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setDifficulty(val);
                    }
                  }}
                  onBlur={() => {
                    // 失去焦点时，如果为空则恢复为1
                    if (!customDifficulty || parseFloat(customDifficulty) <= 0) {
                      setCustomDifficulty('1');
                      setDifficulty(1);
                    }
                  }}
                  min="0.1"
                  step="0.1"
                  placeholder="1.0"
                  className="w-20 px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-center"
                />
              </div>
            </div>
          </div>

          {/* 价格范围显示 */}
          {priceRange ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700">建议报价范围</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {priceRange.min === priceRange.max ? (
                  <>¥{priceRange.min}</>
                ) : (
                  <>¥{priceRange.min} ~ ¥{priceRange.max}</>
                )}
              </div>
              <p className="mt-2 text-xs text-green-600">
                计算：¥{priceRange.baseMin}~{priceRange.baseMax}/{unitLabel} × {quantity}{unitLabel} × {difficulty}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
              请输入数量以计算价格
            </div>
          )}
        </>
      )}
    </div>
  );
}
