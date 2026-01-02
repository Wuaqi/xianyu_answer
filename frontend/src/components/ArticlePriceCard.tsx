/**
 * 文章类型单价卡片
 * 根据 AI 识别的文章类型显示对应的报价表单价
 */

import { useState, useEffect, useMemo } from 'react';
import type { ServiceType, ExtractedInfoV3 } from '../types';
import { getServices } from '../services/api';

interface ArticlePriceCardProps {
  extractedInfo?: ExtractedInfoV3 | null;
}

// 单位显示映射
const UNIT_LABELS: Record<string, string> = {
  thousand: '千字',
  page: '页',
  minute: '分钟',
  piece: '篇',
};

export function ArticlePriceCard({ extractedInfo }: ArticlePriceCardProps) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // 匹配服务类型
  const matchedService = useMemo(() => {
    if (!extractedInfo?.articleType || services.length === 0) return null;

    const articleType = extractedInfo.articleType.toLowerCase();

    // 尝试匹配
    let matched = services.find(s => {
      const serviceName = s.name.toLowerCase();
      return serviceName.includes(articleType) || articleType.includes(serviceName.replace(/[（(].+[)）]/g, '').trim());
    });

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
      } else if (articleType.includes('文案') || articleType.includes('广告')) {
        matched = services.find(s => s.name.includes('公众号') || s.name.includes('文案'));
      }
    }

    return matched;
  }, [extractedInfo?.articleType, services]);

  if (isLoading) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-green-200 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-green-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!extractedInfo?.articleType) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm">
        <p>等待识别文章类型</p>
      </div>
    );
  }

  if (!matchedService) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-amber-800 mb-1">报价参考</h4>
        <p className="text-sm text-amber-600">
          "{extractedInfo.articleType}" 暂无匹配的报价表项
        </p>
      </div>
    );
  }

  const unitLabel = UNIT_LABELS[matchedService.unit] || '千字';
  const hasSimple = matchedService.priceSimple != null;
  const hasComplex = matchedService.priceComplex != null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-green-800">报价参考</h4>
      </div>

      {/* 价格显示 */}
      <div className="text-2xl font-bold text-green-700 mb-2">
        {hasSimple && hasComplex ? (
          <>¥{matchedService.priceSimple} - ¥{matchedService.priceComplex}</>
        ) : hasSimple ? (
          <>¥{matchedService.priceSimple}</>
        ) : hasComplex ? (
          <>¥{matchedService.priceComplex}</>
        ) : (
          <>面议</>
        )}
        <span className="text-sm font-normal text-green-600">/{unitLabel}</span>
      </div>

      {/* 匹配信息 */}
      <div className="text-xs text-green-600 space-y-1">
        <p>
          <span className="text-green-500">识别类型：</span>
          {extractedInfo.articleType}
        </p>
        <p>
          <span className="text-green-500">匹配报价表：</span>
          {matchedService.name}
        </p>
        {hasSimple && hasComplex && (
          <p className="text-green-500">
            简单 ¥{matchedService.priceSimple}/{unitLabel}，复杂 ¥{matchedService.priceComplex}/{unitLabel}
          </p>
        )}
      </div>
    </div>
  );
}
