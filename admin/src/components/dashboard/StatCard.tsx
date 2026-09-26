import React from 'react';
import { ShoppingCart, DollarSign, Users, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../common/Card';
import { StatItem } from '../../types';

interface StatCardProps {
  stat: StatItem;
}

const iconMap = {
  orders: ShoppingCart,
  revenue: DollarSign,
  customers: Users,
  products: Package,
};

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const Icon = iconMap[stat.iconName] || ShoppingCart;

  return (
    <Card className="p-4 flex flex-col justify-between h-full hover:border-slate-200 transition-all min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Subtle colored circle background */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stat.bgLight} ${stat.accentColor}`}
        >
          <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-[11.5px] font-semibold text-slate-500 whitespace-nowrap leading-tight">
            {stat.title}
          </p>
          <p className="text-lg xl:text-xl font-black text-slate-900 tracking-tight mt-0.5 whitespace-nowrap">
            {stat.value}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 pt-2 text-[11px] border-t border-slate-50/80">
        <span
          className={`inline-flex items-center font-bold shrink-0 ${
            stat.isPositive ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {stat.isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" strokeWidth={2.5} />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" strokeWidth={2.5} />
          )}
          {stat.change}
        </span>
        <span className="text-slate-400 font-medium truncate">{stat.comparisonText}</span>
      </div>
    </Card>
  );
};
