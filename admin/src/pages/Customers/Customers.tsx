import React, { useState, useEffect } from 'react';
import { customersApi, CreateCustomerPayload } from '../../services/customers.api';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { 
  Search, 
  Mail, 
  Download, 
  UserPlus, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Trash2, 
  X, 
  RefreshCw,
  Phone,
  MapPin,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { Customer } from '../../types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Show Customer (detail modal) state
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);

  // Form State for Add Customer Modal
  const [formData, setFormData] = useState<CreateCustomerPayload>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    street_address: '',
    postal_code: '',
    password: '',
    role: 'customer'
  });

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customersApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.email) {
      setStatusMessage({ type: 'error', text: 'First Name and Email are required.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const newCustomer = await customersApi.createCustomer(formData);
      setCustomers(prev => [newCustomer, ...prev]);
      setStatusMessage({ type: 'success', text: `Customer ${newCustomer.name} created successfully!` });
      setIsModalOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        city: '',
        street_address: '',
        postal_code: '',
        password: '',
        role: 'customer'
      });
      loadCustomers();
    } catch (error: any) {
      console.error('Error adding customer:', error);
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create customer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show Customer: fetch full profile from GET /api/admin/customer/:id
  const handleViewCustomer = async (id: string) => {
    setIsViewLoading(true);
    setViewCustomer(customers.find((c) => String(c.id) === String(id)) || null);
    try {
      const detail = await customersApi.getCustomer(id);
      if (detail) setViewCustomer(detail);
    } catch (error) {
      console.error('Failed to load customer details:', error);
      setStatusMessage({ type: 'error', text: 'Failed to load customer details.' });
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer '${name}'?`)) return;

    try {
      await customersApi.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      setStatusMessage({ type: 'success', text: `Customer '${name}' deleted successfully.` });
    } catch (error) {
      console.error('Failed to delete customer:', error);
      setStatusMessage({ type: 'error', text: 'Failed to delete customer.' });
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Total Orders', 'Lifetime Spend ($)', 'Member Since'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.city || ''}"`,
      c.ordersCount,
      c.totalSpent || 0,
      `"${c.joinedDate}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registered_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Summary Metrics
  const totalCustomersCount = customers.length;
  const activeBuyersCount = customers.filter(c => c.ordersCount > 0).length;
  const totalLifetimeSpent = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const avgLifetimeSpent = totalCustomersCount > 0 ? totalLifetimeSpent / totalCustomersCount : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registered Customers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Live DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your registered customer accounts, view lifetime order history, and export data.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadCustomers}
          >
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Customers</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCustomersCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Buyers</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeBuyersCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Customer Spend</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalLifetimeSpent)}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Avg. Spend / Customer</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(avgLifetimeSpent)}</h3>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, email, phone, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </Card>

      {/* Customer Data Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading customers from database...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">No Customers Found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search query or add a new customer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Total Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spent</th>
                  <th className="py-3 px-4 text-right">Member Since</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={cust.name} src={cust.avatar} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            {cust.role === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                ADMIN
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 inline" /> Verified Customer
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{cust.email}</p>
                      {cust.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {cust.phone}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {cust.city ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" /> {cust.city}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        cust.ordersCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cust.ordersCount} {cust.ordersCount === 1 ? 'order' : 'orders'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(cust.totalSpent || 0)}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 font-medium">
                      {cust.joinedDate}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCustomer(cust.id)}
                          title="View Customer"
                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <a
                          href={`mailto:${cust.email}`}
                          title="Send Email"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors font-medium"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Contact</span>
                        </a>
                        <button
                          onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                          title="Delete Customer"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Customer Account</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Ali"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Raza"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. ali@gmail.com"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Lahore"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleInputChange}
                  placeholder="e.g. Gulberg III"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password (Default: Password123!)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave empty for default Password123!"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                  {isSubmitting ? 'Saving...' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show Customer Detail Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border-slate-100">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Customer Details</h3>
                {viewCustomer.role === 'admin' && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewCustomer(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {isViewLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading customer from admin backend...</p>
                </div>
              ) : (
                <>
                  {/* Profile Header */}
                  <div className="flex items-center gap-3">
                    <Avatar name={viewCustomer.name} src={viewCustomer.avatar} size="md" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{viewCustomer.name}</p>
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 inline" /> Verified Customer
                      </p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Email</p>
                        <p className="text-slate-800 font-medium">{viewCustomer.email || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Phone</p>
                        <p className="text-slate-800 font-medium">{viewCustomer.phone || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Address</p>
                        <p className="text-slate-800 font-medium">
                          {[viewCustomer.street_address, viewCustomer.city, viewCustomer.postal_code]
                            .filter(Boolean)
                            .join(', ') || 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-600 mx-auto mb-1" />
                      <p className="font-extrabold text-slate-900 text-sm">{viewCustomer.ordersCount}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Orders</p>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded-lg">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-1" />
                      <p className="font-extrabold text-slate-900 text-sm">{formatCurrency(viewCustomer.totalSpent || 0)}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Lifetime Spend</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-purple-600 mx-auto mb-1" />
                      <p className="font-extrabold text-slate-900 text-sm">{viewCustomer.joinedDate}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Member Since</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <a
                      href={`mailto:${viewCustomer.email}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <Mail className="w-3.5 h-3.5" /> Contact
                    </a>
                    <Button type="button" variant="outline" size="sm" onClick={() => setViewCustomer(null)}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

