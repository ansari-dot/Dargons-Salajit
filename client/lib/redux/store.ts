import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import cartReducer from './slices/cartSlice';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import wishlistReducer from './slices/wishlistSlice';
import blogReducer from './slices/blogSlice';
import brandReducer from './slices/brandSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    cart: cartReducer,
    auth: authReducer,
    products: productReducer,
    wishlist: wishlistReducer,
    blogs: blogReducer,
    brands: brandReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
