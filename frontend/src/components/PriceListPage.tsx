/**
 * 文章报价页面
 * 展示所有服务类型的价格表
 */

import { useState, useEffect, useMemo } from 'react';
import type { ServiceType } from '../types';
import { getServices } from '../services/api';

// 单位显示映射
const UNIT_LABELS: Record<string, string> = {
  thousand: '千字',
  page: '页',
  minute: '分钟',
  piece: '篇',
};

// 按单位分组服务
function groupByUnit(services: ServiceType[]): Record<string, ServiceType[]> {
  const groups: Record<string, ServiceType[]> = {};
  services.forEach(service => {
    const unit = service.unit || 'thousand';
    if (!groups[unit]) {
      groups[unit] = [];
    }
    groups[unit].push(service);
  });
  return groups;
}

export function PriceListPage() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError('加载报价表失败');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤和分组
  const filteredGroups = useMemo(() => {
    let filtered = services;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = services.filter(s => s.name.toLowerCase().includes(term));
    }
    return groupByUnit(filtered);
  }, [services, searchTerm]);

  // 单位顺序
  const unitOrder = ['thousand', 'page', 'minute', 'piece'];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadServices}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* 标题和搜索 */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">文章报价表</h1>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索文章类型..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 价格表 */}
        <div className="space-y-6">
          {unitOrder.map(unit => {
            const group = filteredGroups[unit];
            if (!group || group.length === 0) return null;

            return (
              <div key={unit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* 分组标题 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 md:px-6 py-3 border-b border-gray-200">
                  <h2 className="text-base md:text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    按{UNIT_LABELS[unit]}计价
                    <span className="text-sm font-normal text-blue-600">({group.length}项)</span>
                  </h2>
                </div>

                {/* 服务列表 */}
                <div className="divide-y divide-gray-100">
                  {group.map(service => (
                    <div
                      key={service.id}
                      className="px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        {/* 服务名称 */}
                        <div className="flex-1">
                          <h3 className="text-sm md:text-base font-medium text-gray-800">
                            {service.name}
                          </h3>
                          {service.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{service.note}</p>
                          )}
                          {service.requiresMaterial && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                              需看材料
                            </span>
                          )}
                        </div>

                        {/* 价格 */}
                        <div className="flex items-center gap-4">
                          {service.priceSimple !== null && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">简单</div>
                              <div className="text-lg md:text-xl font-bold text-green-600">
                                ¥{service.priceSimple}
                                <span className="text-xs font-normal text-gray-500">/{UNIT_LABELS[unit]}</span>
                              </div>
                            </div>
                          )}
                          {service.priceComplex !== null && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">复杂</div>
                              <div className="text-lg md:text-xl font-bold text-orange-600">
                                ¥{service.priceComplex}
                                <span className="text-xs font-normal text-gray-500">/{UNIT_LABELS[unit]}</span>
                              </div>
                            </div>
                          )}
                          {service.priceSimple === null && service.priceComplex === null && (
                            <div className="text-gray-400">面议</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 无结果 */}
          {Object.keys(filteredGroups).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>没有找到匹配的服务类型</p>
            </div>
          )}
        </div>

        {/* 说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            价格说明
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 简单：常规要求，无特殊复杂度</li>
            <li>• 复杂：要求较高，需要专业处理</li>
            <li>• 最终报价 = 单价 × 数量 × 难度系数</li>
            <li>• 具体价格以实际需求为准</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
