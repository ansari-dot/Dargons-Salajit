import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import {
  calculatorAdminApi,
  AdminProduct,
  AdminPackaging,
  AdminPricingTier,
} from '../../services/calculatorAdmin.api';
import {
  Calculator,
  Package,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const CalculatorManagerPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'packaging' | 'tiers'>('products');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [packaging, setPackaging] = useState<AdminPackaging[]>([]);
  const [tiers, setTiers] = useState<AdminPricingTier[]>([]);

  // Editing states
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editingPackaging, setEditingPackaging] = useState<AdminPackaging | null>(null);
  const [editingTier, setEditingTier] = useState<AdminPricingTier | null>(null);
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [newTier, setNewTier] = useState<Omit<AdminPricingTier, 'id'>>({
    entity_type: 'product',
    entity_id: 1,
    min_quantity: 0,
    max_quantity: 1000,
    rate: 50,
    is_open_ended: false,
    is_active: true,
    effective_from: null,
    effective_until: null,
    pricing_version: 1,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, pkgs, tierList] = await Promise.all([
        calculatorAdminApi.getProducts(),
        calculatorAdminApi.getPackaging(),
        calculatorAdminApi.getPricingTiers(),
      ]);
      setProducts(prods);
      setPackaging(pkgs);
      setTiers(tierList);
    } catch (err: any) {
      toast.error('Failed to load calculator settings: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save product edit
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      await calculatorAdminApi.updateProduct(editingProduct.id, editingProduct);
      toast.success('Product updated successfully.');
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update product: ' + err.message);
    }
  };

  // Save packaging edit
  const handleSavePackaging = async () => {
    if (!editingPackaging) return;
    try {
      await calculatorAdminApi.updatePackaging(editingPackaging.id, editingPackaging);
      toast.success('Packaging item updated successfully.');
      setEditingPackaging(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update packaging: ' + err.message);
    }
  };

  // Save tier edit
  const handleSaveTier = async () => {
    if (!editingTier) return;
    try {
      await calculatorAdminApi.updatePricingTier(editingTier.id, editingTier);
      toast.success('Pricing tier updated successfully.');
      setEditingTier(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update pricing tier: ' + err.message);
    }
  };

  // Create new tier
  const handleCreateTier = async () => {
    try {
      await calculatorAdminApi.createPricingTier(newTier);
      toast.success('Pricing tier created.');
      setIsAddingTier(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to create tier: ' + err.message);
    }
  };

  // Delete tier
  const handleDeleteTier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing tier?')) return;
    try {
      await calculatorAdminApi.deletePricingTier(id);
      toast.success('Pricing tier removed.');
      loadData();
    } catch (err: any) {
      toast.error('Failed to delete tier: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Calculator Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure Private Label Shilajit products, packaging items, dielines, and centralized pricing tiers without code changes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Products ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packaging')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'packaging'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Packaging Items ({packaging.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tiers')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'tiers'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Pricing Engine Tiers ({tiers.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Unit Type</th>
                  <th className="py-3 px-4">MOQ</th>
                  <th className="py-3 px-4">Min Product Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold">#{p.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 uppercase">{p.unit_type}</td>
                    <td className="py-3 px-4">{Number(p.moq).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      {p.min_product_cost > 0 ? `Rs. ${Number(p.min_product_cost).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProduct(p)}
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: PACKAGING */}
      {activeTab === 'packaging' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name / Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">MOQ</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Dieline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {packaging.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold">#{pkg.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{pkg.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{pkg.code}</div>
                    </td>
                    <td className="py-3 px-4 font-medium uppercase text-slate-600">{pkg.type}</td>
                    <td className="py-3 px-4">{pkg.moq} pcs</td>
                    <td className="py-3 px-4 font-semibold">
                      {pkg.unit_price !== null ? `Rs. ${Number(pkg.unit_price).toFixed(2)}` : 'Tiered Pricing'}
                    </td>
                    <td className="py-3 px-4">
                      {pkg.dieline_url ? (
                        <a
                          href={pkg.dieline_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 flex items-center gap-1 hover:underline font-medium"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        pkg.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPackaging(pkg)}
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: PRICING ENGINE TIERS */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Pricing engine uses exact tier matching. Tiers can be capped or marked open-ended.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingTier(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Pricing Tier
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Min Qty</th>
                    <th className="py-3 px-4">Max Qty</th>
                    <th className="py-3 px-4">Rate (Rs.)</th>
                    <th className="py-3 px-4">Open-Ended</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tiers.map((t) => {
                    const entityName =
                      t.entity_type === 'product'
                        ? products.find((p) => p.id === t.entity_id)?.name || `Product #${t.entity_id}`
                        : packaging.find((pkg) => pkg.id === t.entity_id)?.name || `Packaging #${t.entity_id}`;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold">#{t.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1.5">
                            [{t.entity_type}]
                          </span>
                          {entityName}
                        </td>
                        <td className="py-3 px-4 font-mono">{Number(t.min_quantity).toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">
                          {t.is_open_ended ? (
                            <span className="text-emerald-700 font-semibold">∞ (Open-Ended)</span>
                          ) : (
                            Number(t.max_quantity).toLocaleString()
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">Rs. {Number(t.rate).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          {t.is_open_ended ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              Open-Ended
                            </span>
                          ) : (
                            <span className="text-slate-400">Capped</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTier(t)}
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDeleteTier(t.id)}
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Product #{editingProduct.id}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Product Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Unit Type (Packing)</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingProduct.unit_type}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit_type: e.target.value })}
                >
                  <option value="grams">Grams (g)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="capsules">Capsules</option>
                  <option value="blisters">Blisters</option>
                  <option value="units">Units</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">MOQ</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editingProduct.moq}
                  onChange={(e) => setEditingProduct({ ...editingProduct, moq: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Minimum Product Cost (Rs.)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editingProduct.min_product_cost}
                  onChange={(e) => setEditingProduct({ ...editingProduct, min_product_cost: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full p-2 border rounded"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveProduct}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT PACKAGING MODAL */}
      {editingPackaging && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Packaging #{editingPackaging.id}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Packaging Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editingPackaging.name}
                  onChange={(e) => setEditingPackaging({ ...editingPackaging, name: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Type (Configure)</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingPackaging.type}
                  onChange={(e) => setEditingPackaging({ ...editingPackaging, type: e.target.value })}
                >
                  <option value="container">Container</option>
                  <option value="label">Label</option>
                  <option value="brochure">Brochure</option>
                  <option value="outer_box">Outer Box</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">MOQ</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={editingPackaging.moq}
                    onChange={(e) => setEditingPackaging({ ...editingPackaging, moq: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Fixed Unit Price (Rs. or blank)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={editingPackaging.unit_price ?? ''}
                    placeholder="Leave empty for tiered"
                    onChange={(e) => setEditingPackaging({ ...editingPackaging, unit_price: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Dieline URL</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editingPackaging.dieline_url || ''}
                  placeholder="/dielines/item.pdf"
                  onChange={(e) => setEditingPackaging({ ...editingPackaging, dieline_url: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Technical Specifications</label>
                <textarea
                  rows={2}
                  className="w-full p-2 border rounded"
                  value={editingPackaging.technical_specs || ''}
                  onChange={(e) => setEditingPackaging({ ...editingPackaging, technical_specs: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingPackaging(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSavePackaging}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT TIER MODAL */}
      {editingTier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Pricing Tier #{editingTier.id}</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Min Quantity</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={editingTier.min_quantity}
                    onChange={(e) => setEditingTier({ ...editingTier, min_quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Max Quantity (empty if open-ended)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    disabled={Boolean(editingTier.is_open_ended)}
                    value={editingTier.max_quantity ?? ''}
                    onChange={(e) => setEditingTier({ ...editingTier, max_quantity: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Rate / Unit Price (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  value={editingTier.rate}
                  onChange={(e) => setEditingTier({ ...editingTier, rate: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openEndedEdit"
                  checked={Boolean(editingTier.is_open_ended)}
                  onChange={(e) => setEditingTier({ ...editingTier, is_open_ended: e.target.checked, max_quantity: e.target.checked ? null : editingTier.max_quantity })}
                />
                <label htmlFor="openEndedEdit" className="font-semibold">
                  Open-Ended Tier (Applies to all quantities above Min)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingTier(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveTier}>
                Save Tier
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ADD TIER MODAL */}
      {isAddingTier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Pricing Tier</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Entity Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newTier.entity_type}
                    onChange={(e) => setNewTier({ ...newTier, entity_type: e.target.value as any })}
                  >
                    <option value="product">Product</option>
                    <option value="packaging">Packaging Item</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Target Item</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newTier.entity_id}
                    onChange={(e) => setNewTier({ ...newTier, entity_id: Number(e.target.value) })}
                  >
                    {newTier.entity_type === 'product'
                      ? products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))
                      : packaging.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Min Quantity</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newTier.min_quantity}
                    onChange={(e) => setNewTier({ ...newTier, min_quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Max Quantity</label>
                  <input
                    type="number"
                    disabled={Boolean(newTier.is_open_ended)}
                    className="w-full p-2 border rounded"
                    value={newTier.max_quantity ?? ''}
                    onChange={(e) => setNewTier({ ...newTier, max_quantity: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Rate / Unit Price (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  value={newTier.rate}
                  onChange={(e) => setNewTier({ ...newTier, rate: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openEndedNew"
                  checked={Boolean(newTier.is_open_ended)}
                  onChange={(e) => setNewTier({ ...newTier, is_open_ended: e.target.checked, max_quantity: e.target.checked ? null : newTier.max_quantity })}
                />
                <label htmlFor="openEndedNew" className="font-semibold">
                  Open-Ended Tier (Applies to all quantities above Min)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddingTier(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateTier}>
                Create Tier
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

