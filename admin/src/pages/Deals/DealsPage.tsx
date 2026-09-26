import React, { useState, useEffect } from 'react';
import { dealsApi, Deal } from '../../services/deals.api';
import { productsApi } from '../../services/products.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { 
  Flame, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Tag, 
  Image as ImageIcon 
} from 'lucide-react';

export const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    product_id: '',
    original_price: '',
    deal_price: '',
    banner_image: '',
    end_time: '',
    is_active: true
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dealsRes, prodsRes] = await Promise.all([
        dealsApi.getDeals(),
        productsApi.getProducts()
      ]);
      setDeals(dealsRes);
      setProducts(prodsRes);
    } catch (err) {
      console.error('Failed to load deals page data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingDeal(null);
    const defaultEndTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setFormData({
      title: '',
      subtitle: '',
      product_id: products.length > 0 ? String(products[0].id) : '',
      original_price: products.length > 0 ? String(products[0].price || 3500) : '3500',
      deal_price: '2500',
      banner_image: '',
      end_time: defaultEndTime,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title || '',
      subtitle: deal.subtitle || '',
      product_id: deal.product_id ? String(deal.product_id) : '',
      original_price: String(deal.original_price || ''),
      deal_price: String(deal.deal_price || ''),
      banner_image: deal.banner_image || '',
      end_time: deal.end_time ? new Date(deal.end_time).toISOString().slice(0, 16) : '',
      is_active: Boolean(deal.is_active)
    });
    setIsModalOpen(true);
  };

  const handleProductSelect = (prodIdStr: string) => {
    const selectedProd = products.find(p => String(p.id) === prodIdStr);
    if (selectedProd) {
      setFormData(prev => ({
        ...prev,
        product_id: prodIdStr,
        title: prev.title || selectedProd.name,
        original_price: String(selectedProd.price || prev.original_price),
        banner_image: prev.banner_image || selectedProd.image || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, product_id: prodIdStr }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        product_id: formData.product_id ? Number(formData.product_id) : null,
        original_price: Number(formData.original_price),
        deal_price: Number(formData.deal_price),
        banner_image: formData.banner_image || null,
        end_time: formData.end_time ? formData.end_time.replace('T', ' ') + ':00' : null,
        is_active: formData.is_active ? 1 : 0
      };

      if (editingDeal) {
        await dealsApi.updateDeal(editingDeal.id, payload);
      } else {
        await dealsApi.createDeal(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save deal');
    }
  };

  const handleToggleActive = async (id: number) => {
    const success = await dealsApi.toggleDealStatus(id);
    if (success) {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, is_active: !d.is_active } : d));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      const success = await dealsApi.deleteDeal(id);
      if (success) {
        setDeals(prev => prev.filter(d => d.id !== id));
      }
    }
  };

  const filteredDeals = deals.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deals & Offers</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage flash sales, promotional deals of the day, and special price drops.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleOpenCreateModal}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Create New Deal
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Tag className="w-4 h-4 text-slate-400" />
            <span>Total Active Deals: <strong>{deals.filter(d => d.is_active).length}</strong></span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>
      </Card>

      {/* Deals Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Deal Title</th>
                <th className="py-3 px-4">Linked Product</th>
                <th className="py-3 px-4 text-right">Original Price</th>
                <th className="py-3 px-4 text-right">Deal Price</th>
                <th className="py-3 px-4 text-center">Discount</th>
                <th className="py-3 px-4 text-center">Expiration / Timer</th>
                <th className="py-3 px-4 text-center">Active Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading promotional deals...
                  </td>
                </tr>
              ) : filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No deals found. Click &quot;Create New Deal&quot; to set up your first offer.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{deal.title}</div>
                      {deal.subtitle && <div className="text-[11px] text-amber-600 font-medium">{deal.subtitle}</div>}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {deal.product_name || 'Generic / Site Banner'}
                    </td>
                    <td className="py-3 px-4 text-right line-through text-slate-400">
                      {formatCurrency(Number(deal.original_price))}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(Number(deal.deal_price))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 text-amber-800">
                        {deal.discount_percentage ? `${deal.discount_percentage}% OFF` : 'PROMO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {deal.end_time ? (
                        <div className="inline-flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{new Date(deal.end_time).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No Limit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(deal.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          deal.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {deal.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(deal)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Deal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Deal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingDeal ? 'Edit Deal of the Day' : 'Create New Deal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link to Product</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Custom Deal (No specific product link)</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} - ({formatCurrency(prod.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Organic Himalayan Shilajit Resin 50g"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Limited Time Flash Offer - Extra 25% Off"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Original Price (₨) *</label>
                  <input
                    type="number"
                    required
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deal Special Price (₨) *</label>
                  <input
                    type="number"
                    required
                    value={formData.deal_price}
                    onChange={(e) => setFormData({ ...formData, deal_price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Countdown Expiration (End Date & Time)</label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Banner Image URL</label>
                <input
                  type="text"
                  placeholder="e.g. /shilajit-surp.png or http://localhost:5000/uploads/..."
                  value={formData.banner_image}
                  onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
                <label htmlFor="is_active_check" className="font-semibold text-slate-700 cursor-pointer">
                  Activate this deal on client homepage immediately
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPage;
