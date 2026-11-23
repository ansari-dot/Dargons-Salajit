import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  getCurrencyName,
  getPkrRate,
  isArabCountry,
  normalizeCurrency,
  resolveCurrencyForCountry,
  setLivePkrRates,
} from '@/lib/utils/currency';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** How often the storefront re-checks the visitor's public IP (ms). */
export const CURRENCY_POLL_INTERVAL_MS = 10_000;

/** Both hostnames belong to ipify — the BROWSER resolves its OWN IP. */
const IPIFY_ENDPOINTS = [
  'https://api.ipify.org?format=json',
  'https://api64.ipify.org?format=json',
];

export interface UIState {
  isTopBarVisible: boolean;
  isNavDrawerOpen: boolean;
  isCartDropdownOpen: boolean;
  /**
   * SINGLE source of truth for the currency every price/cost component renders
   * (Header, ProductCard, QuickView, CartSummary, Checkout, Calculator).
   */
  selectedCurrency: string;
  /** ISO country code detected for the visitor, e.g. 'PK' ('' when unknown) */
  countryCode: string;
  /** Human readable name of `selectedCurrency`, e.g. 'UAE Dirham' */
  currencyName: string;
  /** Units of `selectedCurrency` for 1 PKR (live rate from the backend) */
  currencyRate: number;
  /** True when the detected country is an Arab League country */
  isArabCountry: boolean;
  /** The public IP the browser actually reported to the backend. */
  browserIp: string;
  /** Timestamp (ms) of the last successful detection. */
  lastDetectedAt: number;
  /** True while a detection request is in flight. */
  isDetectingCurrency: boolean;
  /** True once the visitor picks a currency manually from the header dropdown */
  isCurrencyManuallySet: boolean;
  quickViewProduct: any | null;
  searchQuery: string;
}

const initialState: UIState = {
  isTopBarVisible: true,
  isNavDrawerOpen: false,
  isCartDropdownOpen: false,
  // Bootstrap value ONLY. The detector overwrites it as soon as the first geo
  // lookup answers and it is never persisted, so it can never override a
  // freshly detected currency.
  selectedCurrency: 'PKR',
  currencyName: 'Pakistani Rupee',
  currencyRate: 1,
  isArabCountry: false,
  countryCode: '',
  browserIp: '',
  lastDetectedAt: 0,
  isDetectingCurrency: false,
  isCurrencyManuallySet: false,
  quickViewProduct: null,
  searchQuery: '',
};

export interface DetectedLocation {
  ip: string;
  country: string;
  countryCode: string;
  currency: string;
  currencyName: string;
  currencyRate: number;
  isArabCountry: boolean;
}

/** Reads the visitor's own public IP from the browser (never from the server). */
async function getBrowserPublicIp(): Promise<string> {
  for (const endpoint of IPIFY_ENDPOINTS) {
    try {
      const res = await fetch(`${endpoint}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const ip = String(data?.ip || '').trim();
      if (ip) return ip;
    } catch {
      // Blocked / offline — try the next ipify host.
    }
  }
  return '';
}

/**
 * The country REALLY changed (PK → US or back). Only then may an earlier manual
 * currency choice be overridden. '' means "not detected yet", not "changed".
 */
const isCountryChange = (previous: string, next: string): boolean =>
  Boolean(previous) && Boolean(next) && previous !== next;

/**
 * Async Thunk: detect the visitor's currency from their CURRENT public IP.
 *
 *   Browser (ipify) ──▶ GET /api/location?ip=<browser ip>
 *   ──▶ PK → PKR · Arab country → AED/SAR/QAR/… · else USD
 *
 * It runs on every poll tick, so changing a VPN while the page is open updates
 * the whole storefront automatically. Every request is uncacheable.
 */
export const fetchUserCurrency = createAsyncThunk<
  DetectedLocation,
  void,
  { state: RootState; rejectValue: string }
>('ui/fetchUserCurrency', async (_, { getState, rejectWithValue }) => {
  try {
    /* 1 ── The BROWSER resolves its own public IP (VPN aware). */
    const browserIp = await getBrowserPublicIp();
    console.log('CURRENT BROWSER IP:', browserIp || '(not resolved)');

    /* 2 ── Ask OUR backend to geolocate exactly that IP (never the server IP). */
    const params = new URLSearchParams();
    if (browserIp) params.set('ip', browserIp);
    params.set('t', String(Date.now())); // cache buster

    const res = await fetch(`${API_URL}/location?${params.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to detect location');
    }

    const location = data?.location || {};
    const countryCode = String(location.countryCode || '').toUpperCase();

    if (!countryCode) {
      throw new Error('Country could not be resolved for this IP');
    }

    /* 3 ── Pakistan → PKR · Arab country → AED/SAR/QAR/… · any other country
     *      → its own local currency (EUR, GBP, INR, …) with USD as fallback. */
    const currency = String(
      location.currency || resolveCurrencyForCountry(countryCode)
    ).toUpperCase();
    const currencyName = location.currencyName || getCurrencyName(currency);
    const currencyRate = Number(location.exchangeRate) || 0;
    const isArab = location.isArabCountry ?? isArabCountry(countryCode);

    // Live PKR-based rates (units per 1 PKR) so EVERY supported currency —
    // including the ones picked from the header menu — renders accurately.
    setLivePkrRates(location.rates);
    if (currencyRate > 0) setLivePkrRates({ [currency]: currencyRate });

    const previousState = getState().ui;
    const countryChanged = isCountryChange(
      previousState.countryCode,
      countryCode
    );
    const heldByManualChoice =
      previousState.isCurrencyManuallySet && !countryChanged;

    /* 4 ── Temporary debug trace (remove once verified). */
    console.log('DETECTED COUNTRY:', countryCode, `(${location.country || 'unknown'})`);
    console.log('DETECTED CURRENCY:', currency, `— ${currencyName}`);
    console.log('DETECTED RATE: 1 PKR =', currencyRate, currency);
    console.log('ARAB COUNTRY:', isArab ? 'YES' : 'no');
    console.log('PREVIOUS CURRENCY:', previousState.selectedCurrency);
    console.log(
      'NEW CURRENCY:',
      heldByManualChoice
        ? `${previousState.selectedCurrency} (manual choice kept)`
        : currency
    );

    return {
      ip: data?.ip || location.ip || browserIp,
      country: location.country || '',
      countryCode,
      currency,
      currencyName,
      currencyRate,
      isArabCountry: Boolean(isArab),
    };
  } catch (err: any) {
    console.warn('Currency detection failed:', err?.message || err);
    return rejectWithValue(err?.message || 'Unable to detect location');
  }
});

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTopBar: (state) => {
      state.isTopBarVisible = !state.isTopBarVisible;
    },
    closeTopBar: (state) => {
      state.isTopBarVisible = false;
    },
    toggleNavDrawer: (state) => {
      state.isNavDrawerOpen = !state.isNavDrawerOpen;
    },
    closeNavDrawer: (state) => {
      state.isNavDrawerOpen = false;
    },
    toggleCartDropdown: (state) => {
      state.isCartDropdownOpen = !state.isCartDropdownOpen;
    },
    closeCartDropdown: (state) => {
      state.isCartDropdownOpen = false;
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      // Normalised so only currencies the storefront supports can be selected.
      state.selectedCurrency = normalizeCurrency(action.payload);
      state.currencyName = getCurrencyName(state.selectedCurrency);
      state.currencyRate = getPkrRate(state.selectedCurrency);
      // Remember that the visitor chose this on purpose. It survives polling
      // only while the detected country stays the same (see extraReducers).
      state.isCurrencyManuallySet = true;
    },
    setQuickViewProduct: (state, action: PayloadAction<any | null>) => {
      state.quickViewProduct = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCurrency.pending, (state) => {
        state.isDetectingCurrency = true;
      })
      .addCase(fetchUserCurrency.fulfilled, (state, action) => {
        const {
          ip,
          countryCode,
          currency,
          isArabCountry: isArab,
        } = action.payload;
        const countryChanged = isCountryChange(state.countryCode, countryCode);

        if (countryCode) state.countryCode = countryCode;
        if (ip) state.browserIp = ip;
        state.isArabCountry = isArab;
        state.lastDetectedAt = Date.now();
        state.isDetectingCurrency = false;

        // A real country change (VPN on/off) wins over an earlier manual
        // dropdown choice, so the storefront always follows the current IP.
        if (countryChanged) state.isCurrencyManuallySet = false;

        // THE one assignment every price/cost component reads from.
        if (!state.isCurrencyManuallySet) {
          state.selectedCurrency = currency;
        }

        // Name + rate always describe what is ACTUALLY selected, so a manual
        // choice keeps its own name/rate rather than the detected one's.
        state.currencyName = getCurrencyName(state.selectedCurrency);
        state.currencyRate = getPkrRate(state.selectedCurrency);
      })
      .addCase(fetchUserCurrency.rejected, (state) => {
        // Detection failed (offline / blocked): keep the last known good
        // currency instead of resetting it.
        state.isDetectingCurrency = false;
      });
  },
});

export const {
  toggleTopBar,
  closeTopBar,
  toggleNavDrawer,
  closeNavDrawer,
  toggleCartDropdown,
  closeCartDropdown,
  setCurrency,
  setQuickViewProduct,
  setSearchQuery,
} = uiSlice.actions;

/* ── Selectors (one source of truth) ────────────────────────────────────────── */

export const selectCurrency = (state: RootState) => state.ui.selectedCurrency;
export const selectCurrencyName = (state: RootState) => state.ui.currencyName;
export const selectCurrencyRate = (state: RootState) => state.ui.currencyRate;
export const selectIsArabCountry = (state: RootState) => state.ui.isArabCountry;
export const selectCountryCode = (state: RootState) => state.ui.countryCode;
export const selectIsDetectingCurrency = (state: RootState) =>
  state.ui.isDetectingCurrency;

export default uiSlice.reducer;