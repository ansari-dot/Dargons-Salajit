import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../common/Card';
import { Dropdown } from '../common/Dropdown';
import { SalesDataPoint } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface SalesChartProps {
  data: SalesDataPoint[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const [range, setRange] = useState('Last 7 days');

  return (
    <Card className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sales Overview</h3>
          <p className="text-[11px] text-slate-400 font-medium">Daily store revenue performance</p>
        </div>
        <Dropdown
          options={['Last 7 days', 'Last 14 days', 'Last 30 days', 'This Month']}
          value={range}
          onChange={setRange}
        />
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => `$${value}`}
              domain={[0, 2500]}
              ticks={[0, 500, 1000, 1500, 2000, 2500]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value as number;
                  return (
                    <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-slate-100 text-xs">
                      <p className="font-semibold text-slate-500 mb-0.5">{label}</p>
                      <p className="font-bold text-blue-600 text-sm">
                        {formatCurrency(val)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563EB"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#salesGradient)"
              dot={{ r: 3.5, fill: '#2563EB', strokeWidth: 1.5, stroke: '#FFFFFF' }}
              activeDot={{ r: 5, fill: '#1D4ED8', strokeWidth: 2, stroke: '#FFFFFF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
