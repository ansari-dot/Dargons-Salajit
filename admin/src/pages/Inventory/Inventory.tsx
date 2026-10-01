import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProducts, updateProduct, clearError } from '../../store/slices/productSlice';
import { ProductItem } from '../../services/productApiService';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StockStatus } from '../../types';
import {
  Boxes,
  AlertTriangle,
  RefreshCw,
  Plus,
  Loader2,
  Search,
  CheckCircle2,
  X,
  PackageCheck,
  Edit3,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, actionLoading, error } = useAppSelector((state) => state.products);

  const [searchQuery, setSearchQuery] = useState('');
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [receivedQty, setReceivedQty] = useState<string>('50');

  // Fetch live products & inventory on mount
  useEffect(() => {
    dispatch(fetchProducts(undefined));
  }, [dispatch]);

  const handleSyncInventory = () => {
    dispatch(fetchProducts(undefined));
  };

  // Adjust stock for single item
  const handleStockAdjust = (product: ProductItem, delta: number) => {
    const currentStock = product.stock_quantity ?? 0;
    const newStock = Math.max(0, currentStock + delta);

    dispatch(
      updateProduct({
        id: product.id,
        payload: {
          stock_quantity: newStock,
        },
      })
    );
  };

  // Submit Receive Stock Batch Modal
  const handleReceiveStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const targetProduct = items.find((p) => p.id === selectedProductId);
    if (!targetProduct) return;

    const currentQty = targetProduct.stock_quantity ?? 0;
    const addQty = parseInt(receivedQty, 10) || 0;
    const newTotal = currentQty + addQty;

    const result = await dispatch(
      updateProduct({
        id: selectedProductId,
        payload: {
          stock_quantity: newTotal,
        },
      })
    );

    if (updateProduct.fulfilled.match(result)) {
      setIsReceiveModalOpen(false);
      setSelectedProductId(null);
      setReceivedQty('50');
    }
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const skuMatch = item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const vendorMatch = (item.vendor || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || skuMatch || vendorMatch;
  });

  // Calculate Summary Metrics
  const totalStockUnits = items.reduce((sum, item) => sum + (item.stock_quantity ?? 0), 0);
  const lowStockCount = items.filter((item) => {
    const stock = item.stock_quantity ?? 0;
    return stock > 0 && stock < 10;
  }).length;
  const outOfStockCount = items.filter((item) => (item.stock_quantity ?? 0) === 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Stock Control</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time MySQL warehouse fulfillment, stock depletion alerts, and batch restocking.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncInventory}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            {loading ? 'Syncing...' : 'Sync Inventory'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (items.length > 0) {
                setSelectedProductId(items[0].id);
              }
              setIsReceiveModalOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Receive Stock
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearError())}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Real-time Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border-l-4 border-l-emerald-500">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Warehouse Stock</p>
            <p className="text-xl font-extrabold text-slate-900">{totalStockUnits.toLocaleString()} units</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Across {items.length} Product SKUs</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-l-4 border-l-amber-500">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Low Stock SKUs (&lt; 10 units)</p>
            <p className="text-xl font-extrabold text-slate-900">{lowStockCount} items</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Needs reorder attention</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-l-4 border-l-rose-500">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Out of Stock</p>
            <p className="text-xl font-extrabold text-slate-900">{outOfStockCount} items</p>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Depleted from store</p>
          </div>
        </Card>
      </div>

      {/* 3. Search Bar */}
      <Card className="p-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search inventory by title, SKU, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </Card>

      {/* 4. Live Inventory Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading real-time stock levels from database...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No inventory items found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? `No items matched "${searchQuery}".` : 'No products available in database.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Item & SKU</th>
                  <th className="py-3.5 px-4">Category / Brand</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Real-Time Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => {
                  const stock = item.stock_quantity ?? 0;
                  let statusText: StockStatus = 'In Stock';
                  if (stock === 0) statusText = 'Out of Stock';
                  else if (stock < 10) statusText = 'Low Stock';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 p-0.5">
                            <img
                              src={
                                item.main_image ||
                                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80'
                              }
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80';
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-400">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{item.category_name || 'Shilajit'}</span>
                        <p className="text-[10px] text-slate-400">{item.vendor || 'Himalayan Surp'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-slate-900 text-sm">{stock}</span>
                        <span className="text-[10px] text-slate-400 block">units</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={statusText} type="stock" size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            disabled={actionLoading || stock <= 0}
                            onClick={() => handleStockAdjust(item, -1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
                            title="Reduce stock by 1"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleStockAdjust(item, 5)}
                            className="px-2 h-7 rounded-lg border border-slate-200 text-blue-700 font-bold text-[11px] bg-blue-50/50 hover:bg-blue-100 disabled:opacity-40 transition-colors"
                            title="Add 5 units"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleStockAdjust(item, 10)}
                            className="px-2 h-7 rounded-lg border border-slate-200 text-emerald-700 font-bold text-[11px] bg-emerald-50/50 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductId(item.id);
                              setIsReceiveModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors ml-1"
                            title="Set exact stock quantity"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 5. Receive Stock Batch Restock Modal */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Receive Stock Batch</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReceiveModalOpen(false);
                  setSelectedProductId(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Product SKU</label>
                <select
                  value={selectedProductId || ''}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current: {p.stock_quantity ?? 0} units
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Received Stock Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold"
                />
              </div>

              {selectedProductId && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Stock Calculation Preview:
                  </p>
                  <p>
                    Current Stock:{' '}
                    <strong>{items.find((p) => p.id === selectedProductId)?.stock_quantity ?? 0}</strong> + Add:{' '}
                    <strong>{parseInt(receivedQty, 10) || 0}</strong> = New Total:{' '}
                    <strong>
                      {(items.find((p) => p.id === selectedProductId)?.stock_quantity ?? 0) +
                        (parseInt(receivedQty, 10) || 0)}
                    </strong>{' '}
                    units.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReceiveModalOpen(false);
                    setSelectedProductId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  icon={actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                >
                  {actionLoading ? 'Updating Database...' : 'Save Stock Batch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
