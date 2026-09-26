import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackagePlus,
  Ticket,
  FileUp,
  ShoppingBag,
  Tag,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import { Card } from '../common/Card';
import { QuickActionItem } from '../../types';

interface QuickActionsProps {
  actions: QuickActionItem[];
}

const iconRegistry: Record<string, React.ElementType> = {
  PackagePlus,
  Ticket,
  FileUp,
  ShoppingBag,
  Tag,
  FileText,
  Users,
  Settings,
};

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const navigate = useNavigate();

  const handleActionClick = (action: QuickActionItem) => {
    if (action.route) {
      navigate(action.route);
    } else {
      alert(`Triggered: ${action.label}`);
    }
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col h-full min-w-0 overflow-hidden">
      <div className="mb-3 shrink-0">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Quick Actions</h3>
        <p className="text-[11px] text-slate-400 font-medium">Common store management shortcuts</p>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
        {actions.map((action) => {
          const Icon = iconRegistry[action.icon] || PackagePlus;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleActionClick(action)}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100/90 bg-slate-50/60 hover:bg-blue-50/70 hover:border-blue-200/80 group transition-all duration-150 cursor-pointer text-center min-w-0 overflow-hidden"
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-xs transition-colors mb-1.5 shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10.5px] font-semibold text-slate-700 group-hover:text-blue-700 leading-tight text-center break-words max-w-full px-0.5">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
