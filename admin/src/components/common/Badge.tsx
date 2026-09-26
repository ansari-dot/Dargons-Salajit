import React from 'react';
import { ORDER_STATUS_COLORS, STOCK_STATUS_COLORS } from '../../utils/constants';

interface BadgeProps {
  status: string;
  type?: 'order' | 'stock' | 'default';
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({
  status,
  type = 'order',
  showDot = true,
  className = '',
  size = 'md',
}) => {
  let style = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  };

  if (type === 'order' && ORDER_STATUS_COLORS[status]) {
    style = ORDER_STATUS_COLORS[status];
  } else if (type === 'stock' && STOCK_STATUS_COLORS[status]) {
    style = STOCK_STATUS_COLORS[status];
  } else {
    // Check both
    if (ORDER_STATUS_COLORS[status]) style = ORDER_STATUS_COLORS[status];
    else if (STOCK_STATUS_COLORS[status]) style = STOCK_STATUS_COLORS[status];
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses} whitespace-nowrap ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      )}
      <span>{status}</span>
    </span>
  );
};
