import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../services/orders.api';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { Order, OrderStatus } from '../../types';
import { Search, Download, Eye, RefreshCw } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  const statuses = ['All', 'Delivered', 'Processing', 'Shipped', 'Cancelled', 'Refunded'];

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = selectedStatus === 'All' || ord.status === selectedStatus;
    const matchesSearch =
      (ord.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const success = await ordersApi.updateOrderStatus(orderId, newStatus.toLowerCase());
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (activeOrder && activeOrder.id === orderId) {
        setActiveOrder((prev: any) => (prev ? { ...prev, status: newStatus } : null));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage customer purchases, payment verification, and shipment tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadOrders} 
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search order or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No orders match your filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {order.orderNumber}
                      {order.deliveryType === 'urgent' && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          URGENT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        order.paymentMethod === 'Safepay' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.paymentMethod}
                      </span>
                      {order.paymentStatus === 'paid' && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          PAID
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{order.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-right">
                      {formatCurrency(order.amount || order.total || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={order.status} type="order" size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveOrder(order)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold p-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details Drawer / Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{activeOrder.orderNumber}</h3>
                <p className="text-xs text-slate-400">{activeOrder.date}</p>
              </div>
              <StatusBadge status={activeOrder.status} type="order" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{activeOrder.customerName} ({activeOrder.phone})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold text-slate-800">{activeOrder.paymentMethod} ({activeOrder.paymentStatus || 'unpaid'})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Delivery Method:</span>
                <span className="font-semibold text-slate-800">
                  {activeOrder.deliveryType === 'urgent' ? 'Urgent Delivery' : 'Normal Delivery'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Delivery Charge:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(activeOrder.deliveryCharge || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(activeOrder.amount || activeOrder.total || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="text-slate-700 font-medium text-right max-w-[200px]">{activeOrder.shippingAddress || 'No address provided'}</span>
              </div>

              {/* Line Items List */}
              {activeOrder.items && activeOrder.items.length > 0 && (
                <div className="py-2 border-b border-slate-50">
                  <span className="text-slate-500 block mb-1 font-semibold">Items Ordered:</span>
                  <div className="space-y-1">
                    {activeOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>{item.productName} x{item.quantity}</span>
                        <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Updater */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Update Fulfillment Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Delivered', 'Processing', 'Shipped', 'Cancelled'] as OrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(activeOrder.id, st)}
                        className={`py-1 px-2 text-[11px] font-semibold rounded-lg border cursor-pointer ${
                          activeOrder.status === st
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setActiveOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OrdersPage;
