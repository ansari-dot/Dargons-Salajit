import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../components/common/Toast';
import {
  calculatorAdminApi,
  AdminProduct,
  AdminPackaging,
  AdminPricingTier,
} from '../../services/calculatorAdmin.api';
import {
  Layers,
  Tag,
  Scale,
  Plus,
  Pencil,
  Eye,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import './PackagingPricingTiersPage.css';

type TabId = 'items' | 'tiers' | 'weights';

interface Props {
  embedded?: boolean;
  refreshKey?: number;
  onDataChange?: () => void;
  /** Optional content for the other two tabs (e.g. <PackagingItemsPage />) */
  itemsView?: React.ReactNode;
  weightsView?: React.ReactNode;
}

const imgOf = (p: any): string => p?.image_url || p?.image || p?.thumbnail_url || '';
const money = (v: number) => `Rs. ${Number(v).toLocaleString()}`;

/* ───────────── presentational pieces (outside the page so inputs keep focus) ───────────── */

const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`pp-status ${active ? '' : 'pp-status--off'}`}>{active ? 'Active' : 'Inactive'}</span>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, onClose, footer, children }) => (
  <div className="pp-backdrop">
    <div className="pp-modal">
      <div className="pp-modal__head">
        <h3 className="pp-modal__title">{title}</h3>
        <button type="button" className="pp-modal__close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>
      {children}
      <div className="pp-modal__foot">{footer}</div>
    </div>
  </div>
);

const TierFields: React.FC<{ value: any; onChange: (v: any) => void }> = ({ value, onChange }) => (
  <div className="pp-form">
    <div className="pp-grid-2">
      <div>
        <label className="pp-label">Quantity From (pcs)</label>
        <input type="number" className="pp-input" value={value.min_quantity} onChange={(e) => onChange({ ...value, min_quantity: Number(e.target.value) })} />
      </div>
      <div>
        <label className="pp-label">Quantity To (pcs)</label>
        <input
          type="number"
          className="pp-input"
          disabled={Boolean(value.is_open_ended)}
          value={value.max_quantity ?? ''}
          onChange={(e) => onChange({ ...value, max_quantity: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
    </div>
    <div className="pp-grid-2">
      <div>
        <label className="pp-label">Price per Piece (PKR)</label>
        <input type="number" step="0.01" className="pp-input" value={value.rate} onChange={(e) => onChange({ ...value, rate: Number(e.target.value) })} />
      </div>
      <div>
        <label className="pp-label">Estimated Weight (g)</label>
        <input type="number" step="0.1" className="pp-input" value={value.estimated_weight ?? ''} onChange={(e) => onChange({ ...value, estimated_weight: e.target.value ? Number(e.target.value) : null })} />
      </div>
    </div>
    <label className="pp-check">
      <input
        type="checkbox"
        checked={Boolean(value.is_open_ended)}
        onChange={(e) => onChange({ ...value, is_open_ended: e.target.checked, max_quantity: e.target.checked ? null : value.max_quantity })}
      />
      Open-ended (applies to all quantities from "Quantity From" upward)
    </label>
    <label className="pp-check">
      <input type="checkbox" checked={Boolean(value.is_active)} onChange={(e) => onChange({ ...value, is_active: e.target.checked })} />
      Active
    </label>
  </div>
);

const WeightSettingsView: React.FC<{ refreshKey?: number; onDataChange?: () => void }> = ({
  refreshKey,
  onDataChange,
}) => {
  const toast = useToast();
  const [items, setItems] = useState<AdminPackaging[]>([]);
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const packagingItems = await calculatorAdminApi.getPackaging();
      const nextWeights: Record<number, string> = {};
      packagingItems.forEach((item) => {
        nextWeights[item.id] = item.estimated_weight || '';
      });
      setItems(packagingItems);
      setWeights(nextWeights);
    } catch (error) {
      toast.error('Failed to load weight settings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [refreshKey]);

  const saveWeight = async (item: AdminPackaging) => {
    setSavingId(item.id);
    try {
      await calculatorAdminApi.updatePackaging(item.id, {
        estimated_weight: weights[item.id]?.trim() || null,
      });
      toast.success('Estimated weight updated.');
      loadItems();
      onDataChange?.();
    } catch (error) {
      toast.error('Failed to update estimated weight: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <p className="pp-placeholder">Loading weight settings...</p>;
  }

  return (
    <div className="pp-table-wrap">
      <table className="pp-table">
        <thead>
          <tr>
            <th>Packaging Item</th>
            <th>Type</th>
            <th>Estimated Weight</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="pp-empty">No packaging items available.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>
                  <input
                    className="pp-input pp-weight-input"
                    value={weights[item.id] || ''}
                    placeholder="e.g. 1.5 g or 5–8 g"
                    onChange={(event) =>
                      setWeights((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="pp-pill pp-pill--ghost pp-pill--sm"
                    onClick={() => saveWeight(item)}
                    disabled={savingId === item.id}
                  >
                    {savingId === item.id ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

/* ───────────── page ───────────── */

export const PackagingPricingTiersPage: React.FC<Props> = ({
  embedded = false,
  refreshKey,
  onDataChange,
  itemsView,
  weightsView,
}) => {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('tiers');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [packaging, setPackaging] = useState<AdminPackaging[]>([]);
  const [tiers, setTiers] = useState<AdminPricingTier[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any | null>(null);

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
      toast.error('Failed to load packaging pricing: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    if (!products.some((p) => p.id === productId)) setProductId(products[0]?.id ?? null);
  }, [products]);

  /* packaging items for the chosen product (uses product_id when the API provides it, otherwise all items) */
  const itemOptions = useMemo(() => {
    const linked = packaging.filter((p: any) => p.product_id === productId);
    return linked.length ? linked : packaging;
  }, [packaging, productId]);

  useEffect(() => {
    if (!itemOptions.some((p) => p.id === itemId)) setItemId(itemOptions[0]?.id ?? null);
  }, [itemOptions]);

  const product = products.find((p) => p.id === productId) || null;
  const item: any = packaging.find((p) => p.id === itemId) || null;

  const rows = useMemo(
    () =>
      tiers
        .filter((t) => t.entity_type === 'packaging' && t.entity_id === itemId)
        .sort((a, b) => a.min_quantity - b.min_quantity),
    [tiers, itemId],
  );

  const weightOf = (t: any): string => {
    const w = t.estimated_weight ?? item?.estimated_weight ?? null;
    return w === null || w === undefined || w === '' ? '–' : /[a-z]/i.test(String(w)) ? String(w) : `${w} g`;
  };

  const openAdd = () =>
    setDraft({
      entity_type: 'packaging',
      entity_id: itemId,
      min_quantity: rows.length ? Number(rows[rows.length - 1].max_quantity ?? rows[rows.length - 1].min_quantity) + 1 : 1,
      max_quantity: null,
      rate: 0,
      estimated_weight: null,
      is_open_ended: false,
      is_active: true,
      effective_from: null,
      effective_until: null,
      pricing_version: rows[0]?.pricing_version ?? 1,
    });

  const handleCreate = async () => {
    try {
      await calculatorAdminApi.createPricingTier(draft);
      toast.success('Pricing tier created.');
      setDraft(null);
      loadData();
      onDataChange?.();
    } catch (err: any) {
      toast.error('Failed to create tier: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await calculatorAdminApi.updatePricingTier(editing.id, editing);
      toast.success('Pricing tier updated successfully.');
      setEditing(null);
      loadData();
      onDataChange?.();
    } catch (err: any) {
      toast.error('Failed to update pricing tier: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing tier?')) return;
    try {
      await calculatorAdminApi.deletePricingTier(id);
      toast.success('Pricing tier removed.');
      loadData();
      onDataChange?.();
    } catch (err: any) {
      toast.error('Failed to delete tier: ' + err.message);
    }
  };

  const tabBtn = (id: TabId, icon: React.ReactNode, label: string) => (
    <button type="button" className={`pp-tab ${tab === id ? 'pp-tab--active' : ''}`} onClick={() => setTab(id)}>
      {icon}
      {label}
    </button>
  );

  return (
    <div className="pp-page">
      {!embedded && (
        <div className="pp-header">
          <div>
            <h1 className="pp-title">
              <Layers />
              Packaging Pricing Tiers
            </h1>
            <p className="pp-subtitle">Set quantity-based pricing for each packaging item and configure price tiers.</p>
          </div>
          <button type="button" className="pp-pill pp-pill--outline" onClick={loadData}>
            <RefreshCw className={isLoading ? 'pp-spin' : ''} />
            Refresh
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="pp-tabs">
        {tabBtn('items', <Layers />, 'Packaging Items')}
        {tabBtn('tiers', <Tag />, 'Pricing Tiers')}
        {tabBtn('weights', <Scale />, 'Weight Settings')}
      </div>

      {tab === 'items' && (itemsView ?? <div className="pp-card"><p className="pp-placeholder">Pass your Packaging Items view as the itemsView prop.</p></div>)}
      {tab === 'weights' && (
        <div className="pp-card">
          {weightsView ?? <WeightSettingsView refreshKey={refreshKey} onDataChange={onDataChange} />}
        </div>
      )}

      {tab === 'tiers' && (
        <div className="pp-card">
          {/* Toolbar */}
          <div className="pp-toolbar">
            <div className="pp-field">
              <span className="pp-field__label">Select Product</span>
              <div className="pp-select-wrap pp-select-wrap--product">
                {imgOf(product) && (
                  <span className="pp-select-thumb">
                    <img src={imgOf(product)} alt="" />
                  </span>
                )}
                <select
                  className={`pp-select ${imgOf(product) ? 'pp-select--thumb' : ''}`}
                  value={productId ?? ''}
                  onChange={(e) => setProductId(Number(e.target.value))}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pp-field">
              <span className="pp-field__label">Select Packaging Item</span>
              <div className="pp-select-wrap pp-select-wrap--item">
                <select className="pp-select" value={itemId ?? ''} onChange={(e) => setItemId(Number(e.target.value))}>
                  {itemOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <span className="pp-toolbar__spacer" />
            <button type="button" className="pp-pill pp-pill--ghost" onClick={openAdd} disabled={itemId === null}>
              <Plus />
              Add Pricing Tier
            </button>
          </div>

          {/* Table */}
          <div className="pp-table-wrap">
            <table className="pp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Quantity From</th>
                  <th>Quantity To</th>
                  <th>Price per Piece (PKR)</th>
                  <th>Estimated Weight (g)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="pp-empty">No pricing tiers for this item yet. Use Add Pricing Tier to create the first slab.</td>
                  </tr>
                )}
                {rows.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>{Number(t.min_quantity).toLocaleString()}</td>
                    <td>{t.is_open_ended || t.max_quantity === null ? '+' : Number(t.max_quantity).toLocaleString()}</td>
                    <td>{money(t.rate)}</td>
                    <td>{weightOf(t)}</td>
                    <td>
                      <StatusPill active={Boolean(t.is_active)} />
                    </td>
                    <td>
                      <div className="pp-actions">
                        <button type="button" className="pp-icon pp-icon--edit" onClick={() => setEditing({ ...t })} aria-label="Edit">
                          <Pencil />
                        </button>
                        <button type="button" className="pp-icon pp-icon--view" onClick={() => setViewing(t)} aria-label="View">
                          <Eye />
                        </button>
                        <button type="button" className="pp-icon pp-icon--del" onClick={() => handleDelete(t.id)} aria-label="Delete">
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pp-info">
            <span className="pp-info__icon">i</span>
            Price tiers are applied based on purchased quantity for the selected packaging item.
          </div>
        </div>
      )}

      {/* ADD */}
      {draft && (
        <Modal
          title="Add Pricing Tier"
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className="pp-pill pp-pill--outline pp-pill--sm" onClick={() => setDraft(null)}>Cancel</button>
              <button type="button" className="pp-pill pp-pill--green pp-pill--sm" onClick={handleCreate}>Create Tier</button>
            </>
          }
        >
          <TierFields value={draft} onChange={setDraft} />
        </Modal>
      )}

      {/* EDIT */}
      {editing && (
        <Modal
          title={`Edit Pricing Tier #${editing.id}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="pp-pill pp-pill--outline pp-pill--sm" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="pp-pill pp-pill--green pp-pill--sm" onClick={handleSave}>Save Tier</button>
            </>
          }
        >
          <TierFields value={editing} onChange={setEditing} />
        </Modal>
      )}

      {/* VIEW */}
      {viewing && (
        <Modal
          title={`Pricing Tier #${viewing.id}`}
          onClose={() => setViewing(null)}
          footer={<button type="button" className="pp-pill pp-pill--outline pp-pill--sm" onClick={() => setViewing(null)}>Close</button>}
        >
          <dl className="pp-dl">
            <div><dt>Packaging Item</dt><dd>{item?.name}</dd></div>
            <div><dt>Status</dt><dd>{viewing.is_active ? 'Active' : 'Inactive'}</dd></div>
            <div><dt>Quantity From</dt><dd>{Number(viewing.min_quantity).toLocaleString()}</dd></div>
            <div><dt>Quantity To</dt><dd>{viewing.is_open_ended || viewing.max_quantity === null ? '+' : Number(viewing.max_quantity).toLocaleString()}</dd></div>
            <div><dt>Price per Piece</dt><dd>{money(viewing.rate)}</dd></div>
            <div><dt>Estimated Weight</dt><dd>{weightOf(viewing)}</dd></div>
          </dl>
        </Modal>
      )}
    </div>
  );
};
