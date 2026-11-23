import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { Store, Bell, Shield, CreditCard, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [storeName, setStoreName] = useState('SALAJIT');
  const [tagline, setTagline] = useState('Pure Himalayan Power');
  const [currency, setCurrency] = useState('USD ($)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    toast.success('Your settings have been saved.', 'Settings saved');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            General preferences, payment gateways, tax calculation, and admin permissions.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Save className="w-3.5 h-3.5" />}
          onClick={handleSave}
        >
          {saved ? 'Changes Saved!' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Brand Identity & Details</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="PKR (₨)">PKR (₨)</option>
                    <option value="AED (د.إ)">AED (د.إ)</option>
                    <option value="SAR (﷼)">SAR (﷼)</option>
                    <option value="EUR (€)">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    defaultValue="0349ansari@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Payment Gateways</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Stripe & Global Credit Cards</p>
                  <p className="text-slate-400">Visa, Mastercard, Apple Pay, Google Pay</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Cash On Delivery (COD)</p>
                  <p className="text-slate-400">Pakistan domestic deliveries via TCS</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Administrator Role</h3>
            </div>
            <div className="py-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Super Admin:</span>
                <span className="font-bold text-slate-900">Arsalan Ansari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security:</span>
                <span className="font-semibold text-emerald-600">2FA Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Timeout:</span>
                <span className="text-slate-700">24 Hours</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Order Alerts</h3>
            </div>
            <div className="py-3 text-xs space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span className="text-slate-700">Instant email on high-value orders (&gt;$200)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span className="text-slate-700">Low inventory notification (&lt;10 units)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span className="text-slate-700">Daily midnight summary digest</span>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
