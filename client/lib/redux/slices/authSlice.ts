import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: number | string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  phone?: string;
  street_address?: string;
  city?: string;
  postal_code?: string;
  role?: 'customer' | 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async Thunk: Register User
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send & receive HTTP-only cookies
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors ? data.errors.join(', ') : data.message || 'Registration failed';
        return rejectWithValue(errorMsg);
      }

      return data.data; // contains { user, accessToken }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Server connection error');
    }
  }
);

// Async Thunk: Login User
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send & receive HTTP-only cookies
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors ? data.errors.join(', ') : data.message || 'Login failed';
        return rejectWithValue(errorMsg);
      }

      return data.data; // contains { user, accessToken }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Server connection error');
    }
  }
);

// Async Thunk: Logout User
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return true;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Logout failed');
    }
  }
);

// Async Thunk: Check Auth Session on Page Refresh
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue('Unauthenticated');
      }

      return data.data; // user object
    } catch (err: any) {
      return rejectWithValue('Unauthenticated');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    logoutLocally: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Register User
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login User
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout User
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Check Auth Status
    builder.addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(checkAuthStatus.rejected, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearAuthError, logoutLocally } = authSlice.actions;

export default authSlice.reducer;
