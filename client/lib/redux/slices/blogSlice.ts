import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface BlogPost {
  id: number | string;
  title: string;
  slug: string;
  author: string;
  excerpt: string;
  content: string;
  image: string;
  tags?: string[] | string | null;
  is_published?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

interface BlogState {
  blogs: BlogPost[];
  selectedBlog: BlogPost | null;
  loading: boolean;
  error: string | null;
}

const initialState: BlogState = {
  blogs: [],
  selectedBlog: null,
  loading: false,
  error: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Async thunk: Fetch all published blogs for storefront
export const fetchPublishedBlogs = createAsyncThunk(
  'blogs/fetchPublishedBlogs',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/blogs?isPublished=true`);
      if (!res.ok) {
        throw new Error('Failed to fetch blogs');
      }
      const json = await res.json();
      return json.data || json;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error fetching blog posts');
    }
  }
);

// Async thunk: Fetch single blog by ID or Slug
export const fetchBlogByIdOrSlug = createAsyncThunk(
  'blogs/fetchBlogByIdOrSlug',
  async (idOrSlug: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/blogs/${idOrSlug}`);
      if (!res.ok) {
        throw new Error('Blog post not found');
      }
      const json = await res.json();
      return json.data || json;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error fetching blog detail');
    }
  }
);

const blogSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    setSelectedBlog: (state, action: PayloadAction<BlogPost | null>) => {
      state.selectedBlog = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Published Blogs
      .addCase(fetchPublishedBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublishedBlogs.fulfilled, (state, action: PayloadAction<BlogPost[]>) => {
        state.loading = false;
        state.blogs = action.payload;
      })
      .addCase(fetchPublishedBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Single Blog
      .addCase(fetchBlogByIdOrSlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogByIdOrSlug.fulfilled, (state, action: PayloadAction<BlogPost>) => {
        state.loading = false;
        state.selectedBlog = action.payload;
      })
      .addCase(fetchBlogByIdOrSlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedBlog } = blogSlice.actions;
export default blogSlice.reducer;
