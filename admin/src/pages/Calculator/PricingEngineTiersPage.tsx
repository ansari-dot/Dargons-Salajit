import React, { useState, useEffect, useMemo } from 'react';
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
  CircleDollarSign,
  Plus,
  Pencil,
  Eye,
  Trash2,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { PackagingPricingTiersPage } from './PackagingPricingTiersPage';
import { PackagingItemsPage } from './PackagingItemsPage';
import './PricingEngineTiersPage.css';

type TabId = 'product' | 'packaging' | 'currency';

interface PricingEngineTiersPageProps {
  embedded?: boolean;
  refreshKey?: number;
  onDataChange?: () => void;
}

/* ───────────── formatting helpers ───────────── */

// Quantities are stored in the product's base unit (grams, ml, pieces ...)
const qty = (v: number | null | undefined, unit: string): string => {
  if (v === null || v === undefined) return '∞';
  const n = Number(v);
  if (unit === 'grams') return n >= 1000 ? `${n / 1000} kg` : `${n} g`;
  if (unit === 'ml') return n >= 1000 ? `${n / 1000} L` : `${n} ml`;
  if (unit === 'pcs') return `${n.toLocaleString()} pcs`;
  return `${n.toLocaleString()} ${unit}`;
};

const perUnit = (unit: string): string =>
  ({ grams: 'g', ml: 'ml', capsules: 'capsule', blisters: 'blister', units: 'unit', pcs: 'pc' } as Record<string, string>)[
    unit
  ] || unit;

const priceText = (rate: number, unit: string) => `Rs. ${Number(rate).toLocaleString()} / ${perUnit(unit)}`;

const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return y && m && day ? `${day}-${m}-${y}` : '—';
};

const imgOf = (p: any): string => p?.image_url || p?.image || p?.thumbnail_url || '';
const versionLabel = (v: number) => `v${Number(v).toFixed(1)}`;

/* ───────────── presentational pieces (outside the page so inputs keep focus) ───────────── */

const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`pt-status ${active ? '' : 'pt-status--off'}`}>{active ? 'Active' : 'Inactive'}</span>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, onClose, footer, children }) => (
  <div className="pt-backdrop">
    <div className="pt-modal">
      <div className="pt-modal__head admin-form-header">
        <h3 className="pt-modal__title">{title}</h3>
        <button type="button" className="pt-modal__close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>
      {children}
      <div className="pt-modal__foot">{footer}</div>
    </div>
  </div>
);

const TierFields: React.FC<{
  value: any;
  unit: string;
  showEstimatedWeight: boolean;
  onChange: (v: any) => void;
}> = ({ value, unit, showEstimatedWeight, onChange }) => (
  <div className="pt-form">
    <div className="pt-grid-2">
      <div>
        <label className="pt-label">Min Quantity ({perUnit(unit)})</label>
        <input type="number" className="pt-input" value={value.min_quantity} onChange={(e) => onChange({ ...value, min_quantity: Number(e.target.value) })} />
      </div>
      <div>
        <label className="pt-label">Max Quantity ({perUnit(unit)})</label>
        <input
          type="number"
          className="pt-input"
          disabled={Boolean(value.is_open_ended)}
          value={value.max_quantity ?? ''}
          onChange={(e) => onChange({ ...value, max_quantity: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
    </div>
    {showEstimatedWeight && (
      <div>
        <label className="pt-label">Estimated Weight (g)</label>
        <input
          type="number"
          step="0.1"
          className="pt-input"
          value={value.estimated_weight ?? ''}
          onChange={(e) => onChange({ ...value, estimated_weight: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
    )}
    <div className="pt-grid-2">
      <div>
        <label className="pt-label">Unit Price (Rs. / {perUnit(unit)})</label>
        <input type="number" step="0.01" className="pt-input" value={value.rate} onChange={(e) => onChange({ ...value, rate: Number(e.target.value) })} />
      </div>
      <div>
        <label className="pt-label">Pricing Version</label>
        <input type="number" step="0.1" className="pt-input" value={value.pricing_version} onChange={(e) => onChange({ ...value, pricing_version: Number(e.target.value) })} />
      </div>
    </div>
    <div className="pt-grid-2">
      <div>
        <label className="pt-label">Valid From</label>
        <input type="date" className="pt-input" value={value.effective_from ? String(value.effective_from).slice(0, 10) : ''} onChange={(e) => onChange({ ...value, effective_from: e.target.value || null })} />
      </div>
      <div>
        <label className="pt-label">Valid Until</label>
        <input type="date" className="pt-input" value={value.effective_until ? String(value.effective_until).slice(0, 10) : ''} onChange={(e) => onChange({ ...value, effective_until: e.target.value || null })} />
      </div>
    </div>
    <label className="pt-check">
      <input
        type="checkbox"
        checked={Boolean(value.is_open_ended)}
        onChange={(e) => onChange({ ...value, is_open_ended: e.target.checked })}
      />
      Open-Ended Tier (applies to all quantities above Max)
    </label>
    <label className="pt-check">
      <input type="checkbox" checked={Boolean(value.is_active)} onChange={(e) => onChange({ ...value, is_active: e.target.checked })} />
      Active
    </label>
  </div>
);

/* ───────────── page ───────────── */

export const PricingEngineTiersPage: React.FC<PricingEngineTiersPageProps> = ({
  embedded = false,
  refreshKey,
  onDataChange,
}) => {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('product');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [packaging, setPackaging] = useState<AdminPackaging[]>([]);
  const [tiers, setTiers] = useState<AdminPricingTier[]>([]);
  const [entityId, setEntityId] = useState<number | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<AdminPricingTier | null>(null);
  const [draft, setDraft] = useState<any | null>(null);

  const entityType = tab === 'packaging' ? 'packaging' : 'product';
  const entities: any[] = entityType === 'product' ? products : packaging;
  const entity = entities.find((e) => e.id === entityId) || null;
  const unit: string = entityType === 'product' ? entity?.unit_type || 'units' : 'pcs';

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
      toast.error('Failed to load pricing tiers: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  /* keep a valid selection when the tab or data changes */
  useEffect(() => {
    if (tab === 'currency') return;
    if (!entities.some((e) => e.id === entityId)) setEntityId(entities[0]?.id ?? null);
  }, [tab, products, packaging]);

  const entityTiers = useMemo(
    () => tiers.filter((t) => t.entity_type === entityType && t.entity_id === entityId),
    [tiers, entityType, entityId],
  );

  const versions = useMemo(
    () => Array.from(new Set(entityTiers.map((t) => Number(t.pricing_version)))).sort((a, b) => b - a),
    [entityTiers],
  );

  const activeVersion = version !== null && versions.includes(version) ? version : versions[0] ?? null;

  const rows = useMemo(
    () =>
      entityTiers
        .filter((t) => Number(t.pricing_version) === activeVersion)
        .sort((a, b) => a.min_quantity - b.min_quantity),
    [entityTiers, activeVersion],
  );

  const versionActive = rows.some((t) => t.is_active);
  const openTier = rows.find((t) => t.is_open_ended);

  const toggleVersion = async () => {
    try {
      await Promise.all(rows.map((t) => calculatorAdminApi.updatePricingTier(t.id, { ...t, is_active: !versionActive })));
      toast.success(`Pricing ${versionLabel(activeVersion!)} ${versionActive ? 'deactivated' : 'activated'}.`);
      loadData();
      onDataChange?.();
    } catch (err: any) {
      toast.error('Failed to update version: ' + err.message);
    }
  };

  const openAdd = () =>
    setDraft({
      entity_type: entityType,
      entity_id: entityId,
      min_quantity: 0,
      max_quantity: null,
      rate: 0,
      estimated_weight: entityType === 'packaging' ? null : undefined,
      is_open_ended: false,
      is_active: true,
      effective_from: null,
      effective_until: null,
      pricing_version: activeVersion ?? 1,
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
    <button type="button" className={`pt-tab ${tab === id ? 'pt-tab--active' : ''}`} onClick={() => { setEntityId(null); setVersion(null); setTab(id); }}>
      {icon}
      {label}
    </button>
  );

  return (
    <div className="pt-page">
      {!embedded && (
        <div className="pt-header">
          <div>
            <h1 className="pt-title">
              <Calculator />
              Pricing Engine Tiers
            </h1>
            <p className="pt-subtitle">Manage pricing tiers with quantity slabs, set prices, and configure open-ended options.</p>
          </div>
          <button type="button" className="pt-pill pt-pill--outline" onClick={loadData}>
            <RefreshCw className={isLoading ? 'pt-spin' : ''} />
            Refresh
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="pt-tabs">
        {tabBtn('product', <Package />, 'Product Pricing Tiers')}
        {tabBtn('packaging', <Layers />, 'Packaging Pricing Tiers')}
        {tabBtn('currency', <CircleDollarSign />, 'Currency Settings')}
      </div>

      {tab === 'currency' ? (
        <div className="pt-card">
          <p className="pt-empty" style={{ padding: 40 }}>Currency settings are not configured in this view.</p>
        </div>
      ) : tab === 'packaging' ? (
        <PackagingPricingTiersPage
          embedded
          refreshKey={refreshKey}
          onDataChange={onDataChange}
          itemsView={<PackagingItemsPage embedded refreshKey={refreshKey} onDataChange={onDataChange} />}
        />
      ) : (
        <div className="pt-card">
          {/* Toolbar */}
          <div className="pt-toolbar">
            <div className="pt-field">
              <span className="pt-field__label">{entityType === 'product' ? 'Select Product' : 'Select Packaging Item'}</span>
              <div className="pt-select-wrap pt-select-wrap--product">
                {imgOf(entity) && (
                  <span className="pt-select-thumb">
                    <img src={imgOf(entity)} alt="" />
                  </span>
                )}
                <select
                  className={`pt-select ${imgOf(entity) ? 'pt-select--thumb' : ''}`}
                  value={entityId ?? ''}
                  onChange={(e) => {
                    setEntityId(Number(e.target.value));
                    setVersion(null);
                  }}
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-field">
              <span className="pt-field__label">Pricing Version</span>
              <div className="pt-select-wrap pt-select-wrap--version">
                <select className="pt-select" value={activeVersion ?? ''} onChange={(e) => setVersion(Number(e.target.value))}>
                  {versions.length === 0 && <option value="">No versions</option>}
                  {versions.map((v) => {
                    const on = entityTiers.some((t) => Number(t.pricing_version) === v && t.is_active);
                    return (
                      <option key={v} value={v}>
                        {versionLabel(v)} {on ? '(Active)' : '(Inactive)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {activeVersion !== null && (
              <div className="pt-version-state">
                <StatusPill active={versionActive} />
                <button
                  type="button"
                  role="switch"
                  aria-checked={versionActive}
                  aria-label="Toggle version status"
                  className={`pt-toggle ${versionActive ? 'pt-toggle--on' : ''}`}
                  onClick={toggleVersion}
                >
                  <Check className="pt-toggle__check" />
                  <span className="pt-toggle__knob" />
                </button>
              </div>
            )}

            <span className="pt-toolbar__spacer" />
            <button type="button" className="pt-pill pt-pill--green" onClick={openAdd} disabled={entityId === null}>
              <Plus />
              Add Tier
            </button>
          </div>

          {/* Table */}
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Min Quantity</th>
                  <th>Max Quantity</th>
                  <th>Unit Price</th>
                  {entityType === 'product' ? (
                    <>
                      <th>Open Ended</th>
                      <th>Valid From</th>
                      <th>Valid Until</th>
                    </>
                  ) : (
                    <th>Estimated Weight (g)</th>
                  )}
                  <th>Status</th>
                  <th className="pt-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={entityType === 'product' ? 9 : 7} className="pt-empty">No pricing tiers yet. Use Add Tier to create the first slab.</td>
                  </tr>
                )}
                {rows.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>{qty(t.min_quantity, unit)}</td>
                    <td>{qty(t.max_quantity, unit)}</td>
                    <td>{priceText(t.rate, unit)}</td>
                    {entityType === 'product' ? (
                      <>
                        <td>{t.is_open_ended ? 'Yes' : 'No'}</td>
                        <td>{fmtDate(t.effective_from)}</td>
                        <td>{fmtDate(t.effective_until)}</td>
                      </>
                    ) : (
                      <td>{t.estimated_weight == null ? '–' : `${Number(t.estimated_weight)} g`}</td>
                    )}
                    <td>
                      <StatusPill active={Boolean(t.is_active)} />
                    </td>
                    <td>
                      <div className="pt-actions">
                        <button type="button" className="pt-icon pt-icon--edit" onClick={() => setEditing({ ...t })} aria-label="Edit">
                          <Pencil />
                        </button>
                        <button type="button" className="pt-icon pt-icon--view" onClick={() => setViewing(t)} aria-label="View">
                          <Eye />
                        </button>
                        <button type="button" className="pt-icon pt-icon--del" onClick={() => handleDelete(t.id)} aria-label="Delete">
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {openTier && (
            <div className="pt-info">
              <span className="pt-info__icon">i</span>
              <div>
                <div className="pt-info__title">Open-Ended Tier</div>
                <div className="pt-info__text">
                  Quantities above {qty(openTier.max_quantity ?? openTier.min_quantity, unit)} will be charged at{' '}
                  {priceText(openTier.rate, unit)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD */}
      {draft && (
        <Modal
          title="Add Pricing Tier"
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className="pt-pill pt-pill--outline pt-pill--sm" onClick={() => setDraft(null)}>Cancel</button>
              <button type="button" className="pt-pill pt-pill--green pt-pill--sm" onClick={handleCreate}>Create Tier</button>
            </>
          }
        >
          <TierFields value={draft} unit={unit} showEstimatedWeight={draft.entity_type === 'packaging'} onChange={setDraft} />
        </Modal>
      )}

      {/* EDIT */}
      {editing && (
        <Modal
          title={`Edit Pricing Tier #${editing.id}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="pt-pill pt-pill--outline pt-pill--sm" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="pt-pill pt-pill--green pt-pill--sm" onClick={handleSave}>Save Tier</button>
            </>
          }
        >
          <TierFields value={editing} unit={unit} showEstimatedWeight={editing.entity_type === 'packaging'} onChange={setEditing} />
        </Modal>
      )}

      {/* VIEW */}
      {viewing && (
        <Modal
          title={`Pricing Tier #${viewing.id}`}
          onClose={() => setViewing(null)}
          footer={<button type="button" className="pt-pill pt-pill--outline pt-pill--sm" onClick={() => setViewing(null)}>Close</button>}
        >
          <dl className="pt-dl">
            <div><dt>Target</dt><dd>{entity?.name}</dd></div>
            <div><dt>Version</dt><dd>{versionLabel(viewing.pricing_version)}</dd></div>
            <div><dt>Min Quantity</dt><dd>{qty(viewing.min_quantity, unit)}</dd></div>
            <div><dt>Max Quantity</dt><dd>{qty(viewing.max_quantity, unit)}</dd></div>
            <div><dt>Unit Price</dt><dd>{priceText(viewing.rate, unit)}</dd></div>
            <div><dt>Open Ended</dt><dd>{viewing.is_open_ended ? 'Yes' : 'No'}</dd></div>
            <div><dt>Valid From</dt><dd>{fmtDate(viewing.effective_from)}</dd></div>
            <div><dt>Valid Until</dt><dd>{fmtDate(viewing.effective_until)}</dd></div>
          </dl>
        </Modal>
      )}
    </div>
  );
};
