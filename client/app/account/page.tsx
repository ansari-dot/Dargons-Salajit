'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Package, 
  Heart, 
  User, 
  MapPin, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronRight,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { logoutUser } from '@/lib/redux/slices/authSlice';
import { selectWishlistItems, removeFromWishlist } from '@/lib/redux/slices/wishlistSlice';
import { addToCart } from '@/lib/redux/slices/cartSlice';

interface OrderItem {
  id: number;
  product_name: string;
  product_image: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  grand_total: number;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: string;
  street_address: string;
  city: string;
  postal_code: string;
  items?: OrderItem[];
}

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth);
  const wishlistItems = useAppSelector(selectWishlistItems);

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile Edit Form State
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    street_address: '',
    city: '',
    postal_code: '',
  });
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push('/login');
    } else if (user) {
      setProfileForm({
        first_name: user.first_name || user.name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        street_address: user.street_address || '',
        city: user.city || '',
        postal_code: user.postal_code || '',
      });
      fetchUserOrders();
    }
  }, [isAuthenticated, user, router]);

  const fetchUserOrders = async () => {
    try {
      setLoadingOrders(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const queryUrl = user?.email
        ? `http://localhost:5000/api/orders?email=${encodeURIComponent(user.email)}`
        : 'http://localhost:5000/api/orders';

      const res = await fetch(queryUrl, {
        headers,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (err) {
      console.warn('Could not load user orders from server:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSavingProfile(true);
    setProfileNotice(null);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileNotice({ type: 'success', text: 'Profile and delivery address updated successfully!' });
      } else {
        setProfileNotice({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileNotice({ type: 'error', text: 'Server connection error.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="account-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', margin: '60px auto', border: '1px solid #e8e5de' }}>
          <RefreshCw className="account-empty-icon animate-spin" style={{ color: '#636830' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((acc, o) => acc + Number(o.grand_total || 0), 0);

  return (
    <div className="account-page-wrapper">
      <div className="account-page-container">
        {/* ── Top Breadcrumb Bar ── */}
        <div className="account-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ fontWeight: 700, color: '#222' }}>My Account</span>
        </div>

        {/* ── User Header Card ── */}
        <div className="account-header-card">
          <div className="account-user-info">
            <div className="account-avatar">
              {(user.first_name || user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="account-user-meta">
              <h1>
                <span>{user.first_name || user.name} {user.last_name || ''}</span>
                <span className="account-role-badge">{user.role || 'Customer'}</span>
              </h1>
              <p className="account-user-email">{user.email}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="account-signout-btn">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* ── Summary Stat Metric Cards ── */}
        <div className="account-stats-grid">
          <div className="account-stat-card">
            <div className="account-stat-label">Total Orders</div>
            <h3 className="account-stat-value">{orders.length}</h3>
          </div>

          <div className="account-stat-card">
            <div className="account-stat-label">Total Spent</div>
            <h3 className="account-stat-value highlight">₨{totalSpent.toLocaleString()}</h3>
          </div>

          <div className="account-stat-card">
            <div className="account-stat-label">Wishlist Items</div>
            <h3 className="account-stat-value">{wishlistItems.length}</h3>
          </div>

          <div className="account-stat-card">
            <div className="account-stat-label">Delivery City</div>
            <h3 className="account-stat-value" style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.city || 'Not set'}
            </h3>
          </div>
        </div>

        {/* ── Main Content Tabs Card ── */}
        <div className="account-tabs-card">
          {/* Tab Navigation Header */}
          <div className="account-tabs-header">
            <button
              onClick={() => setActiveTab('orders')}
              className={`account-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            >
              <Package className="w-4 h-4" />
              <span>My Orders & Tracking ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`account-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
            >
              <Heart className="w-4 h-4" />
              <span>Saved Wishlist ({wishlistItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`account-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Delivery Details</span>
            </button>
          </div>

          {/* Tab 1: My Orders & Order Tracking */}
          {activeTab === 'orders' && (
            <div className="account-tab-body">
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#888' }}>
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p style={{ fontSize: '0.8rem' }}>Fetching your orders from database...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="account-empty-box">
                  <ShoppingBag className="account-empty-icon" />
                  <h3 className="account-empty-title">No Orders Found</h3>
                  <p className="account-empty-desc">You have not placed any orders yet.</p>
                  <Link href="/shop" className="account-btn-cta">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="account-orders-stack">
                  {orders.map((order) => (
                    <div key={order.id} className="account-order-card">
                      <div className="account-order-header">
                        <div>
                          <div className="account-order-num">
                            <span>{order.order_number}</span>
                            <span className={`account-order-badge ${order.order_status}`}>
                              {order.order_status}
                            </span>
                          </div>
                          <div className="account-order-date">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Total Amount</span>
                            <span className="account-order-total">
                              ₨{Number(order.grand_total).toLocaleString()}.00
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="account-order-track-btn"
                          >
                            <span>Track & Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Delivery Address Brief */}
                      <div className="account-order-footer-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Shipping to: <strong>{order.street_address}, {order.city}</strong></span>
                        </div>
                        <span>{order.payment_method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Saved Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="account-tab-body">
              {wishlistItems.length === 0 ? (
                <div className="account-empty-box">
                  <Heart className="account-empty-icon" />
                  <h3 className="account-empty-title">Your Wishlist is Empty</h3>
                  <p className="account-empty-desc">Save favorite Shilajit products to view them here.</p>
                  <Link href="/shop" className="account-btn-cta">
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="account-wishlist-grid">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="account-wishlist-card">
                      <div>
                        <div className="account-wishlist-img-wrap">
                          <Image
                            src={item.image || '/popular_gold_jar.png'}
                            alt={item.name}
                            fill
                            style={{ objectFit: 'contain', padding: '12px' }}
                          />
                        </div>
                        <span className="account-wishlist-category">{item.category}</span>
                        <h4 className="account-wishlist-name">{item.name}</h4>
                        <div className="account-wishlist-price">₨{item.price.toLocaleString()}.00</div>
                      </div>

                      <div className="account-wishlist-actions">
                        <button
                          onClick={() => {
                            dispatch(addToCart({
                              id: String(item.id),
                              name: item.name,
                              price: item.price,
                              image: item.image,
                              quantity: 1
                            }));
                          }}
                          className="account-wishlist-cart-btn"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => dispatch(removeFromWishlist(item.id))}
                          className="account-wishlist-del-btn"
                          title="Remove"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Profile & Delivery Address Edit */}
          {activeTab === 'profile' && (
            <div className="account-tab-body" style={{ maxWidth: '640px' }}>
              {profileNotice && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '24px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: profileNotice.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${profileNotice.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
                  color: profileNotice.type === 'success' ? '#065f46' : '#991b1b'
                }}>
                  <span>{profileNotice.text}</span>
                  <button onClick={() => setProfileNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>&times;</button>
                </div>
              )}

              <form onSubmit={handleUpdateProfile}>
                <div className="auth-form-grid">
                  <div className="auth-input-group">
                    <label className="auth-input-label">First Name</label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                      required
                      className="auth-input auth-input-no-icon"
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                      required
                      className="auth-input auth-input-no-icon"
                    />
                  </div>
                </div>

                <div className="auth-form-grid">
                  <div className="auth-input-group">
                    <label className="auth-input-label">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      required
                      className="auth-input auth-input-no-icon"
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(p => ({ ...p, city: e.target.value }))}
                      required
                      className="auth-input auth-input-no-icon"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-input-label">Street Address</label>
                  <input
                    type="text"
                    value={profileForm.street_address}
                    onChange={(e) => setProfileForm(p => ({ ...p, street_address: e.target.value }))}
                    required
                    className="auth-input auth-input-no-icon"
                  />
                </div>

                <div className="auth-input-group">
                  <label className="auth-input-label">Postal Code</label>
                  <input
                    type="text"
                    value={profileForm.postal_code}
                    onChange={(e) => setProfileForm(p => ({ ...p, postal_code: e.target.value }))}
                    required
                    className="auth-input auth-input-no-icon"
                  />
                </div>

                <div style={{ paddingTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="account-btn-cta"
                    style={{ border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer' }}
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Tracking Modal ── */}
      {selectedOrder && (
        <div className="account-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="account-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal-header">
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111', margin: 0 }}>Order Details & Live Tracking</h3>
                <p style={{ fontSize: '0.75rem', color: '#888', margin: '2px 0 0 0' }}>Order ID: {selectedOrder.order_number}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', color: '#888' }}
              >
                &times;
              </button>
            </div>

            <div className="account-modal-body">
              {/* Delivery Progress Bar */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#222', marginBottom: '16px' }}>Delivery Progress Stage</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: '3px', backgroundColor: '#eae7e0', zIndex: 0 }} />
                  
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#333' }}>Placed</span>
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: ['processing', 'completed'].includes(selectedOrder.order_status) ? '#10b981' : '#e2e8f0',
                      color: ['processing', 'completed'].includes(selectedOrder.order_status) ? '#fff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#333' }}>Processing</span>
                  </div>

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: selectedOrder.order_status === 'completed' ? '#10b981' : '#e2e8f0',
                      color: selectedOrder.order_status === 'completed' ? '#fff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#333' }}>Delivered</span>
                  </div>
                </div>
              </div>

              {/* Order Info Breakdown */}
              <div style={{ backgroundColor: '#faf9f6', padding: '16px', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Status</span>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize', color: '#222' }}>{selectedOrder.order_status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Payment Method</span>
                  <span style={{ fontWeight: 600, color: '#222' }}>{selectedOrder.payment_method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Delivery Address</span>
                  <span style={{ fontWeight: 600, color: '#222', textAlign: 'right', maxWidth: '220px' }}>{selectedOrder.street_address}, {selectedOrder.city}</span>
                </div>

                {/* Purchased Products List */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div style={{ paddingTop: '8px', borderTop: '1px solid #eae7e0', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#444', display: 'block', marginBottom: '6px' }}>Items Ordered:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedOrder.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#333', fontWeight: 500 }}>{it.product_name} × {it.quantity}</span>
                          <span style={{ fontWeight: 700, color: '#111' }}>₨{Number(it.unit_price * it.quantity).toLocaleString()}.00</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eae7e0', fontSize: '0.95rem', fontWeight: 800 }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#636830' }}>₨{Number(selectedOrder.grand_total).toLocaleString()}.00</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 24px', backgroundColor: '#f8f6f0', borderTop: '1px solid #e8e5de', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ padding: '8px 20px', backgroundColor: '#222', color: '#fff', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
