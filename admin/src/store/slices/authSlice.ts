import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface AdminUser {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// The axios interceptor reads `admin_token` from localStorage on every request
const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

const readStoredUser = (): AdminUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
};

const readStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);

const initialState: AdminAuthState = {
  user: typeof window !== 'undefined' ? readStoredUser() : null,
  token: typeof window !== 'undefined' ? readStoredToken() : null,
  isLoading: false,
  error: null,
};

// Async Thunk: Admin Login — same /auth/login endpoint, admin role enforced below
export const loginAdmin = createAsyncThunk(
  'adminAuth/loginAdmin',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const data = response.data;

      const user: AdminUser | undefined = data?.data?.user;
      if (!user || String(user.role || '').toLowerCase() !== 'admin') {
        return rejectWithValue('Access denied. Admin accounts only.');
      }

      return { user, accessToken: data?.data?.accessToken as string };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

// Async Thunk: Logout — clears server session (cookie) best-effort
export const logoutAdmin = createAsyncThunk('adminAuth/logoutAdmin', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    /* cookie may already be gone — local cleanup happens regardless */
  }
  return true;
});

export const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    logoutLocally: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginAdmin.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      loginAdmin.fulfilled,
      (state, action: PayloadAction<{ user: AdminUser; accessToken: string }>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        localStorage.setItem(TOKEN_KEY, action.payload.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      }
    );
    builder.addCase(loginAdmin.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Login failed';
    });
    builder.addCase(logoutAdmin.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    });
  },
});

export const { clearAuthError, logoutLocally } = adminAuthSlice.actions;

export default adminAuthSlice.reducer;