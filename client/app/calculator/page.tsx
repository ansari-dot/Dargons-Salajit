'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import { formatAmountWithRate } from '@/lib/utils/currency';
import { resolveBackendImageUrl } from '@/lib/utils/image';
import { useToast } from '@/components/ui/Toast';
import './calculator.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  unit_type: string;
  moq: number;
  min_product_cost: number;
  description: string;
  image_url?: string | null;
}

interface CalculatorCurrency {
  code: string;
  name: string;
  isEnabled: boolean;
  ratePkrPerUnit: number;
  rateSource: string;
  rateUpdatedAt: string | null;
}

const productImageById: Record<number, string> = {
  1: '/popular_gold_jar.png',
  2: '/popular_drops.png',
  3: '/popular_capsules.png',
  4: '/popular_capsules.png',
};

interface ProductOptionItem {
  id: number;
  product_id: number;
  option_type: 'fill_size' | 'strength' | 'bottle_size';
  label: string;
  numeric_value: number;
  unit: string;
  fixed_price: number | null;
  is_default: boolean;
}

interface PackagingRule {
  id: number;
  product_id: number;
  packaging_id: number;
  component_type: 'required' | 'optional' | 'alternative';
  alternative_group: string | null;
  suggested_qty_rule: string;
  is_default: boolean;
  packaging_name: string;
  packaging_code: string;
  packaging_type: string;
  image_url?: string | null;
  moq: number;
  unit_price: number | null;
  dieline_url: string | null;
  capacity: string | null;
  technical_specs?: string | null;
}

interface PackagingBreakdownItem {
  packagingId: number;
  name: string;
  code: string;
  type: string;
  alternativeGroup: string | null;
  imageUrl?: string | null;
  moq: number;
  suggestedQuantity: number;
  requiredQuantity: number;
  purchasedQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  shortBy: number;
  minimumOrderNotice?: boolean;
  weightMinG: number | null;
  weightMaxG: number | null;
  weightExcludedFromEstimate: boolean;
  technicalSpecs?: string | null;
  unitPrice: number | null;
  totalCost: number | null;
  usedCost: number | null;
  remainingCost: number | null;
  pricingTier?: {
    minQuantity: number;
    maxQuantity: number | null;
    isOpenEnded: boolean;
    rate: number;
  } | null;
  nextCheaperTier: { minQuantity: number; rate: number } | null;
  dielineUrl: string | null;
  capacity: string | null;
}

const PackagingThumbnail = ({
  src,
  alt,
  isSpoon = false,
  type = '',
}: {
  src?: string | null;
  alt: string;
  isSpoon?: boolean;
  type?: string;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const description = `${type} ${alt}`.toLowerCase();
  const isSpoonItem = isSpoon || description.includes('spoon');
  const isTube = description.includes('tube');
  const isJar = description.includes('jar') || description.includes('bottle') || description.includes('container');
  const isLabel = description.includes('label');
  const isBrochure = description.includes('brochure') || description.includes('insert');
  const spoonColor = description.includes('gold')
    ? '#b88922'
    : description.includes('black')
      ? '#3d3d3d'
      : '#92989b';

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <span className="cost-calc-packaging-thumb">
      {src && !imageFailed ? (
        <img
          src={resolveBackendImageUrl(src)}
          alt={alt}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 72 42" fill="none" role="img" aria-label={alt}>
          {isSpoonItem ? (
            <>
              <ellipse cx="13" cy="22" rx="9" ry="6" transform="rotate(-18 13 22)" fill={spoonColor} />
              <path d="M21 19.5 63 7" stroke={spoonColor} strokeWidth="5" strokeLinecap="round" />
              <path d="M21 23 63 10.5" stroke="#fff" strokeOpacity=".6" strokeWidth="1" strokeLinecap="round" />
            </>
          ) : isTube ? (
            <>
              <rect x="25" y="6" width="22" height="31" rx="7" fill="#d8c49b" stroke="#87714a" strokeWidth="1.5" />
              <path d="M27 12h18M29 33h14" stroke="#87714a" strokeWidth="1.5" />
            </>
          ) : isJar ? (
            <>
              <rect x="24" y="5" width="24" height="8" rx="2" fill="#555" />
              <path d="M26 13h20v22a4 4 0 0 1-4 4h-12a4 4 0 0 1-4-4V13Z" fill="#b08b62" fillOpacity=".75" stroke="#775d3e" strokeWidth="1.5" />
              <path d="M28 22h16v7H28z" fill="#eee9dc" />
            </>
          ) : isLabel ? (
            <>
              <rect x="12" y="8" width="48" height="27" rx="4" fill="#f3edda" stroke="#9c8a60" strokeWidth="1.5" />
              <path d="M20 16h32M20 21h24M20 27h28" stroke="#8a7c5e" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : isBrochure ? (
            <>
              <path d="M20 5h24l10 10v22H20V5Z" fill="#f5f0df" stroke="#99885e" strokeWidth="1.5" />
              <path d="M44 5v11h10M26 22h22M26 27h18M26 32h14" stroke="#99885e" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="m12 13 24-9 24 9v20l-24 9-24-9V13Z" fill="#eee7d5" stroke="#897b5c" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m13 13 23 9 23-9M36 22v18" stroke="#897b5c" strokeWidth="1.5" strokeLinejoin="round" />
            </>
          )}
        </svg>
      )}
    </span>
  );
};

const PackagingDropdown = ({
  groupName,
  options,
  selectedId,
  isSpoon,
  onChange,
}: {
  groupName: string;
  options: PackagingRule[];
  selectedId: number | null;
  isSpoon: boolean;
  onChange: (packagingId: number | null) => void;
}) => {
  const dropdownId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.packaging_id === selectedId);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isOpen]);

  const openAt = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, options.length));
    setIsOpen(true);
    requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  };

  const moveFocus = (index: number, direction: -1 | 1) => {
    const optionCount = options.length + 1;
    const nextIndex = (index + direction + optionCount) % optionCount;
    optionRefs.current[nextIndex]?.focus();
  };

  const selectOption = (packagingId: number | null) => {
    onChange(packagingId);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={dropdownRef}
      className={`cost-calc-packaging-select${isOpen ? ' cost-calc-packaging-select--open' : ''}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="cost-calc-packaging-select__trigger"
        aria-label={isSpoon ? 'Choose spoon packaging' : `Choose ${groupName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${dropdownId}-options`}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openAt(selectedIndex >= 0 ? selectedIndex + 1 : 0);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openAt(selectedIndex >= 0 ? selectedIndex + 1 : 0);
          } else if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <PackagingThumbnail
          src={selectedOption?.image_url}
          alt={selectedOption?.packaging_name || 'Packaging item'}
          isSpoon={isSpoon}
          type={selectedOption?.packaging_type}
        />
        <span className="cost-calc-packaging-select__value">
          {selectedOption?.packaging_name || 'None selected'}
        </span>
        <svg className="cost-calc-packaging-select__chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path d="m1 1 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </button>
      {isOpen && (
        <div
          id={`${dropdownId}-options`}
          className="cost-calc-packaging-select__options"
          role="listbox"
          aria-label={isSpoon ? 'Spoon packaging options' : `${groupName} options`}
        >
          <button
            ref={(element) => { optionRefs.current[0] = element; }}
            type="button"
            className="cost-calc-packaging-select__option"
            role="option"
            aria-selected={!selectedOption}
            onClick={() => selectOption(null)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                moveFocus(0, 1);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                moveFocus(0, -1);
              } else if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
              }
            }}
          >
            <span className="cost-calc-packaging-select__empty-thumb" aria-hidden="true" />
            <span>None selected</span>
          </button>
          {options.map((option, index) => {
            const optionIndex = index + 1;
            const isSelected = option.packaging_id === selectedId;
            const isOptionSpoon =
              String(option.packaging_type || '').toLowerCase().includes('spoon') ||
              option.packaging_name.toLowerCase().includes('spoon');

            return (
              <button
                key={option.packaging_id}
                ref={(element) => { optionRefs.current[optionIndex] = element; }}
                type="button"
                className="cost-calc-packaging-select__option"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option.packaging_id)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveFocus(optionIndex, 1);
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveFocus(optionIndex, -1);
                  } else if (event.key === 'Escape') {
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
              >
                <PackagingThumbnail
                  src={option.image_url}
                  alt={option.packaging_name}
                  isSpoon={isOptionSpoon}
                  type={option.packaging_type}
                />
                <span>{option.packaging_name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface BucketItem {
  id: string;
  referenceNo: string;
  timestamp: string;
  productId: number;
  productName: string;
  fillSize: string;
  strength: string;
  bottleSize: string;
  finishedQuantity: number;
  productRequiredAmount: number;
  productUnit: string;
  productCost: number;
  packagingCost: number;
  printingCost: number;
  setupCost: number;
  otherCosts: number;
  shipping: number;
  discounts: number;
  total: number;
  selectedPackagingIds: number[];
  packagingPurchases: Record<number, string>;
  packagingBreakdown: PackagingBreakdownItem[];
  filledProductCostPerUnit: number;
  packagingCostPerPurchasedUnit: number;
}

export default function CalculatorPage() {
  const [currency, setCurrency] = useState('PKR');
  const user = useAppSelector((state) => state.auth.user);
  const toast = useToast();

  // ─────────────────────────────────────────────
  // Configuration Data Loaded from Backend
  // ─────────────────────────────────────────────
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOptionItem[]>([]);
  const [rules, setRules] = useState<PackagingRule[]>([]);
  const [calculatorCurrencies, setCalculatorCurrencies] = useState<CalculatorCurrency[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // ─────────────────────────────────────────────
  // Section 1: Product Selection & Inputs
  // ─────────────────────────────────────────────
  const [productId, setProductId] = useState<number>(1);
  const [fillSize, setFillSize] = useState<string>('20');
  const [strength, setStrength] = useState<string>('200mg');
  const [bottleSize, setBottleSize] = useState<string>('60');
  const [finishedQty, setFinishedQty] = useState<string>('500');

  // ─────────────────────────────────────────────
  // Section 2: Packaging Selection & Custom Purchases
  // ─────────────────────────────────────────────
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, number | null>>({});
  const [purchasedQuantities, setPurchasedQuantities] = useState<Record<number, string>>({});

  // ─────────────────────────────────────────────
  // Section 3: Additional Costs
  // ─────────────────────────────────────────────
  const [printingCost, setPrintingCost] = useState<string>('');
  const [setupCost, setSetupCost] = useState<string>('');
  const [otherCosts, setOtherCosts] = useState<string>('');
  const [shipping, setShipping] = useState<string>('');
  const [discounts, setDiscounts] = useState<string>('');

  // ─────────────────────────────────────────────
  // Calculation Feedback
  // ─────────────────────────────────────────────
  const [result, setResult] = useState<any>(null);
  const [unavailablePackagingBreakdown, setUnavailablePackagingBreakdown] = useState<PackagingBreakdownItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingUnavailableMsg, setPricingUnavailableMsg] = useState<string>('');
  const requestSeq = useRef<number>(0);

  // ─────────────────────────────────────────────
  // Modals & Storage
  // ─────────────────────────────────────────────
  const [savedRef, setSavedRef] = useState<string>('');
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [showBucketModal, setShowBucketModal] = useState<boolean>(false);
  const [showEstimateModal, setShowEstimateModal] = useState<boolean>(false);
  const [estimateData, setEstimateData] = useState<any>(null);
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [quoteCustomerName, setQuoteCustomerName] = useState<string>('');
  const [quoteCustomerEmail, setQuoteCustomerEmail] = useState<string>('');
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState<string>('');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState<boolean>(false);
  const [quoteFeedback, setQuoteFeedback] = useState<string>('');

  const toNumber = (value: string | number) => Math.max(0, Number(value) || 0);
  const selectedCurrencySettings = calculatorCurrencies.find((item) => item.code === currency);
  const currencyRate = selectedCurrencySettings?.ratePkrPerUnit || 1;
  const formatAmount = (amount: number | string | null | undefined, code = currency) => (
    formatAmountWithRate(
      amount,
      code,
      calculatorCurrencies.find((item) => item.code === code)?.ratePkrPerUnit || 1
    )
  );

  // Load Bucket from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shilajit_calc_bucket');
      if (stored) {
        setBucket(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveBucketToStorage = (newBucket: BucketItem[]) => {
    setBucket(newBucket);
    try {
      localStorage.setItem('shilajit_calc_bucket', JSON.stringify(newBucket));
    } catch {
      // Ignore storage errors
    }
  };

  // Fetch initial config from backend
  useEffect(() => {
    (async () => {
      setIsLoadingConfig(true);
      try {
        const res = await fetch(`${API_URL}/calculator/config`);
        const json = await res.json();
        if (res.ok && json.success) {
          const { products: pList, options: oList, rules: rList, currencies: currencyList } = json.data;
          setProducts(pList || []);
          setProductOptions(oList || []);
          setRules(rList || []);
          const enabledCurrencies = Array.isArray(currencyList) ? currencyList : [];
          setCalculatorCurrencies(enabledCurrencies);
          setCurrency((current) => (
            enabledCurrencies.some((item: CalculatorCurrency) => item.code === current)
              ? current
              : 'PKR'
          ));

          if (pList && pList.length > 0) {
            setProductId(pList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load calculator configuration:', err);
      } finally {
        setIsLoadingConfig(false);
      }
    })();
  }, []);

  // Set intelligent defaults whenever productId changes
  useEffect(() => {
    if (!productId) return;

    if (productId === 1) {
      setFillSize('20');
      setFinishedQty('500'); // 500 jars * 20g = 10,000g (>= 1kg MOQ)
    } else if (productId === 2) {
      setFillSize('30');
      setFinishedQty('100'); // 100 bottles * 30ml = 3,000ml (3L)
    } else if (productId === 3) {
      setFinishedQty('10000'); // MOQ 10,000 capsules
      setStrength('200mg');
      setBottleSize('60'); // 60 capsules/bottle
    } else if (productId === 4) {
      setFinishedQty('500'); // MOQ 500 blisters (3,500 tablets)
      setFillSize('7');
    }

    // Initialize alternative packaging selections to defaults
    const prodRules = rules.filter((r) => r.product_id === productId);
    const initialAltChoices: Record<string, number> = {};
    for (const r of prodRules) {
      if (r.component_type === 'alternative' && r.alternative_group) {
        if (!initialAltChoices[r.alternative_group] || r.is_default) {
          initialAltChoices[r.alternative_group] = r.packaging_id;
        }
      }
    }
    setSelectedAlternatives(initialAltChoices);
    setPurchasedQuantities({});
    setPricingUnavailableMsg('');
    setResult(null);
    setUnavailablePackagingBreakdown([]);
  }, [productId, rules]);

  const currentProduct = products.find((p) => p.id === productId) || products[0];

  const currentFills = productOptions.filter(
    (o) => o.product_id === productId && o.option_type === 'fill_size'
  );
  const currentStrengths = productOptions.filter(
    (o) => o.product_id === productId && o.option_type === 'strength'
  );

  const activeRules = rules.filter((r) => r.product_id === productId);
  const packagingTableRows: PackagingBreakdownItem[] =
    result?.packagingBreakdown || unavailablePackagingBreakdown;

  // Group alternative packaging choices
  const alternativeGroups: Record<string, PackagingRule[]> = {};
  for (const r of activeRules) {
    if (r.component_type === 'alternative' && r.alternative_group) {
      if (!alternativeGroups[r.alternative_group]) {
        alternativeGroups[r.alternative_group] = [];
      }
      alternativeGroups[r.alternative_group].push(r);
    }
  }
  const spoonGroup = Object.entries(alternativeGroups).find(([name]) =>
    name.toLowerCase().includes('spoon')
  );
  const selectedSpoon = spoonGroup?.[1].find(
    (option) => option.packaging_id === Number(selectedAlternatives[spoonGroup[0]])
  );

  // Determine active packaging item IDs to submit to backend
  const getSelectedPackagingIds = (): number[] => {
    const ids: number[] = [];
    for (const r of activeRules) {
      if (r.component_type === 'required') {
        if (productId === 1 && r.packaging_type === 'container') {
          if (r.packaging_name.includes(`${fillSize}g`)) {
            ids.push(r.packaging_id);
          }
        } else {
          ids.push(r.packaging_id);
        }
      }
    }
    for (const [, chosenId] of Object.entries(selectedAlternatives)) {
      if (chosenId) {
        ids.push(chosenId);
      }
    }
    return ids;
  };

  const getInvalidPackagingPurchase = () => {
    const selectedIds = new Set(getSelectedPackagingIds().map(String));
    for (const [packagingId, rawQuantity] of Object.entries(purchasedQuantities)) {
      if (!selectedIds.has(packagingId)) continue;

      const quantity = rawQuantity.trim();
      if (!/^\d+$/.test(quantity) || !Number.isSafeInteger(Number(quantity)) || Number(quantity) <= 0) {
        const item = activeRules.find((rule) => rule.packaging_id === Number(packagingId));
        return item?.packaging_name || 'Packaging';
      }
    }
    return null;
  };

  // Build payload for authoritative backend calculation
  const buildPayload = () => {
    const selectedIds = new Set(getSelectedPackagingIds());
    const packagingPurchasesNumeric: Record<number, string> = {};
    for (const [pkgId, qtyStr] of Object.entries(purchasedQuantities)) {
      if (selectedIds.has(Number(pkgId))) {
        packagingPurchasesNumeric[Number(pkgId)] = qtyStr;
      }
    }

    return {
      productId,
      fillSize: productId === 1 ? Number(fillSize) : (productId === 2 ? 30 : (productId === 4 ? 7 : undefined)),
      strength: productId === 3 ? strength : undefined,
      bottleSize: productId === 3 ? Number(bottleSize) : undefined,
      finishedQuantity: toNumber(finishedQty),
      selectedPackagingIds: getSelectedPackagingIds(),
      packagingPurchases: packagingPurchasesNumeric,
      additionalCosts: {
        printingCost: toNumber(printingCost),
        setupCost: toNumber(setupCost),
        otherCosts: toNumber(otherCosts),
        shipping: toNumber(shipping),
        discounts: toNumber(discounts),
      }
    };
  };

  // Authoritative Calculation
  const handleCalculate = async () => {
    const quantity = Number(finishedQty);
    if (!productId) {
      toast.error('Select a product to calculate costs.', 'Calculation failed');
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error('Finished quantity must be a positive whole number.', 'Calculation failed');
      return;
    }
    const invalidPackaging = getInvalidPackagingPurchase();
    if (invalidPackaging) {
      requestSeq.current++;
      setIsCalculating(false);
      toast.error(`${invalidPackaging} purchased quantity must be a positive whole number.`, 'Calculation failed');
      return;
    }

    setIsCalculating(true);
    setPricingUnavailableMsg('');

    const seq = ++requestSeq.current;

    try {
      const res = await fetch(`${API_URL}/calculator/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      const json = await res.json();
      if (seq !== requestSeq.current) return;

      if (res.ok && json.success) {
        if (json.data.pricingAvailable) {
          setResult(json.data);
          setUnavailablePackagingBreakdown([]);
          setPricingUnavailableMsg('');
        } else {
          setResult(null);
          setUnavailablePackagingBreakdown(json.data.packagingBreakdown || []);
          setPricingUnavailableMsg(
            json.data.message ||
            'Pricing is currently unavailable for this quantity. Please contact us for a custom quotation.'
          );
        }
      } else {
        setResult(null);
        setUnavailablePackagingBreakdown([]);
        const message = [json.message, json.error].find(
          (value): value is string => typeof value === 'string' && value.trim().length > 0
        );
        toast.error(
          message || 'The calculator could not complete the calculation. Please review your inputs and try again.',
          'Calculation failed'
        );
      }
    } catch {
      if (seq !== requestSeq.current) return;
      setResult(null);
      setUnavailablePackagingBreakdown([]);
      toast.error('Unable to connect to the server.', 'Connection error');
    } finally {
      if (seq === requestSeq.current) {
        setIsCalculating(false);
      }
    }
  };

  // Debounced auto-calculation
  useEffect(() => {
    if (isLoadingConfig) return;

    const scheduledRequest = ++requestSeq.current;
    const qty = Number(finishedQty);
    if (!productId || !Number.isInteger(qty) || qty <= 0) {
      requestSeq.current++;
      setResult(null);
      setUnavailablePackagingBreakdown([]);
      setPricingUnavailableMsg('');
      setIsCalculating(false);
      return;
    }

    const invalidPackaging = getInvalidPackagingPurchase();
    if (invalidPackaging) {
      setIsCalculating(false);
      const timer = setTimeout(() => {
        if (requestSeq.current === scheduledRequest) {
          toast.error(`${invalidPackaging} purchased quantity must be a positive whole number.`, 'Calculation failed');
        }
      }, 350);
      return () => {
        clearTimeout(timer);
        requestSeq.current++;
      };
    }

    setIsCalculating(true);
    setPricingUnavailableMsg('');
    const timer = setTimeout(() => {
      if (requestSeq.current === scheduledRequest) {
        handleCalculate();
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      requestSeq.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoadingConfig,
    productId,
    fillSize,
    strength,
    bottleSize,
    finishedQty,
    selectedAlternatives,
    purchasedQuantities,
    printingCost,
    setupCost,
    otherCosts,
    shipping,
    discounts,
  ]);

  // Save Configuration (Section 15)
  const handleSaveConfiguration = async () => {
    if (!result) {
      alert('Please complete a valid calculation first before saving.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/calculator/save-configuration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPayload(),
          userId: user?.id || null,
          customerName: user ? `${(user as any).first_name || (user as any).firstName || ''} ${(user as any).last_name || (user as any).lastName || ''}`.trim() : null,
          customerEmail: user?.email || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const ref = json.data.referenceNo;
        setSavedRef(ref);
        alert(`Configuration saved successfully!\nReference: ${ref}`);
      } else {
        alert(json.message || 'Failed to save configuration.');
      }
    } catch (e: any) {
      alert('Network error saving configuration: ' + e.message);
    }
  };

  // Add to Bucket (Section 14)
  const handleAddToBucket = () => {
    if (!result) {
      alert('Please complete a valid calculation first before adding to bucket.');
      return;
    }

    const newItem: BucketItem = {
      id: 'BKT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      referenceNo: savedRef || `PL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleString(),
      productId,
      productName: currentProduct?.name || 'Private Label Product',
      fillSize,
      strength,
      bottleSize,
      finishedQuantity: toNumber(finishedQty),
      productRequiredAmount: result.product.productRequiredAmount,
      productUnit: result.product.productUnit,
      productCost: result.summary.filledProductCost,
      packagingCost: result.summary.packagingInventoryCost,
      printingCost: result.summary.printingCost,
      setupCost: result.summary.setupCost,
      otherCosts: result.summary.otherCosts,
      shipping: result.summary.shipping,
      discounts: result.summary.discounts,
      total: result.summary.estimatedProjectCost,
      selectedPackagingIds: getSelectedPackagingIds(),
      packagingPurchases: { ...purchasedQuantities },
      packagingBreakdown: result.packagingBreakdown,
      filledProductCostPerUnit: result.summary.filledProductCostPerUnit,
      packagingCostPerPurchasedUnit: result.summary.packagingCostPerPurchasedUnit,
    };

    const updated = [...bucket, newItem];
    saveBucketToStorage(updated);
    setShowBucketModal(true);
  };

  const handleRemoveBucketItem = (itemId: string) => {
    const updated = bucket.filter((item) => item.id !== itemId);
    saveBucketToStorage(updated);
  };

  const handleDuplicateBucketItem = (item: BucketItem) => {
    const duplicate: BucketItem = {
      ...item,
      id: 'BKT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      referenceNo: item.referenceNo + '-COPY',
      timestamp: new Date().toLocaleString(),
    };
    const updated = [...bucket, duplicate];
    saveBucketToStorage(updated);
  };

  const handleEditBucketItem = (item: BucketItem) => {
    setProductId(item.productId);
    setFillSize(item.fillSize);
    setStrength(item.strength);
    setBottleSize(item.bottleSize);
    setFinishedQty(String(item.finishedQuantity));
    setPurchasedQuantities(item.packagingPurchases || {});
    setPrintingCost(String(item.printingCost || ''));
    setSetupCost(String(item.setupCost || ''));
    setOtherCosts(String(item.otherCosts || ''));
    setShipping(String(item.shipping || ''));
    setDiscounts(String(item.discounts || ''));
    setShowBucketModal(false);
  };

  const bucketTotals = bucket.reduce(
    (acc, item) => ({
      productCost: acc.productCost + item.productCost,
      packagingCost: acc.packagingCost + item.packagingCost,
      printingCost: acc.printingCost + item.printingCost,
      setupCost: acc.setupCost + item.setupCost,
      otherCosts: acc.otherCosts + item.otherCosts,
      shipping: acc.shipping + item.shipping,
      discounts: acc.discounts + item.discounts,
      grandTotal: acc.grandTotal + item.total,
    }),
    { productCost: 0, packagingCost: 0, printingCost: 0, setupCost: 0, otherCosts: 0, shipping: 0, discounts: 0, grandTotal: 0 }
  );

  const openEstimateModal = (sourceData?: any) => {
    const data = sourceData || result;
    if (!data) return;
    setEstimateData(data);
    setShowEstimateModal(true);
  };

  const openQuoteModal = () => {
    setQuoteFeedback('');
    setQuoteCustomerName(user ? `${(user as any).first_name || (user as any).firstName || ''} ${(user as any).last_name || (user as any).lastName || ''}`.trim() : '');
    setQuoteCustomerEmail(user?.email || '');
    setQuoteCustomerPhone(user?.phone || '');
    setShowQuoteModal(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingQuote(true);
    setQuoteFeedback('');

    try {
      const res = await fetch(`${API_URL}/calculator/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPayload(),
          userId: user?.id || null,
          customerName: quoteCustomerName,
          customerEmail: quoteCustomerEmail,
          customerPhone: quoteCustomerPhone,
          productName: currentProduct?.name,
          configurationSnapshot: {
            fillSize,
            strength,
            bottleSize,
            finishedQuantity: finishedQty,
            notes: quoteNotes,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setQuoteFeedback(`Quotation request submitted successfully! Your Reference: ${json.data?.referenceNo || 'Pending'}`);
        setTimeout(() => {
          setShowQuoteModal(false);
        }, 2500);
      } else {
        setQuoteFeedback(json.message || 'Unable to submit quotation request.');
      }
    } catch {
      setQuoteFeedback('Unable to connect to the server.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  return (
    <div className="cost-calc-page">
      {/* Hero */}
      <section className="cost-calc-hero">
        <div className="cost-calc-hero__content">
          <span className="cost-calc-hero__eyebrow">
            <i aria-hidden="true" />
            Private Label Shilajit
          </span>
          <h1 className="cost-calc-hero__title">
            Build Your Shilajit Product
          </h1>
          <p className="cost-calc-hero__desc">
            Customize your product, choose your packaging, and get a clear production cost estimate.
          </p>
          <span className="cost-calc-hero__bar" aria-hidden="true" />
        </div>
      </section>

      {/* Main Container */}
      <div className="cost-calc-container">
        <div className="cost-calc-grid">

          {/* LEFT PANEL */}
          <div className="cost-calc-panel">

            {/* Step 1: Select Product & Configuration */}
            <div className="cost-calc-section">
              <div className="cost-calc-section__head">
                <span className="cost-calc-section__num">1</span>
                <div>
                  <h2 className="cost-calc-section__title">
                    Choose Your Product
                  </h2>
                  <p className="cost-calc-section__subtitle">
                    Select a product line to start configuring your order.
                  </p>
                </div>
              </div>

              <div className="cost-calc-product-cards" role="group" aria-label="Product line">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`cost-calc-prod-btn${product.id === productId ? ' cost-calc-prod-btn--active' : ''}`}
                    aria-pressed={product.id === productId}
                    onClick={() => setProductId(product.id)}
                  >
                    <span className="cost-calc-prod-btn__art">
                      <img
                        src={resolveBackendImageUrl(product.image_url || productImageById[product.id] || '/popular_gold_jar.png')}
                        alt=""
                      />
                    </span>
                    <span className="cost-calc-prod-btn__details">
                      <span className="cost-calc-prod-btn__name">{product.name}</span>
                      <span className="cost-calc-prod-btn__meta">MOQ: {product.moq.toLocaleString()}</span>
                    </span>
                    <span className="cost-calc-radio" aria-hidden="true" />
                  </button>
                ))}
              </div>

              {/* Configuration Inputs */}
              <div className="cost-calc-fields cost-calc-fields--configuration">
                {/* Finished Production Quantity */}
                <div className="cost-calc-field">
                  <label className="cost-calc-field__label" htmlFor="cc-finished-qty">
                    Finished Quantity ({currentProduct?.unit_type || 'units'})
                  </label>
                  <div className="cost-calc-field__control">
                    <input
                      id="cc-finished-qty"
                      type="number"
                      min={1}
                      className="cost-calc-field__input"
                      value={finishedQty}
                      onChange={(e) => setFinishedQty(e.target.value)}
                    />
                    <span className="cost-calc-field__suffix">
                      {productId === 1 ? 'jars' : (productId === 2 ? 'bottles' : (productId === 3 ? 'capsules' : 'blisters'))}
                    </span>
                  </div>
                </div>

                {/* Product 1: Resin Fill Size */}
                {productId === 1 && (
                  <div className="cost-calc-field">
                    <label className="cost-calc-field__label" id="cc-resin-fill-label" htmlFor="cc-resin-fill">
                      Fill Size per Jar
                    </label>
                    <div className="cost-calc-field__control cost-calc-field__control--select">
                      <select
                        id="cc-resin-fill"
                        className="cost-calc-field__input cost-calc-field__select"
                        value={fillSize}
                        onChange={(e) => setFillSize(e.target.value)}
                      >
                        {currentFills.map((opt) => (
                          <option key={opt.id} value={String(opt.numeric_value)}>
                            {opt.label} ({opt.numeric_value}g jar)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Product 2: Liquid Shilajit 30ml */}
                {productId === 2 && (
                  <div className="cost-calc-field">
                    <label className="cost-calc-field__label">
                      Primary Container &amp; Volume
                    </label>
                    <div className="cost-calc-field__control">
                      <span className="cost-calc-field__static">
                        30ml Dropper Bottle (Standard Container)
                      </span>
                    </div>
                  </div>
                )}

                {/* Product 3: Capsules Strength */}
                {productId === 3 && (
                  <div className="cost-calc-field">
                    <label className="cost-calc-field__label" id="cc-cap-str-label" htmlFor="cc-cap-strength">
                      Capsule Strength
                    </label>
                    <div className="cost-calc-field__control cost-calc-field__control--select">
                      <select
                        id="cc-cap-strength"
                        className="cost-calc-field__input cost-calc-field__select"
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                      >
                        {currentStrengths.map((opt) => (
                          <option key={opt.id} value={opt.label}>
                            {opt.label} (Rs. {opt.fixed_price}/capsule)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Product 3: Bottle Configuration */}
                {productId === 3 && (
                  <div className="cost-calc-field">
                    <label className="cost-calc-field__label" htmlFor="cc-cap-bottle">
                      Capsules per Bottle
                    </label>
                    <div className="cost-calc-field__control">
                      <input
                        id="cc-cap-bottle"
                        type="number"
                        min={1}
                        className="cost-calc-field__input"
                        value={bottleSize}
                        onChange={(e) => setBottleSize(e.target.value)}
                      />
                      <span className="cost-calc-field__suffix">capsules</span>
                    </div>
                    {/* Bottle Size presets */}
                    <div className="cost-calc-field__control cost-calc-field__control--select">
                      <select
                        className="cost-calc-field__input cost-calc-field__select"
                        value={bottleSize}
                        onChange={(e) => setBottleSize(e.target.value)}
                      >
                        {['30', '60', '90'].map((preset) => (
                          <option key={preset} value={preset}>
                            {preset} capsules per bottle
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Product 4: Tablets Note */}
                {productId === 4 && (
                  <div className="cost-calc-field">
                    <label className="cost-calc-field__label">
                      Tablet Packaging Format
                    </label>
                    <div className="cost-calc-field__control" style={{ background: '#f8f8f6', padding: '11px 14px' }}>
                      <span style={{ fontSize: '0.86rem', color: '#2c2c2c', fontWeight: 600 }}>
                        1 Blister = 7 Tablets (Rs. 1,000 / blister)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirement & Formula Indicator */}
              <div className="cost-calc-note">
                {productId === 1 && (
                  <div className="cost-calc-note__item">
                    <span className="cost-calc-note__badge">✓</span>
                    <span>
                      Total Required Resin: <strong>{toNumber(finishedQty) * Number(fillSize)}g</strong> ({((toNumber(finishedQty) * Number(fillSize)) / 1000).toFixed(2)}kg) — MOQ: 1kg (1,000g).
                    </span>
                  </div>
                )}
                {productId === 2 && (
                  <div className="cost-calc-note__item">
                    <span className="cost-calc-note__badge">✓</span>
                    <span>
                      Total Volume: <strong>{(toNumber(finishedQty) * 30) / 1000}L</strong> ({toNumber(finishedQty) * 30}ml). Uses 30ml Dropper Bottle (never Serum Bottle).
                    </span>
                  </div>
                )}
                {productId === 3 && (
                  <div className="cost-calc-note__item">
                    <span className="cost-calc-note__badge">✓</span>
                    <span>
                      Required PET Bottles: <strong>{Math.ceil(toNumber(finishedQty) / (Number(bottleSize) || 60))}</strong> bottles (MOQ: 10,000 capsules).
                    </span>
                  </div>
                )}
                {productId === 4 && (
                  <div className="cost-calc-note__item">
                    <span className="cost-calc-note__badge">✓</span>
                    <span>
                      Total Tablets: <strong>{toNumber(finishedQty) * 7}</strong> (MOQ: 500 blisters = Rs. 500,000 minimum product cost).
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Compatible Packaging Selection */}
            <div className="cost-calc-section cost-calc-section--packaging-selection">
              <div className="cost-calc-section__head">
                <span className="cost-calc-section__num">2</span>
                <div>
                  <h2 className="cost-calc-section__title">
                    Choose Packaging
                  </h2>
                </div>
              </div>

              {/* Alternative Choice Groups */}
              <div className="cost-calc-packaging-row">
                <div className="cost-calc-packaging-choices">
                  {Object.entries(alternativeGroups).map(([groupName, options]) => {
                    const isSpoon = groupName.toLowerCase().includes('spoon');

                    return (
                      <div key={groupName} className="cost-calc-field">
                        {!isSpoon && (
                          <label className="cost-calc-field__label">
                            {groupName === 'outer_packaging'
                              ? 'Select External Packaging (Choose exactly ONE):'
                              : `Select ${groupName}:`}
                          </label>
                        )}
                        <PackagingDropdown
                          groupName={groupName}
                          options={options}
                          selectedId={selectedAlternatives[groupName] ?? null}
                          isSpoon={isSpoon}
                          onChange={(packagingId) => {
                            setSelectedAlternatives((prev) => ({
                              ...prev,
                              [groupName]: packagingId,
                            }));
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                {spoonGroup && (
                  <div className="cost-calc-spoon-summary">
                    <span className="cost-calc-spoon-summary__icon" aria-hidden="true">i</span>
                    <div>
                      <span className="cost-calc-spoon-summary__title">Selected Packaging</span>
                      <span className="cost-calc-spoon-summary__details">
                        {selectedSpoon
                          ? `${selectedSpoon.moq.toLocaleString()} pcs MOQ · ${selectedSpoon.unit_price === null
                            ? 'Tiered pricing'
                            : `${formatAmount(selectedSpoon.unit_price, currency)} / pc`}`
                          : 'Choose a spoon option'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Packaging Quantity Management */}
            <div className="cost-calc-section cost-calc-section--packaging-management">
              <div className="cost-calc-section__head">
                <span className="cost-calc-section__num">3</span>
                <div>
                  <h2 className="cost-calc-section__title">
                    Packaging Quantity Management
                  </h2>
                </div>
              </div>

              {/* Packaging Breakdown Table (Desktop) */}
              {packagingTableRows.length > 0 && (
                <div className="cost-calc-pkg-table-wrap">
                  <table className="cost-calc-pkg-table">
                    <thead>
                      <tr>
                        <th>Suggested Qty</th>
                        <th>Purchased Qty</th>
                        <th>Used Qty</th>
                        <th>Remaining</th>
                        <th>Unit Price</th>
                        <th>Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packagingTableRows.map((item) => (
                        <React.Fragment key={item.packagingId}>
                          <tr>
                            <td colSpan={6} className="cost-calc-pkg-component">
                              <div className="cost-calc-pkg-component__content">
                                <PackagingThumbnail
                                  src={item.imageUrl}
                                  alt={item.name}
                                  isSpoon={item.type.toLowerCase().includes('spoon') || item.name.toLowerCase().includes('spoon')}
                                  type={item.type}
                                />
                                <span className="cost-calc-pkg-component__name">{item.name}</span>
                                <span className="cost-calc-pkg-component__meta">
                                  {item.alternativeGroup ? 'Option' : 'Required'} · MOQ: {item.moq}
                                </span>
                                {item.technicalSpecs && (
                                  <span className="cost-calc-pkg-component__meta">{item.technicalSpecs}</span>
                                )}
                                <span className="cost-calc-pkg-component__meta">
                                  {item.pricingTier
                                    ? `Applied tier: ${item.pricingTier.minQuantity.toLocaleString()}–${item.pricingTier.maxQuantity?.toLocaleString() ?? 'open'} pcs`
                                    : item.unitPrice === null ? 'Custom quotation required' : ''}
                                </span>
                                <span className="cost-calc-pkg-component__meta">
                                  {item.weightExcludedFromEstimate
                                    ? 'Weight excluded from estimate'
                                    : item.weightMinG !== null && item.weightMaxG !== null
                                      ? `${item.weightMinG}–${item.weightMaxG} g / pc`
                                      : 'Weight not configured'}
                                </span>
                                {item.dielineUrl && (
                                  <a
                                    href={item.dielineUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="cost-calc-dieline-btn"
                                  >
                                    View dieline
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>{item.suggestedQuantity}</td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                className="cost-calc-qty-input"
                                value={purchasedQuantities[item.packagingId] ?? item.purchasedQuantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPurchasedQuantities((prev) => ({
                                    ...prev,
                                    [item.packagingId]: val,
                                  }));
                                  setPricingUnavailableMsg('');
                                }}
                              />
                            </td>
                            <td>{item.usedQuantity}</td>
                            <td className={item.remainingQuantity > 0 ? 'cost-calc-pkg-rem--ok' : ''}>
                              {item.remainingQuantity}
                            </td>
                            <td>{item.unitPrice === null ? '—' : formatAmount(item.unitPrice, currency)}</td>
                            <td className="cost-calc-pkg-total">
                              {item.totalCost === null ? '—' : formatAmount(item.totalCost, currency)}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Packaging Breakdown Expandable Cards (Mobile) */}
              {packagingTableRows.length > 0 && (
                <div className="cost-calc-mobile-cards">
                  {packagingTableRows.map((item) => (
                    <div className="cost-calc-card" key={item.packagingId}>
                      <div className="cost-calc-card__head">
                        <PackagingThumbnail
                          src={item.imageUrl}
                          alt={item.name}
                          isSpoon={item.type.toLowerCase().includes('spoon') || item.name.toLowerCase().includes('spoon')}
                          type={item.type}
                        />
                        <span className="cost-calc-card__name">{item.name}</span>
                        <span style={{ color: '#636830' }}>{item.totalCost === null ? 'Quote required' : formatAmount(item.totalCost, currency)}</span>
                      </div>
                      <div className="cost-calc-card__row">
                        <span style={{ color: '#666' }}>Type / MOQ:</span>
                        <span>{item.alternativeGroup ? 'Option' : 'Required'} (MOQ: {item.moq})</span>
                      </div>
                      {item.technicalSpecs && (
                        <div className="cost-calc-card__row">
                          <span style={{ color: '#666' }}>Material / Specs:</span>
                          <span>{item.technicalSpecs}</span>
                        </div>
                      )}
                      <div className="cost-calc-card__row">
                        <span style={{ color: '#666' }}>Applied tier:</span>
                        <span>
                          {item.pricingTier
                            ? `${item.pricingTier.minQuantity.toLocaleString()}–${item.pricingTier.maxQuantity?.toLocaleString() ?? 'open'} pcs`
                            : item.unitPrice === null ? 'Custom quotation' : 'Fixed price'}
                        </span>
                      </div>
                      <div className="cost-calc-card__row">
                        <span style={{ color: '#666' }}>Estimated weight / pc:</span>
                        <span>
                          {item.weightExcludedFromEstimate
                            ? 'Excluded'
                            : item.weightMinG !== null && item.weightMaxG !== null
                              ? `${item.weightMinG}–${item.weightMaxG} g`
                              : 'Not configured'}
                        </span>
                      </div>
                      <div className="cost-calc-card__row">
                        <span style={{ color: '#666' }}>Suggested Quantity:</span>
                        <span style={{ fontWeight: 600 }}>{item.suggestedQuantity}</span>
                      </div>
                      <div className="cost-calc-card__row">
                        <span style={{ color: '#666' }}>Purchased Quantity:</span>
                        <input
                          type="number"
                          min={0}
                          className="cost-calc-qty-input"
                          style={{ width: '85px', height: '30px' }}
                          value={purchasedQuantities[item.packagingId] ?? item.purchasedQuantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPurchasedQuantities((prev) => ({
                              ...prev,
                              [item.packagingId]: val,
                            }));
                            setPricingUnavailableMsg('');
                          }}
                        />
                      </div>
                      <div className="cost-calc-card__row">
                        <span style={{ color: '#666' }}>Used / Remaining:</span>
                        <span>
                          {item.usedQuantity} used • <strong style={{ color: item.remainingQuantity > 0 ? '#27ae60' : '#888' }}>{item.remainingQuantity} remaining</strong>
                        </span>
                      </div>
                      <div className="cost-calc-card__row" style={{ borderBottom: 'none' }}>
                        <span style={{ color: '#666' }}>Unit Price:</span>
                        <span>{item.unitPrice === null ? 'Quote required' : formatAmount(item.unitPrice, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {packagingTableRows
                .filter((item) =>
                  item.minimumOrderNotice ||
                  item.shortBy > 0 ||
                  (item.remainingQuantity > 0 && item.nextCheaperTier)
                )
                .map((item) => (
                <div className="cost-calc-note" key={`pkg-note-${item.packagingId}`}>
                  {item.minimumOrderNotice && (
                    <div className="cost-calc-note__item cost-calc-note__item--muted">
                      <span className="cost-calc-note__badge cost-calc-note__badge--muted">i</span>
                      <span>
                        Minimum order is {item.moq} pcs. The extra {item.remainingQuantity} pcs are added to your remaining packaging.
                      </span>
                    </div>
                  )}
                  {item.shortBy > 0 && (
                    <div className="cost-calc-note__item cost-calc-note__item--muted">
                      <span className="cost-calc-note__badge cost-calc-note__badge--muted">i</span>
                      <span>Short by {item.shortBy} pcs. This is informational; it does not block the estimate.</span>
                    </div>
                  )}
                  {item.remainingQuantity > 0 && item.nextCheaperTier && (
                    <div className="cost-calc-note__item cost-calc-note__item--muted">
                      <span className="cost-calc-note__badge cost-calc-note__badge--muted">i</span>
                      <span>
                        Buying {item.nextCheaperTier.minQuantity.toLocaleString()} pcs instead of {item.purchasedQuantity.toLocaleString()} lowers the price from {formatAmount(item.unitPrice, currency)} to {formatAmount(item.nextCheaperTier.rate, currency)} per piece.
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <div className="cost-calc-note" style={{ marginTop: '16px' }}>
                <div className="cost-calc-note__item cost-calc-note__item--muted">
                  <span className="cost-calc-note__badge cost-calc-note__badge--muted">i</span>
                  <span>
                    Remaining pieces are delivered with this order and can be kept for future batches. Packaging cost covers every purchased piece.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 4: Additional Costs (Optional) */}
            <div className="cost-calc-section">
              <div className="cost-calc-section__head">
                <span className="cost-calc-section__num">4</span>
                <div>
                  <h2 className="cost-calc-section__title">
                    Additional Costs (Optional)
                  </h2>
                  <p className="cost-calc-section__subtitle">
                    Keep printing, setup, shipping, and discount costs completely separate.
                  </p>
                </div>
              </div>

              <div className="cost-calc-fields cost-calc-fields--five">
                {[
                  { id: 'cc-print', label: 'Printing Cost', val: printingCost, set: setPrintingCost },
                  { id: 'cc-setup', label: 'Setup Cost', val: setupCost, set: setSetupCost },
                  { id: 'cc-other', label: 'Other Costs', val: otherCosts, set: setOtherCosts },
                  { id: 'cc-shipping', label: 'Shipping', val: shipping, set: setShipping },
                  { id: 'cc-discount', label: 'Discounts', val: discounts, set: setDiscounts },
                ].map((f) => (
                  <div className="cost-calc-field" key={f.id}>
                    <label className="cost-calc-field__label" htmlFor={f.id}>{f.label}</label>
                    <div className="cost-calc-field__control">
                      <span className="cost-calc-field__affix">Rs</span>
                      <input
                        id={f.id}
                        type="number"
                        min={0}
                        placeholder="0"
                        className="cost-calc-field__input cost-calc-field__input--prefixed"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel Actions */}
            <div className="cost-calc-actions">
              <button
                type="button"
                className="cost-calc-btn cost-calc-btn--ghost"
                onClick={handleSaveConfiguration}
                disabled={!result || isCalculating}
              >
                <span>💾</span>
                {savedRef ? `Saved Ref: ${savedRef}` : 'Save Configuration'}
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                {bucket.length > 0 && (
                  <button
                    type="button"
                    className="cost-calc-btn cost-calc-btn--ghost"
                    onClick={() => setShowBucketModal(true)}
                  >
                    View Bucket ({bucket.length})
                  </button>
                )}
                <button
                  type="button"
                  className="cost-calc-btn cost-calc-btn--primary"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                >
                  {isCalculating ? 'Updating Calculations…' : 'Recalculate Estimate'}
                </button>
              </div>
            </div>

            {/* Custom Quotation Trigger */}
            {pricingUnavailableMsg && (
              <div className="cost-calc-quote-notice">
                <p>
                  {pricingUnavailableMsg}
                </p>
                <button
                  type="button"
                  className="cost-calc-btn cost-calc-btn--dark"
                  onClick={openQuoteModal}
                >
                  REQUEST CUSTOM QUOTATION
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: STICKY COST SUMMARY */}
          <aside className="cost-calc-summary">
            <div className="cost-calc-summary__head">
              <h2 className="cost-calc-summary__title">Cost Summary</h2>
              {calculatorCurrencies.length > 0 && (
                <div className="cost-calc-summary__currency">
                  <label htmlFor="calculator-currency">Currency</label>
                  <select
                    id="calculator-currency"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  >
                    {calculatorCurrencies.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} — {item.name}
                      </option>
                    ))}
                  </select>
                  <small>
                    {currency === 'PKR'
                      ? 'PKR base currency'
                      : `1 ${currency} = PKR ${currencyRate.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}`}
                    {' · '}
                    {selectedCurrencySettings?.rateSource || 'Rate source unavailable'}
                    {' · '}
                    {selectedCurrencySettings?.rateUpdatedAt
                      ? `Updated ${new Date(selectedCurrencySettings.rateUpdatedAt).toLocaleString()}`
                      : 'Update time unavailable'}
                  </small>
                </div>
              )}
              <span
                className={`cost-calc-summary__badge ${
                  isCalculating
                    ? 'cost-calc-summary__badge--busy'
                    : result
                    ? 'cost-calc-summary__badge--live'
                    : 'cost-calc-summary__badge--idle'
                }`}
              >
                {isCalculating ? 'Calculating…' : result ? 'Live Estimate' : 'Awaiting Input'}
              </span>
            </div>

            {!result && !pricingUnavailableMsg && (
              <div className="cost-calc-summary__empty" style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontWeight: 700, color: '#333', fontSize: '0.95rem' }}>
                  Enter quantity &amp; configuration
                </p>
                <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '6px' }}>
                  Backend calculations are authoritative and update automatically.
                </p>
              </div>
            )}

            {result && (
              <>
                <div className="cost-calc-summary__rows">
                  <div className="cost-calc-summary__row">
                    <span>Filled Product Cost</span>
                    <span>{formatAmount(result.summary.filledProductCost, currency)}</span>
                  </div>

                  <div className="cost-calc-summary__row">
                    <span>Packaging Cost (all purchased)</span>
                    <span>{formatAmount(result.summary.packagingInventoryCost, currency)}</span>
                  </div>
                  <div className="cost-calc-summary__row">
                    <span>Packaging used for this order</span>
                    <span>{formatAmount(result.summary.packagingUsedCost, currency)}</span>
                  </div>
                  <div className="cost-calc-summary__row">
                    <span>Packaging remaining</span>
                    <span>{formatAmount(result.summary.packagingRemainingCost, currency)}</span>
                  </div>

                  {result.summary.printingCost > 0 && (
                    <div className="cost-calc-summary__row">
                      <span>Printing Cost</span>
                      <span>{formatAmount(result.summary.printingCost, currency)}</span>
                    </div>
                  )}

                  {result.summary.setupCost > 0 && (
                    <div className="cost-calc-summary__row">
                      <span>Setup Cost</span>
                      <span>{formatAmount(result.summary.setupCost, currency)}</span>
                    </div>
                  )}

                  {result.summary.otherCosts > 0 && (
                    <div className="cost-calc-summary__row">
                      <span>Other Costs</span>
                      <span>{formatAmount(result.summary.otherCosts, currency)}</span>
                    </div>
                  )}

                  {result.summary.shipping > 0 && (
                    <div className="cost-calc-summary__row">
                      <span>Shipping</span>
                      <span>{formatAmount(result.summary.shipping, currency)}</span>
                    </div>
                  )}

                  {result.summary.discounts > 0 && (
                    <div className="cost-calc-summary__row" style={{ color: '#27ae60' }}>
                      <span>Discounts</span>
                      <span>− {formatAmount(result.summary.discounts, currency)}</span>
                    </div>
                  )}
                </div>

                {/* Master Formula Grand Total */}
                <div className="cost-calc-summary__total">
                  <span>Estimated Project Cost</span>
                  <span>{formatAmount(result.summary.estimatedProjectCost, currency)}</span>
                </div>

                {/* Per Unit Metrics */}
                <div className="cost-calc-summary__metrics">
                  <div className="cost-calc-summary__metrics-row">
                    <span>Filled Product Cost / Unit:</span>
                    <strong>{formatAmount(result.summary.filledProductCostPerUnit, currency)}</strong>
                  </div>
                  <div className="cost-calc-summary__metrics-row">
                    <span>Packaging Cost / Purchased Unit:</span>
                    <strong>{formatAmount(result.summary.packagingCostPerPurchasedUnit, currency)}</strong>
                  </div>
                </div>

                <section className="cost-calc-remaining">
                  <h3>Remaining Packaging</h3>
                  <p className="cost-calc-remaining__intro">
                    Surplus pieces are delivered with this order and kept for future batches.
                  </p>
                  {result.packagingBreakdown.filter((item: PackagingBreakdownItem) => item.remainingQuantity > 0).length === 0 ? (
                    <p className="cost-calc-remaining__empty">No remaining packaging for this order.</p>
                  ) : (
                    result.packagingBreakdown
                      .filter((item: PackagingBreakdownItem) => item.remainingQuantity > 0)
                      .map((item: PackagingBreakdownItem) => {
                        const hasWeight = !item.weightExcludedFromEstimate && item.weightMinG !== null && item.weightMaxG !== null;
                        const remainingWeightMin = hasWeight ? item.remainingQuantity * item.weightMinG! : null;
                        const remainingWeightMax = hasWeight ? item.remainingQuantity * item.weightMaxG! : null;
                        const weightText = hasWeight
                          ? `${remainingWeightMin!.toLocaleString()}–${remainingWeightMax!.toLocaleString()} g`
                          : 'Not included in weight estimate';

                        return (
                          <div className="cost-calc-remaining__item" key={`remaining-${item.packagingId}`}>
                            <strong>{item.name}</strong>
                            <span>{item.remainingQuantity.toLocaleString()} pcs · {formatAmount(item.remainingCost, currency)}</span>
                            <small>Estimated weight: {weightText}</small>
                          </div>
                        );
                      })
                  )}
                  {result.summary.totalPackagingWeightMinG !== null && result.summary.totalPackagingWeightMaxG !== null && (
                    <p className="cost-calc-remaining__weight">
                      Estimated packaging weight (purchased): {result.summary.totalPackagingWeightMinG.toLocaleString()}–{result.summary.totalPackagingWeightMaxG.toLocaleString()} g
                    </p>
                  )}
                  <p className="cost-calc-remaining__disclaimer">
                    Weight estimate excludes product, jars, labels, and inserts.
                  </p>
                </section>

                {/* Action Buttons */}
                <div className="cost-calc-summary__actions">
                  <button
                    type="button"
                    className="cost-calc-btn cost-calc-btn--primary cost-calc-btn--block"
                    onClick={handleAddToBucket}
                    disabled={isCalculating}
                  >
                    ADD TO BUCKET
                  </button>

                  <button
                    type="button"
                    className="cost-calc-btn cost-calc-btn--ghost cost-calc-btn--block"
                    onClick={() => openEstimateModal()}
                    disabled={isCalculating}
                  >
                    GENERATE ESTIMATE
                  </button>

                  <button
                    type="button"
                    className="cost-calc-btn cost-calc-btn--dark cost-calc-btn--block"
                    onClick={openQuoteModal}
                    disabled={isCalculating}
                  >
                    REQUEST A QUOTATION
                  </button>
                </div>
              </>
            )}

            <p className="cost-calc-summary__note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" />
              </svg>
              Backend calculations are authoritative.
            </p>
          </aside>
        </div>
      </div>

      {/* MODAL 1: BUCKET (Section 14) */}
      {showBucketModal && (
        <div className="cost-calc-modal-backdrop" onClick={() => setShowBucketModal(false)}>
          <div className="cost-calc-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cost-calc-modal__close"
              onClick={() => setShowBucketModal(false)}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2b3310', marginBottom: '6px' }}>
              Project Bucket ({bucket.length} {bucket.length === 1 ? 'Configuration' : 'Configurations'})
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#666', marginBottom: '22px' }}>
              Customers can add multiple configurations. Each configuration remains independently editable.
            </p>

            {bucket.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '36px 0', color: '#888' }}>
                Your bucket is currently empty.
              </p>
            ) : (
              <div>
                {bucket.map((item) => (
                  <div key={item.id} className="cost-calc-bucket-item">
                    <div className="cost-calc-bucket-item__header">
                      <div>
                        <div className="cost-calc-bucket-item__title">{item.productName}</div>
                        <div className="cost-calc-bucket-item__ref">Ref: {item.referenceNo} • Added: {item.timestamp}</div>
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#384018' }}>
                        {formatAmount(item.total, currency)}
                      </div>
                    </div>

                    <div className="cost-calc-bucket-grid">
                      <div>Finished Qty: <strong>{item.finishedQuantity}</strong></div>
                      <div>Product Cost: <strong>{formatAmount(item.productCost, currency)}</strong></div>
                      <div>Packaging Cost: <strong>{formatAmount(item.packagingCost, currency)}</strong></div>
                      {item.printingCost > 0 && <div>Printing: <strong>{formatAmount(item.printingCost, currency)}</strong></div>}
                      {item.setupCost > 0 && <div>Setup: <strong>{formatAmount(item.setupCost, currency)}</strong></div>}
                      {item.shipping > 0 && <div>Shipping: <strong>{formatAmount(item.shipping, currency)}</strong></div>}
                    </div>

                    <div className="cost-calc-bucket-actions">
                      <button
                        type="button"
                        className="cost-calc-mini-btn"
                        onClick={() => handleEditBucketItem(item)}
                      >
                        Edit Configuration
                      </button>
                      <button
                        type="button"
                        className="cost-calc-mini-btn"
                        onClick={() => handleDuplicateBucketItem(item)}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="cost-calc-mini-btn cost-calc-mini-btn--danger"
                        onClick={() => handleRemoveBucketItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Grand Summary (Section 14) */}
                <div style={{ marginTop: '24px', padding: '22px', background: '#f5f7ee', borderRadius: '12px', border: '1.5px solid #e1e7d2' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: '#2a2a2a' }}>
                    Bucket Grand Total
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.84rem', color: '#555', marginBottom: '16px' }}>
                    <div>Total Product Cost: <strong>{formatAmount(bucketTotals.productCost, currency)}</strong></div>
                    <div>Total Packaging Cost: <strong>{formatAmount(bucketTotals.packagingCost, currency)}</strong></div>
                    <div>Total Printing: <strong>{formatAmount(bucketTotals.printingCost, currency)}</strong></div>
                    <div>Total Setup: <strong>{formatAmount(bucketTotals.setupCost, currency)}</strong></div>
                    <div>Total Shipping: <strong>{formatAmount(bucketTotals.shipping, currency)}</strong></div>
                    <div>Total Discounts: <strong>− {formatAmount(bucketTotals.discounts, currency)}</strong></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '2px solid #dde3ce', fontSize: '1.3rem', fontWeight: 800, color: '#384018' }}>
                    <span>Grand Total:</span>
                    <span>{formatAmount(bucketTotals.grandTotal, currency)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
                  <button
                    type="button"
                    className="cost-calc-btn cost-calc-btn--primary cost-calc-btn--block"
                    onClick={() => {
                      setShowBucketModal(false);
                      openEstimateModal();
                    }}
                  >
                    Generate Estimate from Current
                  </button>
                  <button
                    type="button"
                    className="cost-calc-btn cost-calc-btn--dark cost-calc-btn--block"
                    onClick={() => {
                      setShowBucketModal(false);
                      openQuoteModal();
                    }}
                  >
                    Request Quotation for Bucket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ESTIMATE (Section 18) */}
      {showEstimateModal && estimateData && (
        <div className="cost-calc-modal-backdrop" onClick={() => setShowEstimateModal(false)}>
          <div className="cost-calc-modal cost-calc-estimate-print" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cost-calc-modal__close no-print"
              onClick={() => setShowEstimateModal(false)}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', borderBottom: '2px solid #636830', paddingBottom: '18px', marginBottom: '22px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', color: '#636830', textTransform: 'uppercase' }}>
                Private Label Shilajit
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1c1c1c', margin: '4px 0' }}>
                ESTIMATE — NOT A FINAL QUOTATION
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#666' }}>
                Ref: <strong>{savedRef || 'DRAFT-ESTIMATE'}</strong> • Date: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Customer Information */}
            <div style={{ background: '#f8f8f6', padding: '16px 20px', borderRadius: '10px', marginBottom: '22px', fontSize: '0.84rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px', color: '#333' }}>Customer Information</div>
              <div style={{ color: '#555' }}>
                Name: {user ? `${(user as any).first_name || (user as any).firstName || ''} ${(user as any).last_name || (user as any).lastName || ''}`.trim() : 'Prospective Client'} | Email: {user?.email || 'N/A'} | Status: Official Estimate
              </div>
            </div>

            {/* Product Configuration Details */}
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#222', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
                Product Configuration
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
                <div>Product: <strong>{estimateData.product.name}</strong></div>
                {estimateData.product.fillSize && <div>Fill Size: <strong>{estimateData.product.fillSize}g</strong></div>}
                {estimateData.product.strength && <div>Strength: <strong>{estimateData.product.strength}</strong></div>}
                {estimateData.product.bottleSize && <div>Bottle Size: <strong>{estimateData.product.bottleSize} capsules</strong></div>}
                <div>Finished Units: <strong>{estimateData.product.finishedQuantity}</strong></div>
                <div>Required Product: <strong>{estimateData.product.productRequiredAmount} {estimateData.product.productUnit}</strong></div>
                <div>Rate Applied: <strong>{formatAmount(estimateData.product.unitPrice, currency)} / {estimateData.product.productUnit}</strong></div>
                <div>Filled Product Cost: <strong>{formatAmount(estimateData.product.totalCost, currency)}</strong></div>
              </div>
            </div>

            {/* Packaging Inventory Breakdown */}
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#222', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px' }}>
                Packaging Inventory Breakdown
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f3', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Item</th>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Type</th>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Required</th>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Purchased</th>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Used</th>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Remaining</th>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Unit Cost</th>
                    <th style={{ padding: '10px 12px', borderBottom: '1.5px solid #ddd' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimateData.packagingBreakdown.map((pkg: PackagingBreakdownItem) => (
                    <tr key={pkg.packagingId}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', fontWeight: 700 }}>
                        {pkg.name}
                        {(pkg.technicalSpecs || pkg.pricingTier) && (
                          <small style={{ display: 'block', fontWeight: 400, color: '#666' }}>
                            {pkg.technicalSpecs ? `${pkg.technicalSpecs} · ` : ''}
                            {pkg.pricingTier
                              ? `Tier ${pkg.pricingTier.minQuantity}–${pkg.pricingTier.maxQuantity ?? 'open'} pcs`
                              : ''}
                          </small>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>{pkg.type}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>{pkg.suggestedQuantity}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', fontWeight: 700 }}>{pkg.purchasedQuantity}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>{pkg.usedQuantity}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', color: '#27ae60', fontWeight: 700 }}>{pkg.remainingQuantity}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>{pkg.unitPrice === null ? '—' : formatAmount(pkg.unitPrice, currency)}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', fontWeight: 700 }}>{pkg.totalCost === null ? '—' : formatAmount(pkg.totalCost, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div style={{ background: '#fafaf8', padding: '18px 22px', borderRadius: '10px', border: '1.5px solid #e7e5de', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.86rem', color: '#444' }}>
                <div>Filled Product Cost: <strong>{formatAmount(estimateData.summary.filledProductCost, currency)}</strong></div>
                <div>Packaging Inventory Cost: <strong>{formatAmount(estimateData.summary.packagingInventoryCost, currency)}</strong></div>
                <div>Packaging used for this order: <strong>{formatAmount(estimateData.summary.packagingUsedCost, currency)}</strong></div>
                <div>Packaging remaining: <strong>{formatAmount(estimateData.summary.packagingRemainingCost, currency)}</strong></div>
                <div>Printing: <strong>{formatAmount(estimateData.summary.printingCost, currency)}</strong></div>
                <div>Setup: <strong>{formatAmount(estimateData.summary.setupCost, currency)}</strong></div>
                <div>Other Costs: <strong>{formatAmount(estimateData.summary.otherCosts, currency)}</strong></div>
                <div>Shipping: <strong>{formatAmount(estimateData.summary.shipping, currency)}</strong></div>
                <div>Discounts: <strong>− {formatAmount(estimateData.summary.discounts, currency)}</strong></div>
              </div>
              <div style={{ borderTop: '2px solid #ddd', marginTop: '14px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#384018' }}>
                <span>Estimated Project Cost:</span>
                <span>{formatAmount(estimateData.summary.estimatedProjectCost, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#666', marginTop: '8px' }}>
                <span>Filled Product Cost Per Unit: <strong>{formatAmount(estimateData.summary.filledProductCostPerUnit, currency)}</strong></span>
                <span>Packaging Cost Per Purchased Unit: <strong>{formatAmount(estimateData.summary.packagingCostPerPurchasedUnit, currency)}</strong></span>
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="cost-calc-btn cost-calc-btn--ghost"
                onClick={() => window.print()}
              >
                🖨️ Print / Save as PDF
              </button>
              <button
                type="button"
                className="cost-calc-btn cost-calc-btn--dark"
                onClick={() => {
                  setShowEstimateModal(false);
                  openQuoteModal();
                }}
              >
                Request Quotation from Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REQUEST CUSTOM QUOTATION (Section 17) */}
      {showQuoteModal && (
        <div className="cost-calc-modal-backdrop" onClick={() => setShowQuoteModal(false)}>
          <div className="cost-calc-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cost-calc-modal__close"
              onClick={() => setShowQuoteModal(false)}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2b3310', marginBottom: '6px' }}>
              Request a Custom Quotation
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#666', marginBottom: '20px' }}>
              Your product and packaging configuration will be attached with your request. Our private-label specialists will review and get back within 24 hours.
            </p>

            <form onSubmit={handleSubmitQuote}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="cost-calc-field__label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="cost-calc-field__input"
                    style={{ border: '1.5px solid #dedcd5', borderRadius: '8px' }}
                    placeholder="Enter your name"
                    value={quoteCustomerName}
                    onChange={(e) => setQuoteCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="cost-calc-field__label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="cost-calc-field__input"
                    style={{ border: '1.5px solid #dedcd5', borderRadius: '8px' }}
                    placeholder="name@company.com"
                    value={quoteCustomerEmail}
                    onChange={(e) => setQuoteCustomerEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="cost-calc-field__label">Phone / WhatsApp</label>
                  <input
                    type="text"
                    className="cost-calc-field__input"
                    style={{ border: '1.5px solid #dedcd5', borderRadius: '8px' }}
                    placeholder="+92 300 1234567"
                    value={quoteCustomerPhone}
                    onChange={(e) => setQuoteCustomerPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="cost-calc-field__label">Project Notes / Specifications</label>
                  <textarea
                    rows={3}
                    className="cost-calc-field__input"
                    style={{ border: '1.5px solid #dedcd5', borderRadius: '8px', resize: 'vertical' }}
                    placeholder="Enter any custom dielines, bottle preferences, target timeline, etc."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                  />
                </div>

                {quoteFeedback && (
                  <p style={{ fontSize: '0.84rem', fontWeight: 600, color: quoteFeedback.includes('successfully') ? '#27ae60' : '#c0392b' }}>
                    {quoteFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingQuote}
                  className="cost-calc-btn cost-calc-btn--dark cost-calc-btn--block"
                  style={{ marginTop: '6px' }}
                >
                  {isSubmittingQuote ? 'Submitting Request…' : 'SUBMIT QUOTATION REQUEST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
