import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/common/Toast';
import { couponsApi, Coupon, CreateCouponPayload } from '../../services/coupons.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { 
  Ticket, 
  Plus, 
  Check, 
  Copy, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  X, 
  Search,
  Tag,
  Clock,
  TrendingUp,
  Percent,
  DollarSign
} from 'lucide-react';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Modal Form state
  const [formData, setFormData] = useState<CreateCouponPayload>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: null,
    usage_limit: null,
    end_date: '',
    is_active: true
  });

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await couponsApi.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (id: string | number, code: string) => {
    try {
      const updated = await couponsApi.toggleStatus(id);
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: updated.is_active } : c));
      toast.success(`Coupon '${code}' status changed to ${updated.is_active ? 'Active' : 'Paused'}.`);
    } catch (error) {
      console.error('Failed to toggle coupon status:', error);
      toast.error('Failed to update coupon status.');
    }
  };

  const handleDeleteCoupon = async (id: string | number, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${code}'?`)) return;

    try {
      await couponsApi.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success(`Coupon '${code}' deleted successfully.`);
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      toast.error('Failed to delete coupon.');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: null,
      usage_limit: null,
      end_date: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    let endDateStr = '';
    if (coupon.end_date) {
      endDateStr = new Date(coupon.end_date).toISOString().slice(0, 10);
    }

    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount_amount: coupon.max_discount_amount,
      usage_limit: coupon.usage_limit,
      end_date: endDateStr,
      is_active: Boolean(coupon.is_active)
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discount_value === undefined) {
      toast.error('Coupon Code and Discount Value are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCouponPayload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_amount: Number(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        end_date: formData.end_date ? `${formData.end_date} 23:59:59` : null,
        is_active: Boolean(formData.is_active)
      };

      if (editingCoupon) {
        const updated = await couponsApi.updateCoupon(editingCoupon.id, payload);
        setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? updated : c));
        toast.success(`Coupon '${updated.code}' updated successfully.`);
      } else {
        const created = await couponsApi.createCoupon(payload);
        setCoupons(prev => [created, ...prev]);
        toast.success(`Coupon '${created.code}' created successfully!`);
      }

      setIsModalOpen(false);
      loadCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Metrics
  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter(c => c.is_active).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
  const percentageCouponsCount = coupons.filter(c => c.discount_type === 'percentage').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupons & Promo Codes</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Live DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create promotional discount codes, manage checkout promo rules, and track customer redemptions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadCoupons}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenCreateModal}
          >
            Create Coupon
          </Button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Coupons</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCouponsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Promo Codes</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeCouponsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Redemptions</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalRedemptions}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Percentage Coupons</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{percentageCouponsCount}</h3>
          </div>
        </Card>
      </div>

      {/* Search Filter Bar */}
      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search promo code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </Card>

      {/* Coupons Grid */}
      {isLoading ? (
        <Card className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading coupons from database...</p>
        </Card>
      ) : filteredCoupons.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-700">No Coupons Available</p>
          <p className="text-xs text-slate-400 mt-1">Create a new promo code to start boosting store conversions.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCoupons.map((coupon) => {
            const formattedValue = coupon.discount_type === 'percentage' 
              ? `${coupon.discount_value}% OFF` 
              : `${formatCurrency(coupon.discount_value)} OFF`;

            return (
              <Card key={coupon.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-slate-900 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(coupon.code)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="Copy promo code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">
                          {formattedValue}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coupon.id, coupon.code)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          coupon.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Paused'}
                      </button>
                    </div>
                  </div>

                  {coupon.description && (
                    <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                      {coupon.description}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400">Min Order: </span>
                      <span className="font-semibold text-slate-700">
                        {coupon.min_order_amount ? formatCurrency(coupon.min_order_amount) : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Max Discount: </span>
                      <span className="font-semibold text-slate-700">
                        {coupon.max_discount_amount ? formatCurrency(coupon.max_discount_amount) : 'Uncapped'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-4 mt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-700">
                      Redeemed: <strong>{coupon.used_count}</strong> {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Expiry'}
                    </span>

                    <button
                      onClick={() => handleOpenEditModal(coupon)}
                      title="Edit Coupon"
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                      title="Delete Coupon"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingCoupon ? `Edit Coupon '${editingCoupon.code}'` : 'Create New Promotional Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Promo Code *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. SAVE20"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Discount Type *</label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₨)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Discount Value * ({formData.discount_type === 'percentage' ? '%' : '₨'})
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    required
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    placeholder="e.g. 15 or 500"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Order Subtotal (₨)</label>
                  <input
                    type="number"
                    name="min_order_amount"
                    min="0"
                    value={formData.min_order_amount || 0}
                    onChange={handleInputChange}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Coupon Description</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Get 20% OFF on all Himalayan Shilajit orders above ₨1,500."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Discount Cap (₨)</label>
                  <input
                    type="number"
                    name="max_discount_amount"
                    min="0"
                    value={formData.max_discount_amount || ''}
                    onChange={handleInputChange}
                    placeholder="Optional (e.g. 1000)"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    name="usage_limit"
                    min="1"
                    value={formData.usage_limit || ''}
                    onChange={handleInputChange}
                    placeholder="Optional (e.g. 200)"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={Boolean(formData.is_active)}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Coupon Is Active</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
