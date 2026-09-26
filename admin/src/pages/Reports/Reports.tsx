import React from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, DollarSign, Users, PackageCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const monthlyData = [
  { month: 'Apr', revenue: 8400, orders: 160 },
  { month: 'May', revenue: 9200, orders: 185 },
  { month: 'Jun', revenue: 10500, orders: 210 },
  { month: 'Jul', revenue: 11200, orders: 225 },
  { month: 'Aug', revenue: 11900, orders: 235 },
  { month: 'Sep', revenue: 12845, orders: 248 },
];

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Financial auditing, store conversion rate, and customer cohort insights.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
          Export PDF Report
        </Button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400">Average Order Value (AOV)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">$51.79</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            ↑ 4.2% from last month
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400">Store Conversion Rate</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">3.48%</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            ↑ 0.6% vs e-commerce benchmark
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400">Repeat Customer Rate</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">42.8%</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
            High natural product loyalty
          </span>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Monthly Gross Revenue Trend</h3>
        <p className="text-xs text-slate-400 mb-6">Continuous 6-month growth trajectory</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-100 text-xs">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                        <p className="text-slate-400">Gross Sales</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
export default ReportsPage;
