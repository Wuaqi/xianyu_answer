import type { DealStatus } from '../types';

interface DealStatusBadgeProps {
  status: DealStatus;
  onChange?: (status: DealStatus) => void;
}

const STATUS_CONFIG: Record<DealStatus, { label: string; className: string }> = {
  pending: {
    label: '待定',
    className: 'bg-gray-100 text-gray-600',
  },
  closed: {
    label: '已成交',
    className: 'bg-green-100 text-green-700',
  },
  failed: {
    label: '未成交',
    className: 'bg-red-100 text-red-700',
  },
};

export function DealStatusBadge({ status, onChange }: DealStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (onChange) {
    return (
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as DealStatus)}
        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer border-0 ${config.className}`}
      >
        <option value="pending">待定</option>
        <option value="closed">已成交</option>
        <option value="failed">未成交</option>
      </select>
    );
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
