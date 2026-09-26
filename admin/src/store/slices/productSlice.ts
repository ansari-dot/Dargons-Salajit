import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { productApiService, ProductItem, CreateProductPayload, UpdateProductPayload } from '../../services/productApiService';

export interface ProductState {
  items: ProductItem[];
  currentProduct: ProductItem | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: string;
}

const initialState: ProductState = {
  items: [],
  currentProduct: null,
  loading: false,
  actionLoading: false,
  error: null,
  searchQuery: '',
  categoryFilter: 'All',
};

// Async Thunk: Fetch all products
export const fetchProducts = createAsyncThunk(
  'adminProducts/fetchProducts',
  async (filters: { category?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const data = await productApiService.getAll(filters);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products from server');
    }
  }
);

// Async Thunk: Create product
export const createProduct = createAsyncThunk(
  'adminProducts/createProduct',
  async (payload: CreateProductPayload, { rejectWithValue }) => {
    try {
      const data = await productApiService.create(payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create product');
    }
  }
);

// Async Thunk: Update product
export const updateProduct = createAsyncThunk(
  'adminProducts/updateProduct',
  async ({ id, payload }: { id: number; payload: UpdateProductPayload }, { rejectWithValue }) => {
    try {
      const data = await productApiService.update(id, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product');
    }
  }
);

// Async Thunk: Delete product
export const deleteProduct = createAsyncThunk(
  'adminProducts/deleteProduct',
  async (id: number, { rejectWithValue }) => {
    try {
      await productApiService.delete(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
    }
  }
);

const productSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.categoryFilter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<ProductItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.actionLoading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<number>) => {
        state.actionLoading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, setCategoryFilter, clearError } = productSlice.actions;
export default productSlice.reducer;
