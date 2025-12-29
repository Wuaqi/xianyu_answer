import { useState, useEffect } from 'react';
import type { ServiceType } from '../types';
import { getServices } from '../services/api';

interface PriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UNIT_LABELS: Record<string, string> = {
  thousand: '千字',
  page: '页',
  minute: '分钟',
  piece: '篇',
};

export function PriceListModal({ isOpen, onClose }: PriceListModalProps) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && services.length === 0) {
      setLoading(true);
      getServices()
        .then(setServices)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, services.length]);

  if (!isOpen) return null;

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: number | null, unit: string) => {
    if (price === null) return '-';
    return `¥${price}/${UNIT_LABELS[unit] || unit}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">服务价目表</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索服务类型..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    服务类型
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    简单
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    复杂
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {service.name}
                      {service.note && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({service.note})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {formatPrice(service.priceSimple, service.unit)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {formatPrice(service.priceComplex, service.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t bg-yellow-50">
          <div className="text-sm text-yellow-700">
            所有类型最低报价：千字20元
          </div>
        </div>
      </div>
    </div>
  );
}
