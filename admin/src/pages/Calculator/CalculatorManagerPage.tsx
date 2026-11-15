import React, { useState, useEffect } from 'react';
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
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  Box,
  X,
  DollarSign,
} from 'lucide-react';
import { CalculatorImageUpload } from './CalculatorImageUpload';
import { PackagingItemsPage } from './PackagingItemsPage';
import { PricingEngineTiersPage } from './PricingEngineTiersPage';
import { CalculatorCurrencySettingsPage } from './CalculatorCurrencySettingsPage';
import './CalculatorManagerPage.css';

type TabId = 'products' | 'packaging' | 'tiers' | 'currencies';

const emptyProduct = {
  name: '',
  unit_type: 'grams',
  moq: 0,
  min_product_cost: 0,
  description: '',
  image_url: '',
  is_active: true,
};

const productImg = (p: any): string => p.image_url || p.image || p.thumbnail_url || '';

/* ───────────── small presentational pieces (kept outside the page so inputs never lose focus) ───────────── */

const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`cm-status ${active ? '' : 'cm-status--off'}`}>{active ? 'Active' : 'Inactive'}</span>
);

const ActionLink: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({
  onClick,
  icon,
  label,
}) => (
  <button type="button" className="cm-action" onClick={onClick}>
    {icon}
    {label}
  </button>
);

const DeleteBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" className="cm-action cm-action--danger" onClick={onClick} aria-label="Delete">
    <Trash2 />
  </button>
);

const TabBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button type="button" className={`cm-tab ${active ? 'cm-tab--active' : ''}`} onClick={onClick}>
    {icon}
    {label}
  </button>
);

const CardHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
  currency: string;
  currencyOpen: boolean;
  onToggleCurrency: () => void;
  onPickCurrency: (c: string) => void;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, icon, currency, currencyOpen, onToggleCurrency, onPickCurrency, actionLabel, onAction }) => (
  <div className="cm-card__head">
    <h2 className="cm-card__title">
      {icon}
      {title}
    </h2>
    <div className="cm-card__tools">
      {actionLabel && (
        <button type="button" className="cm-pill cm-pill--green" onClick={onAction}>
          <Plus />
          {actionLabel}
        </button>
      )}
      <div className="cm-cur">
        <button type="button" className="cm-pill cm-pill--outline" onClick={onToggleCurrency}>
          {currency}
          <span className="cm-caret">▼</span>
        </button>
        {currencyOpen && (
          <ul className="cm-cur__menu">
            {['PKR', 'USD', 'GBP', 'EUR'].map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className={`cm-cur__item ${c === currency ? 'cm-cur__item--active' : ''}`}
                  onClick={() => onPickCurrency(c)}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, onClose, footer, children }) => (
  <div className="cm-backdrop">
    <div className="cm-modal">
      <div className="cm-modal__head">
        <h3 className="cm-modal__title">{title}</h3>
        <button type="button" className="cm-modal__close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>
      {children}
      <div className="cm-modal__foot">{footer}</div>
    </div>
  </div>
);

const CancelBtn: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Cancel' }) => (
  <button type="button" className="cm-pill cm-pill--outline cm-pill--sm" onClick={onClick}>
    {label}
  </button>
);

const PrimaryBtn: React.FC<{ onClick: () => void; label: string; disabled?: boolean }> = ({
  onClick,
  label,
  disabled = false,
}) => (
  <button type="button" className="cm-pill cm-pill--green cm-pill--sm" onClick={onClick} disabled={disabled}>
    {label}
  </button>
);

const ProductFields: React.FC<{
  value: any;
  onChange: (v: any) => void;
  onImageUploadingChange: (uploading: boolean) => void;
}> = ({ value, onChange, onImageUploadingChange }) => (
  <div className="cm-form">
    <div>
      <label className="cm-label">Product Name</label>
      <input
        type="text"
        className="cm-input"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
    </div>
    <div>
      <label className="cm-label">Product Image</label>
      <CalculatorImageUpload
        value={value.image_url}
        onChange={(imageUrl) => onChange({ ...value, image_url: imageUrl || null })}
        onUploadingChange={onImageUploadingChange}
      />
    </div>
    <div>
      <label className="cm-label">Unit Type (Packing)</label>
      <select
        className="cm-input"
        value={value.unit_type}
        onChange={(e) => onChange({ ...value, unit_type: e.target.value })}
      >
        <option value="grams">Grams (g)</option>
        <option value="ml">Milliliters (ml)</option>
        <option value="capsules">Capsules</option>
        <option value="blisters">Blisters</option>
        <option value="units">Units</option>
      </select>
    </div>
    <div className="cm-grid-2">
      <div>
        <label className="cm-label">MOQ</label>
        <input
          type="number"
          className="cm-input"
          value={value.moq}
          onChange={(e) => onChange({ ...value, moq: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="cm-label">Minimum Product Cost (Rs.)</label>
        <input
          type="number"
          className="cm-input"
          value={value.min_product_cost}
          onChange={(e) => onChange({ ...value, min_product_cost: Number(e.target.value) })}
        />
      </div>
    </div>
    <div>
      <label className="cm-label">Description</label>
      <textarea
        rows={2}
        className="cm-input"
        value={value.description || ''}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
      />
    </div>
  </div>
);

/* ───────────── page ───────────── */

export const CalculatorManagerPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('products');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currency, setCurrency] = useState('PKR');
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [packaging, setPackaging] = useState<AdminPackaging[]>([]);
  const [tiers, setTiers] = useState<AdminPricingTier[]>([]);

  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<AdminProduct | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<any>(emptyProduct);
  const [isProductImageUploading, setIsProductImageUploading] = useState(false);

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

  const handleSaveProduct = async () => {
    if (!editingProduct || isProductImageUploading) return;
    try {
      await calculatorAdminApi.updateProduct(editingProduct.id, editingProduct);
      toast.success('Product updated successfully.');
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update product: ' + err.message);
    }
  };

  const handleCreateProduct = async () => {
    if (isProductImageUploading) return;
    try {
      await calculatorAdminApi.createProduct(newProduct);
      toast.success('Product created.');
      setIsAddingProduct(false);
      setNewProduct(emptyProduct);
      loadData();
    } catch (err: any) {
      toast.error('Failed to create product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await calculatorAdminApi.deleteProduct(id);
      toast.success('Product removed.');
      loadData();
    } catch (err: any) {
      toast.error('Failed to delete product: ' + err.message);
    }
  };

  const headerProps = {
    currency,
    currencyOpen,
    onToggleCurrency: () => setCurrencyOpen((o) => !o),
    onPickCurrency: (c: string) => {
      setCurrency(c);
      setCurrencyOpen(false);
    },
  };

  return (
    <div className="cm-page">
      {/* Header */}
      <div className="cm-header">
        <div>
          <h1 className="cm-title">
            <Calculator />
            Calculator Management
          </h1>
          <p className="cm-subtitle">
            Configure Private Label Shilajit products, packaging items, dielines, and centralized pricing tiers without
            code changes.
          </p>
        </div>
        <button
          type="button"
          className="cm-pill cm-pill--outline"
          onClick={() => {
            setRefreshKey((key) => key + 1);
            loadData();
          }}
        >
          <RefreshCw className={isLoading ? 'cm-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="cm-tabs">
        <TabBtn
          active={activeTab === 'products'}
          onClick={() => setActiveTab('products')}
          icon={<Package />}
          label={`Products (${products.length})`}
        />
        <TabBtn
          active={activeTab === 'packaging'}
          onClick={() => setActiveTab('packaging')}
          icon={<Layers />}
          label={`Packaging Items (${packaging.length})`}
        />
        <TabBtn
          active={activeTab === 'tiers'}
          onClick={() => setActiveTab('tiers')}
          icon={<Calculator />}
          label={`Pricing Engine Tiers (${tiers.length})`}
        />
        <TabBtn
          active={activeTab === 'currencies'}
          onClick={() => setActiveTab('currencies')}
          icon={<DollarSign />}
          label="Currencies"
        />
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="cm-card">
          <CardHeader
            title="Products"
            icon={<Box />}
            actionLabel="Add Product"
            onAction={() => setIsAddingProduct(true)}
            {...headerProps}
          />
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Unit Type</th>
                  <th>MOQ</th>
                  <th>Min Product Cost</th>
                  <th>Status</th>
                  <th className="cm-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="cm-id">#{p.id}</td>
                    <td>
                      {productImg(p) ? (
                        <div className="cm-thumb">
                          <img src={productImg(p)} alt={p.name} />
                        </div>
                      ) : (
                        <div className="cm-thumb cm-thumb--empty">
                          <Package />
                        </div>
                      )}
                    </td>
                    <td className="cm-name">{p.name}</td>
                    <td className="cm-upper">{p.unit_type}</td>
                    <td>{Number(p.moq).toLocaleString()}</td>
                    <td>{p.min_product_cost > 0 ? `Rs. ${Number(p.min_product_cost).toLocaleString()}` : '–'}</td>
                    <td>
                      <StatusPill active={Boolean(p.is_active)} />
                    </td>
                    <td>
                      <div className="cm-actions">
                        <ActionLink onClick={() => setEditingProduct(p)} icon={<Pencil />} label="Edit" />
                        <span className="cm-divider" />
                        <ActionLink onClick={() => setViewingProduct(p)} icon={<Eye />} label="View" />
                        <span className="cm-divider" />
                        <DeleteBtn onClick={() => handleDeleteProduct(p.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGING */}
      {activeTab === 'packaging' && (
        <PackagingItemsPage
          embedded
          refreshKey={refreshKey}
          onDataChange={() => {
            loadData();
          }}
        />
      )}

      {/* TAB 3: PRICING ENGINE TIERS */}
      {activeTab === 'tiers' && (
        <PricingEngineTiersPage
          embedded
          refreshKey={refreshKey}
          onDataChange={() => {
            loadData();
          }}
        />
      )}
      {activeTab === 'currencies' && <CalculatorCurrencySettingsPage />}

      {/* ADD PRODUCT */}
      {isAddingProduct && (
        <Modal
          title="Add Product"
          onClose={() => setIsAddingProduct(false)}
          footer={
            <>
              <CancelBtn onClick={() => setIsAddingProduct(false)} />
              <PrimaryBtn onClick={handleCreateProduct} label="Create Product" disabled={isProductImageUploading} />
            </>
          }
        >
          <ProductFields
            value={newProduct}
            onChange={setNewProduct}
            onImageUploadingChange={setIsProductImageUploading}
          />
        </Modal>
      )}

      {/* EDIT PRODUCT */}
      {editingProduct && (
        <Modal
          title={`Edit Product #${editingProduct.id}`}
          onClose={() => setEditingProduct(null)}
          footer={
            <>
              <CancelBtn onClick={() => setEditingProduct(null)} />
              <PrimaryBtn onClick={handleSaveProduct} label="Save Changes" disabled={isProductImageUploading} />
            </>
          }
        >
          <ProductFields
            value={editingProduct}
            onChange={setEditingProduct as any}
            onImageUploadingChange={setIsProductImageUploading}
          />
        </Modal>
      )}

      {/* VIEW PRODUCT */}
      {viewingProduct && (
        <Modal
          title={`Product #${viewingProduct.id}`}
          onClose={() => setViewingProduct(null)}
          footer={<CancelBtn onClick={() => setViewingProduct(null)} label="Close" />}
        >
          <div className="cm-view__top">
            {productImg(viewingProduct) ? (
              <div className="cm-thumb cm-view__img">
                <img src={productImg(viewingProduct)} alt={viewingProduct.name} />
              </div>
            ) : (
              <div className="cm-thumb cm-thumb--empty cm-view__img">
                <Package />
              </div>
            )}
            <div>
              <div className="cm-view__name">{viewingProduct.name}</div>
              <StatusPill active={Boolean(viewingProduct.is_active)} />
            </div>
          </div>
          <dl className="cm-dl">
            <div>
              <dt>Unit Type</dt>
              <dd className="cm-upper">{viewingProduct.unit_type}</dd>
            </div>
            <div>
              <dt>MOQ</dt>
              <dd>{Number(viewingProduct.moq).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Min Product Cost</dt>
              <dd>
                {viewingProduct.min_product_cost > 0
                  ? `Rs. ${Number(viewingProduct.min_product_cost).toLocaleString()}`
                  : '–'}
              </dd>
            </div>
            <div className="cm-dl__full">
              <dt>Description</dt>
              <dd>{viewingProduct.description || '–'}</dd>
            </div>
          </dl>
        </Modal>
      )}

    </div>
  );
};
