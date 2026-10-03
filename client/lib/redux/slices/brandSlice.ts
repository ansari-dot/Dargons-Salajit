import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface Brand {
  id: string;
  name: string;
  description?: string;
  /** Absolute, browser-usable URL of the logo uploaded from the admin panel */
  logoUrl: string;
  fileName?: string | null;
  isActive: boolean;
  createdAt?: string;
}

interface BrandState {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number;
}

const initialState: BrandState = {
  brands: [],
  loading: false,
  error: null,
  lastFetchedAt: 0,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Origin of the API (…:5000) derived from the API base URL. */
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/**
 * Brand logos are stored as absolute URLs built from whatever host the admin
 * used (usually `http://localhost:5000`). Rewrite them onto the API origin the
 * storefront is actually configured with, and keep relative `/uploads/...`
 * paths working too — otherwise a logo uploaded in development would 404 in
 * production.
 */
export const resolveBrandLogoUrl = (url?: string | null): string => {
  if (!url) return '';

  const value = String(url).trim();
  if (!value) return '';
  if (value.startsWith('data:') || value.startsWith('blob:')) return value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    } catch {
      return value;
    }
  }

  if (value.startsWith('//')) {
    return `${API_ORIGIN}${value.replace(/^\/\/[^/]+/, '')}`;
  }

  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
};

const isActiveFlag = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === true ||
  value === 1 ||
  value === '1' ||
  value === 'true';

/**
 * Async thunk: fetch the brands the admin marked as visible.
 * `cache: 'no-store'` + a cache buster so a freshly uploaded logo shows up on
 * the very next page load.
 */
export const fetchActiveBrands = createAsyncThunk<
  Brand[],
  void,
  { rejectValue: string }
>('brands/fetchActiveBrands', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(`${API_URL}/brands?active=true&t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch brands');
    }

    const json = await res.json();
    const raw = json?.data ?? json;

    if (!Array.isArray(raw)) return [];

    return raw
      .filter((brand: any) => brand && isActiveFlag(brand.is_active))
      .map((brand: any): Brand => ({
        id: String(brand.id),
        name: brand.name || '',
        description: brand.description || '',
        logoUrl: resolveBrandLogoUrl(brand.logo_url),
        fileName: brand.file_name ?? null,
        isActive: true,
        createdAt: brand.created_at,
      }))
      // A brand without a usable logo cannot be rendered in the slider.
      .filter((brand: Brand) => Boolean(brand.logoUrl));
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Unable to load brands');
  }
});

const brandSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    setBrands: (state, action: PayloadAction<Brand[]>) => {
      state.brands = action.payload;
      state.lastFetchedAt = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveBrands.fulfilled, (state, action) => {
        state.brands = action.payload;
        state.loading = false;
        state.error = null;
        state.lastFetchedAt = Date.now();

        console.log(
          'BRANDS LOADED:',
          action.payload.length,
          action.payload.map((brand) => brand.name)
        );
      })
      .addCase(fetchActiveBrands.rejected, (state, action) => {
        state.loading = false;
        // Keep whatever was already rendered instead of emptying the slider.
        state.error = action.payload || 'Unable to load brands';
        console.warn('Brands could not be loaded:', state.error);
      });
  },
});

export const { setBrands } = brandSlice.actions;

/* ── Selectors ──────────────────────────────────────────────────────────────── */

export const selectBrands = (state: RootState) => state.brands.brands;
export const selectBrandsLoading = (state: RootState) => state.brands.loading;
export const selectBrandsError = (state: RootState) => state.brands.error;

export default brandSlice.reducer;