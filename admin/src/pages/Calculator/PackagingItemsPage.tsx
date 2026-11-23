import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../components/common/Toast';
import {
  calculatorAdminApi,
  AdminPackaging,
  AdminPricingTier,
} from '../../services/calculatorAdmin.api';
import {
  Package,
  Utensils,
  Pipette,
  Container,
  Tag,
  MoreHorizontal,
  Plus,
  Pencil,
  Eye,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { CalculatorImageUpload } from './CalculatorImageUpload';
import './PackagingItemsPage.css';

type CatId = 'spoons' | 'boxes' | 'tubes' | 'jars' | 'labels' | 'other';

const CATS: { id: CatId; label: string; icon: React.ReactNode }[] = [
  { id: 'spoons', label: 'Spoons', icon: <Utensils /> },
  { id: 'boxes', label: 'Boxes', icon: <Package /> },
  { id: 'tubes', label: 'Tubes', icon: <Pipette /> },
  { id: 'jars', label: 'Jars', icon: <Container /> },
  { id: 'labels', label: 'Labels', icon: <Tag /> },
  { id: 'other', label: 'Other Items', icon: <MoreHorizontal /> },
];

const PAGE_SIZE = 10;

interface PackagingItemsPageProps {
  embedded?: boolean;
  refreshKey?: number;
  onDataChange?: () => void;
}

/* Groups an item into a category tab from its type / name */
const catOf = (p: any): CatId => {
  const s = `${p.type || ''} ${p.name || ''}`.toLowerCase();
  if (s.includes('spoon')) return 'spoons';
  if (s.includes('tube')) return 'tubes';
  if (s.includes('jar')) return 'jars';
  if (s.includes('label')) return 'labels';
  if (s.includes('box')) return 'boxes';
  return 'other';
};

const imgOf = (p: any): string => p.image_url || p.image || p.thumbnail_url || '';
const money = (v: number) => `Rs. ${Number(v).toLocaleString()}`;

const weightOf = (p: any): string => {
  if (p.estimated_weight) return String(p.estimated_weight);
  if (p.weight_min != null && p.weight_max != null) return `${p.weight_min} – ${p.weight_max} g`;
  return '–';
};

/* ───────────── presentational pieces (outside the page so inputs keep focus) ───────────── */

const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`pk-status ${active ? '' : 'pk-status--off'}`}>{active ? 'Active' : 'Inactive'}</span>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, onClose, footer, children }) => (
  <div className="pk-backdrop">
    <div className="pk-modal">
      <div className="pk-modal__head admin-form-header">
        <h3 className="pk-modal__title">{title}</h3>
        <button type="button" className="pk-modal__close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>
      {children}
      <div className="pk-modal__foot">{footer}</div>
    </div>
  </div>
);

const Thumb: React.FC<{ item: any; className?: string }> = ({ item, className = '' }) =>
  imgOf(item) ? (
    <div className={`pk-thumb ${className}`}>
      <img src={imgOf(item)} alt={item.name} />
    </div>
  ) : (
    <div className={`pk-thumb pk-thumb--empty ${className}`}>
      <Package />
    </div>
  );

const ItemFields: React.FC<{
  value: any;
  onChange: (v: any) => void;
  onImageUploadingChange: (uploading: boolean) => void;
}> = ({ value, onChange, onImageUploadingChange }) => (
  <div className="pk-form">
    <div>
      <label className="pk-label">Item Name</label>
      <input className="pk-input" value={value.name || ''} onChange={(e) => onChange({ ...value, name: e.target.value })} />
    </div>
    <div className="pk-grid-2">
      <div>
        <label className="pk-label">Type</label>
        <select className="pk-input" value={value.type || 'container'} onChange={(e) => onChange({ ...value, type: e.target.value })}>
          <option value="spoon">Spoon</option>
          <option value="outer_box">Box</option>
          <option value="tube">Tube</option>
          <option value="jar">Jar</option>
          <option value="label">Label</option>
          <option value="container">Container</option>
          <option value="brochure">Brochure</option>
        </select>
      </div>
      <div>
        <label className="pk-label">MOQ</label>
        <input type="number" className="pk-input" value={value.moq ?? 0} onChange={(e) => onChange({ ...value, moq: Number(e.target.value) })} />
      </div>
    </div>
    <div className="pk-grid-2">
      <div>
        <label className="pk-label">Fixed Unit Price (Rs. or blank)</label>
        <input
          type="number"
          className="pk-input"
          placeholder="Leave empty for tiered"
          value={value.unit_price ?? ''}
          onChange={(e) => onChange({ ...value, unit_price: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
      <div>
        <label className="pk-label">Estimated Weight</label>
        <input
          className="pk-input"
          placeholder="10 – 15 g"
          value={value.estimated_weight || ''}
          onChange={(e) => onChange({ ...value, estimated_weight: e.target.value })}
        />
      </div>
    </div>
    <div>
      <label className="pk-label">Item Image</label>
      <CalculatorImageUpload
        value={value.image_url}
        onChange={(imageUrl) => onChange({ ...value, image_url: imageUrl || null })}
        onUploadingChange={onImageUploadingChange}
      />
    </div>
    <div>
      <label className="pk-label">Dieline URL</label>
      <input className="pk-input" placeholder="/dielines/item.pdf" value={value.dieline_url || ''} onChange={(e) => onChange({ ...value, dieline_url: e.target.value })} />
    </div>
    <div>
      <label className="pk-label">Technical Specifications</label>
      <textarea rows={2} className="pk-input" value={value.technical_specs || ''} onChange={(e) => onChange({ ...value, technical_specs: e.target.value })} />
    </div>
  </div>
);

/* ───────────── page ───────────── */

export const PackagingItemsPage: React.FC<PackagingItemsPageProps> = ({
  embedded = false,
  refreshKey,
  onDataChange,
}) => {
  const toast = useToast();
  const [items, setItems] = useState<AdminPackaging[]>([]);
  const [tiers, setTiers] = useState<AdminPricingTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cat, setCat] = useState<CatId>('spoons');
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState('PKR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [draft, setDraft] = useState<any>({ name: '', type: 'spoon', moq: 0, unit_price: null, is_active: true });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pkgs, tierList] = await Promise.all([
        calculatorAdminApi.getPackaging(),
        calculatorAdminApi.getPricingTiers(),
      ]);
      setItems(pkgs);
      setTiers(tierList);
    } catch (err: any) {
      toast.error('Failed to load packaging items: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const counts = useMemo(() => {
    const c: Record<CatId, number> = { spoons: 0, boxes: 0, tubes: 0, jars: 0, labels: 0, other: 0 };
    items.forEach((p) => (c[catOf(p)] += 1));
    return c;
  }, [items]);

  const filtered = useMemo(() => items.filter((p) => catOf(p) === cat), [items, cat]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  /* quantity slabs + price come from the item's active pricing tiers */
  const tiersFor = (p: AdminPackaging) =>
    tiers
      .filter((t) => t.entity_type === 'packaging' && t.entity_id === p.id && t.is_active)
      .sort((a, b) => a.min_quantity - b.min_quantity);

  const slabsOf = (p: AdminPackaging): string => {
    const t = tiersFor(p);
    if (!t.length) return `${Number(p.moq).toLocaleString()}+ pcs`;
    const lo = t[0].min_quantity;
    if (t.some((x) => x.is_open_ended)) return `${Number(lo).toLocaleString()}+ pcs`;
    const hi = Math.max(...t.map((x) => Number(x.max_quantity)));
    return `${Number(lo).toLocaleString()} – ${hi.toLocaleString()} pcs`;
  };

  const priceOf = (p: AdminPackaging): string => {
    if (p.unit_price !== null && p.unit_price !== undefined) return money(p.unit_price);
    const t = tiersFor(p);
    return t.length ? money(t[0].rate) : '–';
  };

  const handleSave = async () => {
    if (!editing || isImageUploading) return;
    try {
      await calculatorAdminApi.updatePackaging(editing.id, editing);
      toast.success('Packaging item updated successfully.');
      setEditing(null);
      loadData();
      onDataChange?.();
    } catch (err: any) {
      toast.error('Failed to update packaging: ' + err.message);
    }
  };

  const handleCreate = async () => {
    if (isImageUploading) return;
    try {
      await calculatorAdminApi.createPackaging(draft);
      toast.success('Packaging item created.');
      setIsAdding(false);
      setDraft({ name: '', type: 'spoon', moq: 0, unit_price: null, is_active: true });
      loadData();
      onDataChange?.();
    } catch (err: any) {
      toast.error('Failed to create item: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this packaging item?')) return;
    try {
      await calculatorAdminApi.deletePackaging(id);
      toast.success('Packaging item removed.');
      loadData();
      onDataChange?.();
    } catch (err: any) {
      toast.error('Failed to delete item: ' + err.message);
    }
  };

  const pickCat = (id: CatId) => {
    setCat(id);
    setPage(1);
  };

  const TYPE_OF_CAT: Record<CatId, string> = { spoons: 'spoon', boxes: 'outer_box', tubes: 'tube', jars: 'jar', labels: 'label', other: 'container' };
  const openAdd = () => {
    setDraft({ name: '', type: TYPE_OF_CAT[cat], moq: 0, unit_price: null, is_active: true });
    setIsAdding(true);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pk-page">
      {/* Header */}
      {!embedded && (
      <div className="pk-header">
        <div>
          <h1 className="pk-title">
            <span className="pk-title__icon">
              <Package />
            </span>
            Packaging Items Management
          </h1>
          <p className="pk-subtitle">
            Manage packaging items, set quantity slabs, pricing and estimated weights for different products.
          </p>
        </div>
        <button type="button" className="pk-pill pk-pill--outline" onClick={loadData}>
          <RefreshCw className={isLoading ? 'pk-spin' : ''} />
          Refresh
        </button>
      </div>
      )}

      {/* Category tabs */}
      <div className="pk-tabs">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`pk-tab ${cat === c.id ? 'pk-tab--active' : ''}`}
            onClick={() => pickCat(c.id)}
          >
            {c.icon}
            {c.label} ({counts[c.id]})
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="pk-card">
        <div className="pk-toolbar">
          <button type="button" className="pk-pill pk-pill--green" onClick={openAdd}>
            <Plus />
            Add Item
          </button>
          <div className="pk-cur">
            <button type="button" className="pk-pill pk-pill--outline" onClick={() => setCurrencyOpen((o) => !o)}>
              {currency}
              <span className="pk-caret">▼</span>
            </button>
            {currencyOpen && (
              <ul className="pk-cur__menu">
                {['PKR', 'USD', 'AED'].map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className={`pk-cur__item ${c === currency ? 'pk-cur__item--active' : ''}`}
                      onClick={() => {
                        setCurrency(c);
                        setCurrencyOpen(false);
                      }}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="pk-table-wrap">
          <table className="pk-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Item Name</th>
                <th>Quantity Slabs</th>
                <th>Price per Piece</th>
                <th>Estimated Weight</th>
                <th>Status</th>
                <th className="pk-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="pk-empty">
                    No items in this category yet. Use Add Item to create one.
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="pk-id">#{p.id}</td>
                  <td>
                    <Thumb item={p} />
                  </td>
                  <td className="pk-name">{p.name}</td>
                  <td>{slabsOf(p)}</td>
                  <td>{priceOf(p)}</td>
                  <td>{weightOf(p)}</td>
                  <td>
                    <StatusPill active={Boolean(p.is_active)} />
                  </td>
                  <td>
                    <div className="pk-actions">
                      <button type="button" className="pk-action" onClick={() => setEditing({ ...p })}>
                        <Pencil />
                        Edit
                      </button>
                      <span className="pk-divider" />
                      <button type="button" className="pk-action" onClick={() => setViewing(p)}>
                        <Eye />
                        View
                      </button>
                      <span className="pk-divider" />
                      <button type="button" className="pk-action pk-action--danger" onClick={() => handleDelete(p.id)} aria-label="Delete">
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pk-footer">
          <span className="pk-footer__info">
            Showing {filtered.length ? start + 1 : 0} to {Math.min(start + PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length} items
          </span>
          <div className="pk-pager">
            <button type="button" className="pk-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
              <ChevronLeft />
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                className={`pk-page-btn ${n === page ? 'pk-page-btn--active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button type="button" className="pk-page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* ADD */}
      {isAdding && (
        <Modal
          title="Add Item"
          onClose={() => setIsAdding(false)}
          footer={
            <>
              <button type="button" className="pk-pill pk-pill--outline pk-pill--sm" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="button" className="pk-pill pk-pill--green pk-pill--sm" onClick={handleCreate} disabled={isImageUploading}>Create Item</button>
            </>
          }
        >
          <ItemFields value={draft} onChange={setDraft} onImageUploadingChange={setIsImageUploading} />
        </Modal>
      )}

      {/* EDIT */}
      {editing && (
        <Modal
          title={`Edit Item #${editing.id}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="pk-pill pk-pill--outline pk-pill--sm" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="pk-pill pk-pill--green pk-pill--sm" onClick={handleSave} disabled={isImageUploading}>Save Changes</button>
            </>
          }
        >
          <ItemFields value={editing} onChange={setEditing} onImageUploadingChange={setIsImageUploading} />
        </Modal>
      )}

      {/* VIEW */}
      {viewing && (
        <Modal
          title={`Item #${viewing.id}`}
          onClose={() => setViewing(null)}
          footer={<button type="button" className="pk-pill pk-pill--outline pk-pill--sm" onClick={() => setViewing(null)}>Close</button>}
        >
          <div className="pk-view__top">
            <Thumb item={viewing} />
            <div>
              <div className="pk-view__name">{viewing.name}</div>
              <StatusPill active={Boolean(viewing.is_active)} />
            </div>
          </div>
          <dl className="pk-dl">
            <div><dt>Quantity Slabs</dt><dd>{slabsOf(viewing)}</dd></div>
            <div><dt>Price per Piece</dt><dd>{priceOf(viewing)}</dd></div>
            <div><dt>Estimated Weight</dt><dd>{weightOf(viewing)}</dd></div>
            <div><dt>MOQ</dt><dd>{Number(viewing.moq).toLocaleString()} pcs</dd></div>
            <div className="pk-dl__full"><dt>Technical Specifications</dt><dd>{viewing.technical_specs || '–'}</dd></div>
          </dl>
        </Modal>
      )}
    </div>
  );
};
