import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  vendor?: string;
}

export interface CartState {
  items: CartItem[];
  couponCode: string;
  discount: number; // percentage rate e.g. 0.1 for 10%
  discountAmount: number; // calculated fixed rupees discount
  couponError: string;
  couponMessage: string;
  isLoading: boolean;
}

const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('salajeet_cart');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('salajeet_cart', JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart to localStorage:', e);
  }
};

const getAuthHeaders = (token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Async Thunk: Fetch Database Cart for Logged-In User
export const fetchUserCart = createAsyncThunk(
  'cart/fetchUserCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/cart`, {
        method: 'GET',
        headers: getAuthHeaders(token),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch cart');
      return data.data; // array of database cart items
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error fetching cart');
    }
  }
);

// Async Thunk: Sync & Merge Local Guest Cart with Database Cart on Login
export const syncAndMergeCart = createAsyncThunk(
  'cart/syncAndMergeCart',
  async (localItems: CartItem[], { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/cart/merge`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ items: localItems }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to merge cart');
      return data.data; // merged database cart items
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error merging cart');
    }
  }
);

// Async Thunk: Add Item to Backend Database Cart
export const addToCartDb = createAsyncThunk(
  'cart/addToCartDb',
  async (item: { id: string; quantity?: number; size?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({
          productId: item.id,
          quantity: item.quantity || 1,
          size: item.size || '50g',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add item to cart');
      return data.data; // updated database cart items
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error adding item');
    }
  }
);

// Async Thunk: Update Cart Quantity in Backend Database
export const updateCartQuantityDb = createAsyncThunk(
  'cart/updateCartQuantityDb',
  async (payload: { id: string; quantity: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/cart/update`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({
          productId: payload.id,
          quantity: payload.quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update quantity');
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error updating quantity');
    }
  }
);

// Async Thunk: Remove Item from Backend Database
export const removeFromCartDb = createAsyncThunk(
  'cart/removeFromCartDb',
  async (productId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove item');
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error removing item');
    }
  }
);

// Async Thunk: Clear Entire Database Cart
export const clearCartDb = createAsyncThunk(
  'cart/clearCartDb',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/cart/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to clear cart');
      return [];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error clearing cart');
    }
  }
);

const initialState: CartState = {
  items: loadCartFromStorage(),
  couponCode: '',
  discount: 0,
  discountAmount: 0,
  couponError: '',
  couponMessage: '',
  isLoading: false,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) => {
      const existing = state.items.find((i) => String(i.id) === String(action.payload.id));
      const qtyToAdd = action.payload.quantity || 1;
      if (existing) {
        existing.quantity += qtyToAdd;
      } else {
        state.items.push({
          ...action.payload,
          id: String(action.payload.id),
          quantity: qtyToAdd,
        });
      }
      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => String(i.id) !== String(action.payload));
      saveCartToStorage(state.items);
    },

    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => String(i.id) === String(action.payload.id));
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => String(i.id) !== String(action.payload.id));
        } else {
          item.quantity = action.payload.quantity;
        }
      }
      saveCartToStorage(state.items);
    },

    setAppliedCouponSuccess: (
      state,
      action: PayloadAction<{ code: string; discountAmount: number; message: string }>
    ) => {
      state.couponCode = action.payload.code;
      state.discountAmount = action.payload.discountAmount;
      state.couponError = '';
      state.couponMessage = action.payload.message;
    },

    setAppliedCouponError: (state, action: PayloadAction<string>) => {
      state.couponError = action.payload;
      state.couponMessage = '';
    },

    removeCoupon: (state) => {
      state.couponCode = '';
      state.discount = 0;
      state.discountAmount = 0;
      state.couponError = '';
      state.couponMessage = '';
    },

    clearCart: (state) => {
      state.items = [];
      state.discount = 0;
      state.discountAmount = 0;
      state.couponCode = '';
      state.couponError = '';
      state.couponMessage = '';
      saveCartToStorage([]);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserCart
      .addCase(fetchUserCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.isLoading = false;
        state.items = action.payload;
        saveCartToStorage(action.payload);
      })
      .addCase(fetchUserCart.rejected, (state) => {
        state.isLoading = false;
      })

      // syncAndMergeCart
      .addCase(syncAndMergeCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        saveCartToStorage(action.payload);
      })

      // DB mutation thunks update state.items directly from server response
      .addCase(addToCartDb.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        saveCartToStorage(action.payload);
      })
      .addCase(updateCartQuantityDb.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        saveCartToStorage(action.payload);
      })
      .addCase(removeFromCartDb.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        saveCartToStorage(action.payload);
      })
      .addCase(clearCartDb.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        saveCartToStorage(action.payload);
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setAppliedCouponSuccess,
  setAppliedCouponError,
  removeCoupon,
  clearCart
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

export default cartSlice.reducer;
