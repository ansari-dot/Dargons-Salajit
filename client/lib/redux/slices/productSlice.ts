import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  oldPrice?: number;
  /** Delivery charge (USD) for customers outside Pakistan — Normal speed */
  deliveryChargeUsd?: number;
  /** Delivery charge (USD) for customers outside Pakistan — Urgent speed */
  urgentDeliveryChargeUsd?: number;
  image: string;
  galleryImages?: string[];
  category: string;
  vendor?: string;
  size?: 'Large' | 'Medium' | 'Small' | string;
  description?: string;
  fullDescription?: string;
  featuresList?: string[];
  tags?: string[];
  rating?: number;
  stockQuantity?: number;
}

export interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  activeCategory: string;
  maxPrice: number;
  sortBy: string;
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  activeCategory: 'All',
  maxPrice: 10000,
  sortBy: 'alphabetical',
  loading: false,
  error: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Delivery charges come from the admin product form as optional USD amounts
 * (Admin → Products → Delivery Charges — Other Countries).
 */
const toOptionalUsd = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

// Async Thunk: Fetch products live from Express MySQL database
export const fetchStorefrontProducts = createAsyncThunk(
  'products/fetchStorefrontProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      const json = await res.json();
      const rawProducts = json.data || json;

      if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
        return [];
      }

      // Map DB fields to storefront Product model
      return rawProducts.map((p: any) => {
        let gallery: string[] = [];
        if (Array.isArray(p.gallery_images)) {
          gallery = p.gallery_images.map((g: any) => (typeof g === 'string' ? g : g.image_url));
        }
        const mainImg = p.main_image || '/shilajit-surp.png';
        if (!gallery.includes(mainImg)) {
          gallery.unshift(mainImg);
        }

        let parsedFeatures: string[] = [];
        if (p.features_list) {
          if (typeof p.features_list === 'string') {
            try {
              const arr = JSON.parse(p.features_list);
              parsedFeatures = Array.isArray(arr) ? arr : p.features_list.split('\n');
            } catch {
              parsedFeatures = p.features_list.split('\n').filter(Boolean);
            }
          } else if (Array.isArray(p.features_list)) {
            parsedFeatures = p.features_list;
          }
        }

        let parsedTags: string[] = [];
        if (p.tags) {
          if (typeof p.tags === 'string') {
            try {
              const arr = JSON.parse(p.tags);
              parsedTags = Array.isArray(arr) ? arr : p.tags.split(',');
            } catch {
              parsedTags = p.tags.split(',').map((t: string) => t.trim());
            }
          } else if (Array.isArray(p.tags)) {
            parsedTags = p.tags;
          }
        }

        return {
          id: String(p.id),
          name: p.name,
          sku: p.sku,
          price: Number(p.price),
          oldPrice: p.old_price ? Number(p.old_price) : undefined,
          deliveryChargeUsd: toOptionalUsd(p.delivery_charge_usd),
          urgentDeliveryChargeUsd: toOptionalUsd(p.urgent_delivery_charge_usd),
          image: mainImg,
          galleryImages: gallery.length > 0 ? gallery : [mainImg, '/popular_gold_jar.png', '/popular_drops.png'],
          category: p.category_name || p.category || 'Resin',
          vendor: p.vendor || 'Himalayan Surp',
          size: p.size && p.size !== 'Medium' ? p.size : '50g',
          description: p.short_description || p.full_description || '',
          fullDescription: p.full_description || p.short_description || '',
          featuresList: parsedFeatures,
          tags: parsedTags,
          rating: p.rating ? Number(p.rating) : 5.0,
          stockQuantity: p.stock_quantity !== undefined ? Number(p.stock_quantity) : 50,
        };
      });
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load products');
    }
  }
);

// Async Thunk: Fetch Single Product by ID or Slug
export const fetchStorefrontProductByIdOrSlug = createAsyncThunk(
  'products/fetchStorefrontProductByIdOrSlug',
  async (idOrSlug: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/products/${idOrSlug}`);
      if (!res.ok) {
        throw new Error('Product not found');
      }
      const json = await res.json();
      const p = json.data || json;

      let gallery: string[] = [];
      if (Array.isArray(p.gallery_images)) {
        gallery = p.gallery_images.map((g: any) => (typeof g === 'string' ? g : g.image_url));
      }
      const mainImg = p.main_image || '/shilajit-surp.png';
      if (!gallery.includes(mainImg)) {
        gallery.unshift(mainImg);
      }

      let parsedFeatures: string[] = [];
      if (p.features_list) {
        if (typeof p.features_list === 'string') {
          try {
            const arr = JSON.parse(p.features_list);
            parsedFeatures = Array.isArray(arr) ? arr : p.features_list.split('\n');
          } catch {
            parsedFeatures = p.features_list.split('\n').filter(Boolean);
          }
        } else if (Array.isArray(p.features_list)) {
          parsedFeatures = p.features_list;
        }
      }

      let parsedTags: string[] = [];
      if (p.tags) {
        if (typeof p.tags === 'string') {
          try {
            const arr = JSON.parse(p.tags);
            parsedTags = Array.isArray(arr) ? arr : p.tags.split(',');
          } catch {
            parsedTags = p.tags.split(',').map((t: string) => t.trim());
          }
        } else if (Array.isArray(p.tags)) {
          parsedTags = p.tags;
        }
      }

      return {
        id: String(p.id),
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        oldPrice: p.old_price ? Number(p.old_price) : undefined,
        image: mainImg,
        galleryImages: gallery.length > 0 ? gallery : [mainImg, '/popular_gold_jar.png', '/popular_drops.png'],
        category: p.category_name || p.category || 'Resin',
        vendor: p.vendor || 'Himalayan Surp',
        size: p.size && p.size !== 'Medium' ? p.size : '50g',
        description: p.short_description || p.full_description || '',
        fullDescription: p.full_description || p.short_description || '',
        featuresList: parsedFeatures,
        tags: parsedTags,
        rating: p.rating ? Number(p.rating) : 5.0,
        stockQuantity: p.stock_quantity !== undefined ? Number(p.stock_quantity) : 50,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error loading product details');
    }
  }
);

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<string>) => {
      state.activeCategory = action.payload;
    },
    setMaxPrice: (state, action: PayloadAction<number>) => {
      state.maxPrice = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStorefrontProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStorefrontProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchStorefrontProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Single Product
      .addCase(fetchStorefrontProductByIdOrSlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStorefrontProductByIdOrSlug.fulfilled, (state, action: PayloadAction<Product>) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchStorefrontProductByIdOrSlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCategory, setMaxPrice, setSortBy, setSelectedProduct } = productSlice.actions;

export default productSlice.reducer;
