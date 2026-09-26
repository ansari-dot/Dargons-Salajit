import React from 'react';
import {
  ShoppingBag,
  CheckCircle,
  UserPlus,
  AlertTriangle,
  Ticket,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { RecentActivityItem } from '../../types';

interface RecentActivityProps {
  activities: RecentActivityItem[];
}

const activityConfig = {
  order: {
    icon: ShoppingBag,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  delivery: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  customer: {
    icon: UserPlus,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
  stock: {
    icon: AlertTriangle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
  coupon: {
    icon: Ticket,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <Card className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h3>
          <p className="text-[11px] text-slate-400 font-medium">Real-time store event audit log</p>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-slate-50 flex-1 space-y-1 pt-1">
        {activities.map((act) => {
          const cfg = activityConfig[act.type] || activityConfig.order;
          const Icon = cfg.icon;

          return (
            <div
              key={act.id}
              className="flex items-start gap-3 py-2.5 px-1 hover:bg-slate-50/70 rounded-xl transition-colors group cursor-pointer"
            >
              {/* Icon Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} ${cfg.color} border ${cfg.border}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Title & subtitle */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                  {act.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {act.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
