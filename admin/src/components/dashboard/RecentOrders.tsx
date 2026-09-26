import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/Badge';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface RecentOrdersProps {
  orders: Order[];
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  return (
    <Card className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Orders</h3>
          <p className="text-[11px] text-slate-400 font-medium">Latest incoming customer checkouts</p>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 py-2.5 px-2 border-b border-slate-50">
        <div className="col-span-3">Order</div>
        <div className="col-span-3">Customer</div>
        <div className="col-span-3 text-right">Amount</div>
        <div className="col-span-3 text-right pr-4">Status</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50 flex-1">
        {orders.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-12 items-center py-2.5 px-2 hover:bg-slate-50/70 rounded-xl transition-colors group cursor-pointer"
          >
            {/* Order Number */}
            <div className="col-span-3 text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {order.orderNumber}
            </div>

            {/* Customer */}
            <div className="col-span-3 text-xs font-medium text-slate-600 truncate">
              {order.customerName}
            </div>

            {/* Amount */}
            <div className="col-span-3 text-right text-xs font-bold text-slate-900">
              {formatCurrency(order.amount)}
            </div>

            {/* Status & Chevron */}
            <div className="col-span-3 flex items-center justify-end gap-2">
              <StatusBadge status={order.status} type="order" size="sm" />
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
