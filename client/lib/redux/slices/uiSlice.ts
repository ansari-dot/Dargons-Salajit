import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UIState {
  isTopBarVisible: boolean;
  isNavDrawerOpen: boolean;
  isCartDropdownOpen: boolean;
  selectedCurrency: string;
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
  isCurrencyManuallySet: false,
  quickViewProduct: null,
  searchQuery: '',
};

/**
 * Async Thunk: Ask the server IP location tracker which currency to use.
 * Pakistan → PKR, every other country → USD.
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
        return countryCode === 'PK' ? 'PKR' : 'USD';
      }

      // Country could not be resolved → keep the storefront's PKR base currency
      // instead of wrongly switching the visitor to USD
      return 'PKR';
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
      // Never override a currency the visitor selected manually
      if (!state.isCurrencyManuallySet) {
        state.selectedCurrency = action.payload;
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
