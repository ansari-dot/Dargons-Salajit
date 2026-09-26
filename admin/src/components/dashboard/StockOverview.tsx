import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/Badge';
import { InventoryItem } from '../../types';

interface StockOverviewProps {
  items: InventoryItem[];
}

export const StockOverview: React.FC<StockOverviewProps> = ({ items }) => {
  return (
    <Card className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Stock Overview</h3>
          <p className="text-[11px] text-slate-400 font-medium">Warehouse inventory & reorder status</p>
        </div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 py-2.5 px-2 border-b border-slate-50">
        <div className="col-span-6">Product</div>
        <div className="col-span-3 text-center">Stock</div>
        <div className="col-span-3 text-right pr-2">Status</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50 flex-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-12 items-center py-2.5 px-2 hover:bg-slate-50/70 rounded-xl transition-colors group cursor-pointer"
          >
            {/* Product with thumbnail */}
            <div className="col-span-6 flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-900/90 border border-slate-200/80 p-0.5 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-md"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {item.name}
              </span>
            </div>

            {/* Units in stock */}
            <div className="col-span-3 text-center text-xs font-bold text-slate-700">
              {item.stock}
            </div>

            {/* Status badge */}
            <div className="col-span-3 flex justify-end">
              <StatusBadge status={item.status} type="stock" size="sm" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
