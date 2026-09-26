import React from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Truck, Package, CheckCircle2, Clock, Globe, ArrowUpRight } from 'lucide-react';

export const ShippingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shipping & Logistics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Carrier integrations (DHL Express, FedEx, Pakistan Post, Aramex), dispatch tracking, and shipping rates.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Package className="w-3.5 h-3.5" />}>
          Print Batch Labels
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">In Transit</p>
            <p className="text-xl font-bold text-slate-900">32 shipments</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Pending Dispatch</p>
            <p className="text-xl font-bold text-slate-900">14 orders</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Delivered This Week</p>
            <p className="text-xl font-bold text-slate-900">142 orders</p>
          </div>
        </Card>
      </div>

      {/* Carriers & Fulfillment Zones */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Configured Shipping Zones</h3>
        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Domestic Delivery (Pakistan)</p>
                <p className="text-[11px] text-slate-400">TCS Courier & Leopard Express · 2-3 Business Days</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">Free over $50</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Middle East (Saudi Arabia & UAE)</p>
                <p className="text-[11px] text-slate-400">Aramex Priority Air Cargo · 3-5 Business Days</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700">$14.99 Standard</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">International (USA, UK, EU)</p>
                <p className="text-[11px] text-slate-400">DHL Express International Tracked · 4-7 Days</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700">$24.00 Standard</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default ShippingPage;
