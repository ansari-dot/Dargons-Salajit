import React from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Megaphone, Mail, Share2, TrendingUp, Plus } from 'lucide-react';

export const MarketingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing & Channels</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Email newsletters, multi-channel syndication, and brand campaigns.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Wellness Newsletter</h3>
              <p className="text-xs text-slate-400">4,280 active Himalayan subscriber list</p>
            </div>
          </div>
          <div className="flex justify-between text-xs py-2 border-t border-slate-100 mt-2">
            <span className="text-slate-500">Open Rate:</span>
            <span className="font-bold text-emerald-600">38.4%</span>
          </div>
          <div className="flex justify-between text-xs py-2 border-t border-slate-100">
            <span className="text-slate-500">Click Rate:</span>
            <span className="font-bold text-blue-600">9.2%</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Affiliate Referral Program</h3>
              <p className="text-xs text-slate-400">Fitness, yoga & herbalists affiliate network</p>
            </div>
          </div>
          <div className="flex justify-between text-xs py-2 border-t border-slate-100 mt-2">
            <span className="text-slate-500">Active Affiliates:</span>
            <span className="font-bold text-slate-800">48 Creators</span>
          </div>
          <div className="flex justify-between text-xs py-2 border-t border-slate-100">
            <span className="text-slate-500">Attributed Revenue:</span>
            <span className="font-bold text-emerald-600">$3,420 (26%)</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default MarketingPage;
