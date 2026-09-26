import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { blogApiService, BlogItem, CreateBlogPayload, UpdateBlogPayload } from '../../services/blogApiService';

export interface BlogState {
  items: BlogItem[];
  currentBlog: BlogItem | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: 'all' | 'published' | 'draft';
}

const initialState: BlogState = {
  items: [],
  currentBlog: null,
  loading: false,
  actionLoading: false,
  error: null,
  searchQuery: '',
  statusFilter: 'all',
};

// Async Thunk: Fetch all blogs
export const fetchBlogs = createAsyncThunk(
  'blogs/fetchBlogs',
  async (filters: { search?: string; isPublished?: string } | undefined, { rejectWithValue }) => {
    try {
      const data = await blogApiService.getAll(filters);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch blogs from database');
    }
  }
);

// Async Thunk: Create a new blog post
export const createBlog = createAsyncThunk(
  'blogs/createBlog',
  async (payload: CreateBlogPayload, { rejectWithValue }) => {
    try {
      const data = await blogApiService.create(payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create blog post');
    }
  }
);

// Async Thunk: Update an existing blog post
export const updateBlog = createAsyncThunk(
  'blogs/updateBlog',
  async ({ id, payload }: { id: number; payload: UpdateBlogPayload }, { rejectWithValue }) => {
    try {
      const data = await blogApiService.update(id, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update blog post');
    }
  }
);

// Async Thunk: Delete a blog post
export const deleteBlog = createAsyncThunk(
  'blogs/deleteBlog',
  async (id: number, { rejectWithValue }) => {
    try {
      await blogApiService.delete(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete blog post');
    }
  }
);

// Async Thunk: Quick Toggle Publish Status
export const togglePublishStatus = createAsyncThunk(
  'blogs/togglePublishStatus',
  async ({ id, currentStatus }: { id: number; currentStatus: boolean | number }, { rejectWithValue }) => {
    try {
      const newStatus = !currentStatus;
      const data = await blogApiService.update(id, { is_published: newStatus });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle publish status');
    }
  }
);

const blogSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | 'published' | 'draft'>) => {
      state.statusFilter = action.payload;
    },
    setCurrentBlog: (state, action: PayloadAction<BlogItem | null>) => {
      state.currentBlog = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Blogs
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action: PayloadAction<BlogItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Blog
      .addCase(createBlog.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createBlog.fulfilled, (state, action: PayloadAction<BlogItem>) => {
        state.actionLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // Update Blog
      .addCase(updateBlog.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateBlog.fulfilled, (state, action: PayloadAction<BlogItem>) => {
        state.actionLoading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // Delete Blog
      .addCase(deleteBlog.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteBlog.fulfilled, (state, action: PayloadAction<number>) => {
        state.actionLoading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      // Toggle Publish Status
      .addCase(togglePublishStatus.fulfilled, (state, action: PayloadAction<BlogItem>) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { setSearchQuery, setStatusFilter, setCurrentBlog, clearError } = blogSlice.actions;
export default blogSlice.reducer;
