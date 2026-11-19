'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart, addToCartDb } from '@/lib/redux/slices/cartSlice';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface BulkTier {
  id: number;
  min_qty: number;
  discount_pct: number;
  label: string;
}

interface PackagingItem {
  id: number;
  name: string;
  description: string;
  price_pkr: number;
  image_url: string | null;
}

interface Props {
  product: {
    id: string | number;
    name: string;
    price: number;
    image?: string;
  };
}

export default function BulkOrderSection({ product }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const ui = useAppSelector((s) => (s as any).ui) || {};
  const rate: number = ui.currencyRate || 1;
  const currency: string = ui.selectedCurrency || 'PKR';

  const [tiers, setTiers] = useState<BulkTier[]>([]);
  const [packagingItems, setPackagingItems] = useState<PackagingItem[]>([]);
  const [qty, setQty] = useState(1);
  const [selectedPkg, setSelectedPkg] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'added' | 'buying'>('idle');

  useEffect(() => {
    fetch(`${API}/api/packaging/bulk-tiers`)
      .then((r) => r.json()).then((d) => setTiers(d.data || [])).catch(() => {});
    fetch(`${API}/api/packaging`)
      .then((r) => r.json()).then((d) => setPackagingItems(d.data || [])).catch(() => {});
  }, []);

  /* ── derived values ── */
  const activeTier = [...tiers].reverse().find((t) => qty >= t.min_qty) ?? null;
  const nextTier = tiers.find((t) => qty < t.min_qty) ?? null;
  const discountPct = activeTier?.discount_pct ?? 0;
  const unitBase = product.price;
  const unitDiscounted = unitBase * (1 - discountPct / 100);
  const pkgTotal = selectedPkg.reduce((s, pid) => {
    const p = packagingItems.find((x) => x.id === pid);
    return s + (p ? p.price_pkr : 0);
  }, 0);
  const lineTotal = unitDiscounted * qty + pkgTotal;
  const savings = (unitBase - unitDiscounted) * qty;

  /* ── tier progress bar ── */
  const progressPct = (() => {
    if (!tiers.length) return 0;
    const maxTier = tiers[tiers.length - 1];
    return Math.min(100, Math.round((qty / maxTier.min_qty) * 100));
  })();

  /* ── currency formatter ── */
  const fmt = (pkr: number) => {
    const val = pkr * rate;
    if (currency === 'PKR') return `₨${Math.round(val).toLocaleString('en-PK')}`;
    return `${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /* ── quantity helpers ── */
  const changeQty = (val: number) => setQty(Math.max(1, val));

  /* ── cart dispatch ── */
  const dispatchItems = () => {
    if (isAuthenticated) {
      dispatch(addToCartDb({ id: String(product.id), quantity: qty }));
      selectedPkg.forEach((pid) =>
        dispatch(addToCartDb({ id: `pkg-${pid}`, quantity: 1 }))
      );
    } else {
      // single dispatch with quantity — cartSlice addToCart supports quantity field
      dispatch(addToCart({
        id: String(product.id),
        name: product.name,
        price: unitDiscounted,
        image: product.image || '',
        quantity: qty,
      }));
      selectedPkg.forEach((pid) => {
        const p = packagingItems.find((x) => x.id === pid)!;
        dispatch(addToCart({ id: `pkg-${p.id}`, name: p.name, price: p.price_pkr, image: p.image_url || '', quantity: 1 }));
      });
    }
  };

  const handleAddToCart = () => {
    dispatchItems();
    setStatus('added');
    setTimeout(() => setStatus('idle'), 2500);
  };

  const handleBuyNow = () => {
    dispatchItems();
    router.push('/cart');
  };

  return (
    <div className="bos">
      {/* ── header ── */}
      <div className="bos__head">
        <div className="bos__head-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <span>Choose Your Product</span>
        </div>
        {tiers.length > 0 && (
          <span className="bos__head-badge">Bulk Discounts Available</span>
        )}
      </div>

      {/* ── quantity field ── */}
      <div className="bos__qty-block">
        <label className="bos__qty-label">
          Quantity
          {nextTier && (
            <span className="bos__qty-hint">
              Add {nextTier.min_qty - qty} more → unlock {nextTier.discount_pct}% off
            </span>
          )}
        </label>

        <div className="bos__qty-row">
          <div className="bos__qty-ctrl">
            <button
              type="button"
              className="bos__qty-btn"
              onClick={() => changeQty(qty - 1)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => changeQty(parseInt(e.target.value) || 1)}
              className="bos__qty-input"
              aria-label="Bulk quantity"
            />
            <button
              type="button"
              className="bos__qty-btn"
              onClick={() => changeQty(qty + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* quick-pick buttons */}
          <div className="bos__quick-picks">
            {[5, 10, 20, 50].map((n) => (
              <button
                key={n}
                type="button"
                className={`bos__quick-btn ${qty === n ? 'bos__quick-btn--active' : ''}`}
                onClick={() => changeQty(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* tier progress bar */}
        {tiers.length > 0 && (
          <div className="bos__progress-wrap">
            <div className="bos__progress-bar">
              <div className="bos__progress-fill" style={{ width: `${progressPct}%` }} />
              {tiers.map((t) => {
                const pos = Math.min(100, Math.round((t.min_qty / tiers[tiers.length - 1].min_qty) * 100));
                return (
                  <div
                    key={t.id}
                    className={`bos__progress-marker ${qty >= t.min_qty ? 'bos__progress-marker--hit' : ''}`}
                    style={{ left: `${pos}%` }}
                    title={t.label}
                  >
                    <span className="bos__progress-marker-label">{t.min_qty}+</span>
                  </div>
                );
              })}
            </div>
            <div className="bos__tier-pills">
              {tiers.map((t) => (
                <div
                  key={t.id}
                  className={`bos__tier-pill ${qty >= t.min_qty ? 'bos__tier-pill--active' : ''}`}
                >
                  <span className="bos__tier-pill-qty">{t.min_qty}+</span>
                  <span className="bos__tier-pill-pct">{t.discount_pct}% off</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── packaging add-ons ── */}
      {packagingItems.length > 0 && (
        <div className="bos__pkg">
          <p className="bos__pkg-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Add Packaging
          </p>
          <div className="bos__pkg-grid">
            {packagingItems.map((pkg) => {
              const on = selectedPkg.includes(pkg.id);
              return (
                <button
                  key={pkg.id}
                  type="button"
                  className={`bos__pkg-card ${on ? 'bos__pkg-card--on' : ''}`}
                  onClick={() =>
                    setSelectedPkg((prev) =>
                      prev.includes(pkg.id) ? prev.filter((x) => x !== pkg.id) : [...prev, pkg.id]
                    )
                  }
                >
                  {on && <span className="bos__pkg-check">✓</span>}
                  <span className="bos__pkg-icon">{pkg.image_url
                    ? <img src={pkg.image_url} alt={pkg.name} className="bos__pkg-img" />
                    : '🎁'}
                  </span>
                  <span className="bos__pkg-name">{pkg.name}</span>
                  <span className="bos__pkg-price">+{fmt(pkg.price_pkr)}</span>
                  {pkg.description && (
                    <span className="bos__pkg-desc">{pkg.description}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── price breakdown ── */}
      <div className="bos__breakdown">
        <div className="bos__breakdown-row">
          <span>Unit price</span>
          <span>
            {discountPct > 0
              ? <><s className="bos__strike">{fmt(unitBase)}</s> <strong className="bos__discounted">{fmt(unitDiscounted)}</strong></>
              : <strong>{fmt(unitBase)}</strong>
            }
          </span>
        </div>
        <div className="bos__breakdown-row">
          <span>× {qty} units</span>
          <span>{fmt(unitDiscounted * qty)}</span>
        </div>
        {pkgTotal > 0 && (
          <div className="bos__breakdown-row">
            <span>Packaging</span>
            <span>+{fmt(pkgTotal)}</span>
          </div>
        )}
        {savings > 0 && (
          <div className="bos__breakdown-row bos__breakdown-row--saving">
            <span>🎉 You save</span>
            <span>−{fmt(savings)}</span>
          </div>
        )}
        <div className="bos__breakdown-row bos__breakdown-row--total">
          <span>Total</span>
          <strong>{fmt(lineTotal)}</strong>
        </div>
      </div>

      {/* ── action buttons ── */}
      <div className="bos__actions">
        <button
          type="button"
          className={`bos__btn-cart ${status === 'added' ? 'bos__btn-cart--done' : ''}`}
          onClick={handleAddToCart}
          disabled={status === 'added'}
        >
          {status === 'added'
            ? <><span>✓</span> Added {qty} to Cart</>
            : <><span>🛒</span> Add {qty} to Cart</>
          }
        </button>
        <button
          type="button"
          className="bos__btn-buy"
          onClick={handleBuyNow}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
