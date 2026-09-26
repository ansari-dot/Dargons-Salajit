import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  isTopBarVisible: boolean;
  isNavDrawerOpen: boolean;
  isCartDropdownOpen: boolean;
  selectedCurrency: string;
  quickViewProduct: any | null;
  searchQuery: string;
}

const initialState: UIState = {
  isTopBarVisible: true,
  isNavDrawerOpen: false,
  isCartDropdownOpen: false,
  selectedCurrency: 'PKR',
  quickViewProduct: null,
  searchQuery: '',
};

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
    },
    setQuickViewProduct: (state, action: PayloadAction<any | null>) => {
      state.quickViewProduct = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
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
