import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'info';

interface AlertProps {
  type?: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

const ALERT_STYLES: Record<AlertType, { wrapper: string; icon: string; Icon: React.ElementType }> = {
  success: {
    wrapper: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'text-emerald-500',
    Icon: CheckCircle2,
  },
  error: {
    wrapper: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'text-rose-500',
    Icon: AlertCircle,
  },
  info: {
    wrapper: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'text-blue-500',
    Icon: Info,
  },
};

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose, className = '' }) => {
  const { wrapper, icon, Icon } = ALERT_STYLES[type];

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-xs font-medium ${wrapper} ${className}`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 shrink-0 mt-px ${icon}`} />
        <span>{message}</span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-0.5 transition-colors hover:bg-black/5"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
