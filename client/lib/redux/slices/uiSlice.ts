import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UIState {
  isTopBarVisible: boolean;
  isNavDrawerOpen: boolean;
  isCartDropdownOpen: boolean;
  selectedCurrency: string;
  /** ISO country code detected for the visitor, e.g. 'PK' ('' when unknown) */
  countryCode: string;
  /** True once the visitor picks a currency manually from the header dropdown */
  isCurrencyManuallySet: boolean;
  quickViewProduct: any | null;
  searchQuery: string;
}

const initialState: UIState = {
  isTopBarVisible: true,
  isNavDrawerOpen: false,
  isCartDropdownOpen: false,
  selectedCurrency: 'PKR',
  countryCode: '',
  isCurrencyManuallySet: false,
  quickViewProduct: null,
  searchQuery: '',
};

/**
 * Async Thunk: Ask the server IP location tracker which currency to use.
 * Pakistan → PKR, every other country → USD.
 *
 * The detected country code is stored as well so checkout can apply the correct
 * delivery charges (flat ₨300 inside Pakistan, courier quote for other countries).
 */
export const fetchUserCurrency = createAsyncThunk(
  'ui/fetchUserCurrency',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/location`);
      if (!res.ok) {
        throw new Error('Failed to detect location');
      }

      const data = await res.json();
      const location = data?.location || {};
      const countryCode = String(location.countryCode || '').toUpperCase();

      // Pakistan → PKR, any other detected country → USD
      if (countryCode) {
        return { currency: countryCode === 'PK' ? 'PKR' : 'USD', countryCode };
      }

      // Country could not be resolved → keep the storefront's PKR base currency
      // instead of wrongly switching the visitor to USD
      return { currency: 'PKR', countryCode: '' };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Unable to detect location');
    }
  }
);

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
      state.selectedCurrency = action.payload;
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
    builder.addCase(fetchUserCurrency.fulfilled, (state, action) => {
      // Remember the detected country for the delivery charge rules
      state.countryCode = action.payload.countryCode;

      // Never override a currency the visitor selected manually
      if (!state.isCurrencyManuallySet) {
        state.selectedCurrency = action.payload.currency;
      }
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

export default uiSlice.reducer;
