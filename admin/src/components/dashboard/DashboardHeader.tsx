import React from 'react';
import { Calendar } from 'lucide-react';
import { formatDashboardDate } from '../../utils/formatDate';

interface DashboardHeaderProps {
  userName?: string;
  date?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName = 'Arsalan',
  date,
}) => {
  const currentDateStr = date || formatDashboardDate(new Date(2025, 8, 20)); // Sat, 20 Sep 2025

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Welcome back, {userName}</span>
          <span className="inline-block animate-wave text-xl sm:text-2xl">👋</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-medium">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Date badge on the right */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xs self-start sm:self-auto">
        <span className="text-xs font-semibold text-slate-700">{currentDateStr}</span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
    </div>
  );
};
