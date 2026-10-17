import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import blogReducer from './slices/blogSlice';
import productReducer from './slices/productSlice';
import adminAuthReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    blogs: blogReducer,
    products: productReducer,
    adminAuth: adminAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
