import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from './productSlice';
import { RootState } from '../store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface WishlistState {
  items: Product[];
  isLoading: boolean;
}

const loadWishlistFromStorage = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('salajeet_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load wishlist from localStorage:', e);
    return [];
  }
};

const saveWishlistToStorage = (items: Product[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('salajeet_wishlist', JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save wishlist to localStorage:', e);
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

// Async Thunk: Fetch Database Wishlist for Logged-In User
export const fetchUserWishlist = createAsyncThunk(
  'wishlist/fetchUserWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'GET',
        headers: getAuthHeaders(token),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch wishlist');
      return data.data; // array of database wishlist items
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error fetching wishlist');
    }
  }
);

// Async Thunk: Sync & Merge Local Guest Wishlist with Database Wishlist on Login
export const syncAndMergeWishlist = createAsyncThunk(
  'wishlist/syncAndMergeWishlist',
  async (localItems: Product[], { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/wishlist/merge`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ items: localItems }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to merge wishlist');
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error merging wishlist');
    }
  }
);

// Async Thunk: Toggle Wishlist Item in Backend Database
export const toggleWishlistDb = createAsyncThunk(
  'wishlist/toggleWishlistDb',
  async (product: Product, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update wishlist');
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error toggling wishlist item');
    }
  }
);

// Async Thunk: Remove Item from Backend Database Wishlist
export const removeFromWishlistDb = createAsyncThunk(
  'wishlist/removeFromWishlistDb',
  async (productId: string | number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const res = await fetch(`${API_BASE_URL}/wishlist/item/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove wishlist item');
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error removing wishlist item');
    }
  }
);

const initialState: WishlistState = {
  items: loadWishlistFromStorage(),
  isLoading: false,
};

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const index = state.items.findIndex((item) => String(item.id) === String(action.payload.id));
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.push(action.payload);
      }
      saveWishlistToStorage(state.items);
    },
    removeFromWishlist: (state, action: PayloadAction<string | number>) => {
      state.items = state.items.filter((item) => String(item.id) !== String(action.payload));
      saveWishlistToStorage(state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      saveWishlistToStorage([]);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserWishlist.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.isLoading = false;
        state.items = action.payload;
        saveWishlistToStorage(action.payload);
      })
      .addCase(fetchUserWishlist.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(syncAndMergeWishlist.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.items = action.payload;
        saveWishlistToStorage(action.payload);
      })

      .addCase(toggleWishlistDb.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.items = action.payload;
        saveWishlistToStorage(action.payload);
      })

      .addCase(removeFromWishlistDb.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.items = action.payload;
        saveWishlistToStorage(action.payload);
      });
  },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;

export const selectWishlistItems = (state: { wishlist: WishlistState }) => state.wishlist.items || [];
export const selectWishlistCount = (state: { wishlist: WishlistState }) => (state.wishlist.items ? state.wishlist.items.length : 0);

export default wishlistSlice.reducer;
