import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Customer } from '../../types';

interface RecentCustomersProps {
  customers: Customer[];
}

export const RecentCustomers: React.FC<RecentCustomersProps> = ({ customers }) => {
  return (
    <Card className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Customers</h3>
          <p className="text-[11px] text-slate-400 font-medium">New shopper registrations and profiles</p>
        </div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 py-2.5 px-2 border-b border-slate-50">
        <div className="col-span-4">Name</div>
        <div className="col-span-4">Email</div>
        <div className="col-span-2 text-center">Orders</div>
        <div className="col-span-2 text-right">Joined</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50 flex-1">
        {customers.map((cust) => (
          <div
            key={cust.id}
            className="grid grid-cols-12 items-center py-2.5 px-2 hover:bg-slate-50/70 rounded-xl transition-colors group cursor-pointer"
          >
            {/* Name + Avatar */}
            <div className="col-span-4 flex items-center gap-2 min-w-0">
              <Avatar name={cust.name} src={cust.avatar} size="xs" />
              <span className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {cust.name}
              </span>
            </div>

            {/* Email */}
            <div className="col-span-4 text-xs text-slate-500 truncate">
              {cust.email}
            </div>

            {/* Orders */}
            <div className="col-span-2 text-center text-xs font-semibold text-slate-700">
              {cust.ordersCount}
            </div>

            {/* Joined */}
            <div className="col-span-2 text-right text-xs text-slate-400 font-medium whitespace-nowrap">
              {cust.joinedDate}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
