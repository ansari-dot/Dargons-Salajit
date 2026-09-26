import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../common/Card';
import { OrderStatusItem } from '../../types';

interface OrderStatusChartProps {
  data: OrderStatusItem[];
  totalOrders?: number;
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
  data,
  totalOrders = 248,
}) => {
  return (
    <Card className="p-4 sm:p-5 flex flex-col h-full min-w-0 overflow-hidden">
      <div className="mb-2 shrink-0">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Order Status</h3>
        <p className="text-[11px] text-slate-400 font-medium">Breakdown of fulfillment pipeline</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between gap-3 min-w-0 w-full">
        {/* Donut Chart with Center Text */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center my-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as OrderStatusItem;
                    return (
                      <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-md border border-slate-100 text-xs z-50">
                        <span className="font-semibold text-slate-800">{item.status}: </span>
                        <span className="font-bold text-slate-900">{item.count}</span>
                        <span className="text-slate-400 ml-1">({item.percentage}%)</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={60}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-lg font-black text-slate-900 tracking-tight leading-none">
              {totalOrders}
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
              Total Orders
            </span>
          </div>
        </div>

        {/* Legend List - Stacked neatly inside container */}
        <div className="w-full space-y-1 py-1 px-1 bg-slate-50/50 rounded-xl border border-slate-100/60">
          {data.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between text-[11px] hover:bg-white px-2 py-1 rounded-md transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700 font-medium truncate">{item.status}</span>
              </div>
              <div className="flex items-center gap-1 text-right shrink-0">
                <span className="font-bold text-slate-800">{item.count}</span>
                <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
