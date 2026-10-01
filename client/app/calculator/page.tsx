
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/redux/hooks';
import { formatAmount } from '@/lib/utils/currency';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ProductOption {
  id: number;
  label: string;
}

interface PackagingOption {
  id: number;
  label: string;
  /** Package configuration (package type) this packaging can be used with */
  compatibleWith: string[];
}

export default function CalculatorPage() {
  const currency = useAppSelector(
    (state) => state.ui.selectedCurrency
  );

  const user = useAppSelector(
    (state) => state.auth.user
  );

  // ─────────────────────────────────────────────
  // Dropdown options (loaded from the backend)
  // ─────────────────────────────────────────────

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [packageTypes, setPackageTypes] = useState<string[]>([]);
  const [packagingList, setPackagingList] = useState<PackagingOption[]>([]);

  // ─────────────────────────────────────────────
  // Section 1: Product configuration
  // Numeric values are strings so inputs can be empty.
  // ─────────────────────────────────────────────

  const [productId, setProductId] = useState(0);
  const [packageId, setPackageId] = useState('');

  const [fillSize, setFillSize] = useState('20');
  const [finishedQty, setFinishedQty] = useState('500');

  // ─────────────────────────────────────────────
  // Section 2: Packaging selection
  // ─────────────────────────────────────────────

  const [packagingId, setPackagingId] = useState(0);
  const [purchaseQty, setPurchaseQty] = useState('1000');

  // ─────────────────────────────────────────────
  // Section 3: Additional costs
  // ─────────────────────────────────────────────

  const [printingCost, setPrintingCost] = useState('');
  const [setupCost, setSetupCost] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [shipping, setShipping] = useState('');
  const [discounts, setDiscounts] = useState('');

  // ─────────────────────────────────────────────
  // Backend result & UI feedback
  // ─────────────────────────────────────────────

  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Guards against out-of-order responses when several
  // (auto or manual) calculations are in flight at once.
  const requestSeq = useRef(0);

  const selectedProduct = products.find(
    (p) => p.id === productId
  );

  const selectedPackaging = packagingList.find(
    (p) => p.id === packagingId
  );

  const isCompatible = selectedPackaging
    ? selectedPackaging.compatibleWith.includes(packageId)
    : false;

  // ─────────────────────────────────────────────
  // Convert input string to number
  // ─────────────────────────────────────────────

  const toNumber = (value: string) => {
    return Math.max(0, Number(value) || 0);
  };

  // ─────────────────────────────────────────────
  // Build backend payload
  // ─────────────────────────────────────────────

  const buildPayload = () => ({
    productId,

    packageType: packageId,

    fillSize: toNumber(fillSize),

    finishedQuantity: toNumber(finishedQty),

    packagingId,

    packagingPurchaseQuantity: toNumber(purchaseQty),

    printingCost: toNumber(printingCost),

    setupCost: toNumber(setupCost),

    otherCosts: toNumber(otherCosts),

    shipping: toNumber(shipping),

    discount: toNumber(discounts),
  });

  // ─────────────────────────────────────────────
  // Cost summary
  // ─────────────────────────────────────────────

  const summary = {
    filledProductCost:
      result?.summary?.filledProductCost ?? 0,

    packagingInventoryCost:
      result?.summary?.packagingInventoryCost ?? 0,

    printingCost:
      result?.summary?.printingCost ?? 0,

    setupCost:
      result?.summary?.setupCost ?? 0,

    otherCosts:
      result?.summary?.otherCosts ?? 0,

    shipping:
      result?.summary?.shipping ?? 0,

    discounts:
      result?.summary?.discounts ?? 0,

    total:
      result?.summary?.estimatedProjectCost ?? 0,
  };

  // ─────────────────────────────────────────────
  // Save configuration
  // ─────────────────────────────────────────────

  const handleSave = () => {
    setSaved(true);
  };

  // ─────────────────────────────────────────────
  // Calculate
  // ─────────────────────────────────────────────

  const handleCalculate = async () => {
    setIsCalculating(true);
    setErrorMsg('');

    // Every call takes a ticket; only the newest one may
    // write to state, so slow responses cannot clobber newer ones.
    const seq = ++requestSeq.current;

    try {
      const res = await fetch(
        `${API_URL}/calculator/calculate`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify(buildPayload()),
        }
      );

      const json = await res.json();

      if (seq !== requestSeq.current) {
        return;
      }

      if (res.ok && json.success) {
        setResult(json.data);
      } else {
        setResult(null);

        setErrorMsg(
          json.message || 'Unable to calculate cost.'
        );
      }
    } catch {
      if (seq !== requestSeq.current) {
        return;
      }

      setResult(null);

      setErrorMsg(
        'Unable to connect to the server.'
      );
    } finally {
      if (seq === requestSeq.current) {
        setIsCalculating(false);
      }
    }
  };

  // ─────────────────────────────────────────────
  // Request quotation
  // ─────────────────────────────────────────────

  const handleRequestQuote = async () => {
    setIsSubmittingQuote(true);
    setQuoteMsg('');

    try {
      const res = await fetch(
        `${API_URL}/calculator/requests`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            ...buildPayload(),

            userId: user?.id ?? null,

            productName:
              selectedProduct?.label,

            packagingName:
              selectedPackaging?.label,

            productCost:
              result?.product?.total ?? 0,

            packagingCost:
              result?.packaging?.total ?? 0,

            estimatedProjectCost:
              summary.total,
          }),
        }
      );

      const json = await res.json();

      setQuoteMsg(
        res.ok && json.success
          ? 'Quotation request submitted successfully.'
          : json.message ||
            'Unable to submit quotation request.'
      );
    } catch {
      setQuoteMsg(
        'Unable to connect to the server.'
      );
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // ─────────────────────────────────────────────
  // Load dropdown options from the backend
  // ─────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/calculator/options`
        );

        const json = await res.json();

        if (!res.ok || !json.success) return;

        const prods: ProductOption[] = (
          json.data.products || []
        ).map((p: any) => ({
          id: Number(p.id),
          label: p.name,
        }));

        const pkgs: PackagingOption[] = (
          json.data.packaging || []
        ).map((p: any) => ({
          id: Number(p.id),
          label: p.name,
          compatibleWith: [p.packaging_type],
        }));

        const types: string[] = Array.from(
          new Set<string>(
            (json.data.packaging || []).map(
              (p: any) => String(p.packaging_type)
            )
          )
        );

        setProducts(prods);
        setPackagingList(pkgs);
        setPackageTypes(types);

        if (prods.length > 0) {
          setProductId(prods[0].id);
        }

        if (pkgs.length > 0) {
          setPackagingId(pkgs[0].id);
        }

        if (types.length > 0) {
          setPackageId(types[0]);
        }
      } catch {
        // options unavailable — summary stays empty
      }
    })();
  }, []);

  // ─────────────────────────────────────────────
  // Auto calculate when values change
  // ─────────────────────────────────────────────

  useEffect(() => {
    // The configuration is only complete once every value the
    // backend requires has been provided.
    const isComplete =
      productId &&
      packagingId &&
      packageId &&
      fillSize &&
      finishedQty &&
      purchaseQty &&
      Number(fillSize) > 0 &&
      Number(finishedQty) > 0 &&
      Number(purchaseQty) > 0;

    // Incomplete form — clear any stale estimate so the summary
    // never shows numbers that no longer match the inputs.
    if (!isComplete) {
      // Invalidate any in-flight calculation so a late response
      // cannot repopulate the summary after the inputs changed.
      requestSeq.current++;
      setResult(null);
      setIsCalculating(false);
      return;
    }

    // Give instant feedback, then debounce the real request so we
    // do not fire one call per keystroke.
    setIsCalculating(true);

    const timer = setTimeout(() => {
      handleCalculate();
    }, 400);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productId,
    packageId,
    fillSize,
    finishedQty,
    packagingId,
    purchaseQty,
    printingCost,
    setupCost,
    otherCosts,
    shipping,
    discounts,
  ]);

  return (
    <div className="cost-calc-page">

      {/* ─────────────────────────────────────── */}
      {/* Top Breadcrumb */}
      {/* ─────────────────────────────────────── */}

      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>

          <span className="sep">/</span>

          <span className="current">
            Cost Calculator
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────── */}
      {/* Hero */}
      {/* ─────────────────────────────────────── */}

      <section className="cost-calc-hero">
        <div className="cost-calc-hero__content">

          <span className="cost-calc-hero__eyebrow">
            Private Label Shilajit
          </span>

          <h1 className="cost-calc-hero__title">
            Configuration &amp; Cost Calculator
          </h1>

          <p className="cost-calc-hero__desc">
            Configure your product, select packaging,
            and get an instant cost estimate.
            Save your configuration or add it to a
            bucket for a complete quote.
          </p>

        </div>
      </section>

      {/* ─────────────────────────────────────── */}
      {/* Main */}
      {/* ─────────────────────────────────────── */}

      <div className="cost-calc-container">

        <div className="cost-calc-grid">

          {/* ─────────────────────────────────── */}
          {/* LEFT PANEL */}
          {/* ─────────────────────────────────── */}

          <div className="cost-calc-panel">

            {/* Section 1 */}

            <div className="cost-calc-section">

              <div className="cost-calc-section__head">

                <span className="cost-calc-section__num">
                  1
                </span>

                <div>
                  <h2 className="cost-calc-section__title">
                    Product Configuration
                  </h2>

                  <p className="cost-calc-section__subtitle">
                    Select your product, package,
                    and fill details to get accurate pricing.
                  </p>
                </div>

              </div>

              <div className="cost-calc-fields">

                {/* Product */}

                <div className="cost-calc-field">

                  <label
                    className="cost-calc-field__label"
                    htmlFor="cc-product"
                  >
                    Product
                  </label>

                  <div className="cost-calc-field__control cost-calc-field__control--select">

                    <span className="cost-calc-field__icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="3"
                          y="7"
                          width="18"
                          height="13"
                          rx="2"
                        />

                        <path d="M3 11h18M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </span>

                    <select
                      id="cc-product"
                      className="cost-calc-field__select"
                      value={productId}
                      onChange={(e) =>
                        setProductId(
                          Number(e.target.value)
                        )
                      }
                    >
                      {products.map(
                        (option) => (
                          <option
                            key={option.id}
                            value={option.id}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>

                  </div>
                </div>

                {/* Package */}

                <div className="cost-calc-field">

                  <label
                    className="cost-calc-field__label"
                    htmlFor="cc-package"
                  >
                    Package Configuration
                  </label>

                  <div className="cost-calc-field__control cost-calc-field__control--select">

                    <span className="cost-calc-field__icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="6"
                          y="3"
                          width="12"
                          height="18"
                          rx="2"
                        />

                        <path d="M6 8h12M9 3v18" />
                      </svg>
                    </span>

                    <select
                      id="cc-package"
                      className="cost-calc-field__select"
                      value={packageId}
                      onChange={(e) =>
                        setPackageId(e.target.value)
                      }
                    >
                      {packageTypes.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        )
                      )}
                    </select>

                  </div>
                </div>

                {/* Fill Size */}

                <div className="cost-calc-field">

                  <label
                    className="cost-calc-field__label"
                    htmlFor="cc-fill"
                  >
                    Fill Size / Strength
                  </label>

                  <div className="cost-calc-field__control">

                    <input
                      id="cc-fill"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="20"
                      className="cost-calc-field__input"
                      value={fillSize}
                      onChange={(e) =>
                        setFillSize(e.target.value)
                      }
                    />

                    <span className="cost-calc-field__suffix">
                      g
                    </span>

                  </div>
                </div>

                {/* Finished Quantity */}

                <div className="cost-calc-field">

                  <label
                    className="cost-calc-field__label"
                    htmlFor="cc-finished"
                  >
                    Finished Quantity
                  </label>

                  <div className="cost-calc-field__control">

                    <input
                      id="cc-finished"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="100"
                      className="cost-calc-field__input"
                      value={finishedQty}
                      onChange={(e) =>
                        setFinishedQty(e.target.value)
                      }
                    />

                    <span className="cost-calc-field__suffix">
                      pcs
                    </span>

                  </div>
                </div>

              </div>
            </div>

            {/* ──────────────────────────────── */}
            {/* Section 2 */}
            {/* ──────────────────────────────── */}

            <div className="cost-calc-section">

              <div className="cost-calc-section__head">

                <span className="cost-calc-section__num">
                  2
                </span>

                <div>

                  <h2 className="cost-calc-section__title">
                    Packaging Selection
                  </h2>

                  <p className="cost-calc-section__subtitle">
                    Choose compatible packaging
                    and enter the purchase quantities.
                  </p>

                </div>

              </div>

              <div className="cost-calc-fields">

                {/* Packaging Type */}

                <div className="cost-calc-field">

                  <label
                    className="cost-calc-field__label"
                    htmlFor="cc-packaging"
                  >
                    Packaging Type
                  </label>

                  <div className="cost-calc-field__control cost-calc-field__control--select">

                    <span className="cost-calc-field__icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="4"
                          y="4"
                          width="16"
                          height="16"
                          rx="2"
                        />

                        <path d="M4 9h16M9 4v16" />
                      </svg>
                    </span>

                    <select
                      id="cc-packaging"
                      className="cost-calc-field__select"
                      value={packagingId}
                      onChange={(e) =>
                        setPackagingId(
                          Number(e.target.value)
                        )
                      }
                    >
                      {packagingList.map(
                        (option) => (
                          <option
                            key={option.id}
                            value={option.id}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>

                  </div>
                </div>

                {/* Purchase Quantity */}

                <div className="cost-calc-field">

                  <label
                    className="cost-calc-field__label"
                    htmlFor="cc-purchase"
                  >
                    Purchase Quantity
                  </label>

                  <div className="cost-calc-field__control">

                    <input
                      id="cc-purchase"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="1000"
                      className="cost-calc-field__input"
                      value={purchaseQty}
                      onChange={(e) =>
                        setPurchaseQty(e.target.value)
                      }
                    />

                    <span className="cost-calc-field__suffix">
                      pcs
                    </span>

                  </div>
                </div>

              </div>

              {/* Compatibility */}

              <div className="cost-calc-note">

                <div
                  className={`cost-calc-note__item ${
                    isCompatible
                      ? ''
                      : 'cost-calc-note__item--warn'
                  }`}
                >

                  <span className="cost-calc-note__badge">

                    {isCompatible ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                        />

                        <path d="M12 8v5M12 16h.01" />
                      </svg>
                    )}

                  </span>

                  {isCompatible
                    ? 'Compatible with selected product'
                    : 'Not compatible with the selected package configuration'}

                </div>

                <div className="cost-calc-note__item cost-calc-note__item--muted">

                  <span className="cost-calc-note__badge cost-calc-note__badge--muted">

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                      />

                      <path d="M12 11v5M12 8h.01" />
                    </svg>

                  </span>

                  You can purchase more packaging
                  than immediately required.

                </div>

              </div>

            </div>

            {/* ──────────────────────────────── */}
            {/* Section 3 */}
            {/* ──────────────────────────────── */}

            <div className="cost-calc-section">

              <div className="cost-calc-section__head">

                <span className="cost-calc-section__num">
                  3
                </span>

                <div>

                  <h2 className="cost-calc-section__title">
                    Additional Costs (Optional)
                  </h2>

                  <p className="cost-calc-section__subtitle">
                    Add any extra costs like printing,
                    setup, shipping, or discounts.
                  </p>

                </div>

              </div>

              <div className="cost-calc-fields cost-calc-fields--five">

                {[
                  {
                    id: 'cc-printing',
                    label: 'Printing Cost',
                    value: printingCost,
                    set: setPrintingCost,
                  },
                  {
                    id: 'cc-setup',
                    label: 'Setup Cost',
                    value: setupCost,
                    set: setSetupCost,
                  },
                  {
                    id: 'cc-other',
                    label: 'Other Costs',
                    value: otherCosts,
                    set: setOtherCosts,
                  },
                  {
                    id: 'cc-shipping',
                    label: 'Shipping',
                    value: shipping,
                    set: setShipping,
                  },
                  {
                    id: 'cc-discounts',
                    label: 'Discounts',
                    value: discounts,
                    set: setDiscounts,
                  },
                ].map((field) => (
                  <div
                    className="cost-calc-field"
                    key={field.id}
                  >

                    <label
                      className="cost-calc-field__label"
                      htmlFor={field.id}
                    >
                      {field.label}
                    </label>

                    <div className="cost-calc-field__control">

                      <span className="cost-calc-field__affix">
                        Rs
                      </span>

                      <input
                        id={field.id}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        className="cost-calc-field__input cost-calc-field__input--prefixed"
                        value={field.value}
                        onChange={(e) =>
                          field.set(e.target.value)
                        }
                      />

                    </div>

                  </div>
                ))}

              </div>

            </div>

            {/* ──────────────────────────────── */}
            {/* Actions */}
            {/* ──────────────────────────────── */}

            <div className="cost-calc-actions">

              <button
                type="button"
                className="cost-calc-btn cost-calc-btn--ghost"
                onClick={handleSave}
              >

                <span className="cost-calc-btn__icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />

                    <path d="M17 21v-8H7v8M7 3v5h8" />
                  </svg>

                </span>

                {saved
                  ? 'Configuration Saved'
                  : 'Save Configuration'}

              </button>

              <button
                type="button"
                className="cost-calc-btn cost-calc-btn--primary"
                onClick={handleCalculate}
                disabled={isCalculating}
              >

                {isCalculating
                  ? 'Calculating…'
                  : 'Calculate Cost'}

                <span className="cost-calc-btn__icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>

                </span>

              </button>

            </div>

            {errorMsg && (
              <p className="cost-calc-error">
                {errorMsg}
              </p>
            )}

          </div>

          {/* ─────────────────────────────────── */}
          {/* COST SUMMARY */}
          {/* ─────────────────────────────────── */}

          <aside className="cost-calc-summary">

            <div className="cost-calc-summary__head">

              <h2 className="cost-calc-summary__title">
                Cost Summary
              </h2>

              <span
                className={`cost-calc-summary__badge ${
                  isCalculating
                    ? 'cost-calc-summary__badge--busy'
                    : result
                    ? 'cost-calc-summary__badge--live'
                    : 'cost-calc-summary__badge--idle'
                }`}
              >
                {isCalculating
                  ? 'Updating…'
                  : result
                  ? 'Live'
                  : 'Awaiting input'}
              </span>

            </div>

            {!result && (
              <div className="cost-calc-summary__empty">

                <div className="cost-calc-summary__empty-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <rect
                      x="4"
                      y="2"
                      width="16"
                      height="20"
                      rx="2"
                    />

                    <path d="M8 6h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01M8 19h6" />
                  </svg>

                </div>

                <p className="cost-calc-summary__empty-title">
                  Complete the configuration form
                </p>

                <p className="cost-calc-summary__empty-text">
                  Your estimate updates automatically
                  as you enter values.
                </p>

              </div>
            )}

            <div className="cost-calc-summary__rows">

              <div className="cost-calc-summary__row">
                <span>Filled Product Cost</span>

                <span>
                  {formatAmount(
                    summary.filledProductCost,
                    currency
                  )}
                </span>
              </div>

              <div className="cost-calc-summary__row">
                <span>Packaging Inventory Cost</span>

                <span>
                  {formatAmount(
                    summary.packagingInventoryCost,
                    currency
                  )}
                </span>
              </div>

              <div className="cost-calc-summary__row">
                <span>Printing Cost</span>

                <span>
                  {formatAmount(
                    summary.printingCost,
                    currency
                  )}
                </span>
              </div>

              <div className="cost-calc-summary__row">
                <span>Setup Cost</span>

                <span>
                  {formatAmount(
                    summary.setupCost,
                    currency
                  )}
                </span>
              </div>

              <div className="cost-calc-summary__row">
                <span>Other Costs</span>

                <span>
                  {formatAmount(
                    summary.otherCosts,
                    currency
                  )}
                </span>
              </div>

              <div className="cost-calc-summary__row">
                <span>Shipping</span>

                <span>
                  {formatAmount(
                    summary.shipping,
                    currency
                  )}
                </span>
              </div>

              <div className="cost-calc-summary__row">
                <span>Discounts</span>

                <span>
                  −{' '}
                  {formatAmount(
                    summary.discounts,
                    currency
                  )}
                </span>
              </div>

            </div>

            <div className="cost-calc-summary__total">

              <span>
                Estimated Project Cost
              </span>

              <span>
                {formatAmount(
                  summary.total,
                  currency
                )}
              </span>

            </div>

            <div className="cost-calc-summary__actions">

              <button
                type="button"
                className="cost-calc-btn cost-calc-btn--ghost cost-calc-btn--block"
              >

                <span className="cost-calc-btn__icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M4 10h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 10z" />

                    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
                  </svg>

                </span>

                Add to Bucket

              </button>

              <button
                type="button"
                className="cost-calc-btn cost-calc-btn--dark cost-calc-btn--block"
                onClick={handleRequestQuote}
                disabled={isSubmittingQuote}
              >

                <span className="cost-calc-btn__icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path d="m3 7 9 6 9-6" />
                  </svg>

                </span>

                {isSubmittingQuote
                  ? 'Submitting…'
                  : 'Request a Quotation'}

              </button>

            </div>

            {quoteMsg && (
              <p className="cost-calc-note-msg">
                {quoteMsg}
              </p>
            )}

            <p className="cost-calc-summary__note">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path d="M12 11v5M12 8h.01" />
              </svg>

              Backend calculations are authoritative.

            </p>

          </aside>

        </div>

      </div>

    </div>
  );
}

