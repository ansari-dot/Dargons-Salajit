import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  togglePublishStatus,
  setSearchQuery,
  setStatusFilter,
  clearError,
} from '../../store/slices/blogSlice';
import { BlogItem } from '../../services/blogApiService';
import { uploadImageFile } from '../../services/uploadService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Globe,
  EyeOff,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Image as ImageIcon,
  UploadCloud,
} from 'lucide-react';

export const BlogPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, actionLoading, error, searchQuery, statusFilter } = useAppSelector(
    (state) => state.blogs
  );

  // Local Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    author: 'Arsalan Ansari',
    excerpt: '',
    content: '',
    image: '',
    tags: '',
    is_published: true,
  });

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleVal = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: titleVal,
      slug: editingBlog ? prev.slug : generateSlug(titleVal),
    }));
  };

  // Handle Manual Local Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setUploadError(null);
      const uploadedUrl = await uploadImageFile(file);
      setFormData((prev) => ({ ...prev, image: uploadedUrl }));
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Dispatch Redux Fetch on Mount & Filter Change
  useEffect(() => {
    const isPublishedParam =
      statusFilter === 'published' ? 'true' : statusFilter === 'draft' ? 'false' : 'all';

    dispatch(fetchBlogs({ search: searchQuery, isPublished: isPublishedParam }));
  }, [dispatch, searchQuery, statusFilter]);

  // Handle Form Submission for Create / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagArray = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const defaultImage = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80';

    if (editingBlog) {
      const result = await dispatch(
        updateBlog({
          id: editingBlog.id,
          payload: {
            title: formData.title,
            slug: formData.slug,
            author: formData.author,
            excerpt: formData.excerpt,
            content: formData.content,
            image: formData.image || defaultImage,
            tags: tagArray,
            is_published: formData.is_published,
          },
        })
      );
      if (updateBlog.fulfilled.match(result)) {
        setEditingBlog(null);
        resetForm();
      }
    } else {
      const result = await dispatch(
        createBlog({
          title: formData.title,
          slug: formData.slug || generateSlug(formData.title),
          author: formData.author || 'Arsalan Ansari',
          excerpt: formData.excerpt,
          content: formData.content,
          image: formData.image || defaultImage,
          tags: tagArray,
          is_published: formData.is_published,
        })
      );
      if (createBlog.fulfilled.match(result)) {
        setIsCreateModalOpen(false);
        resetForm();
      }
    }
  };

  // Open Edit Modal
  const handleEditClick = (blog: BlogItem) => {
    setEditingBlog(blog);
    let parsedTags = '';
    if (typeof blog.tags === 'string') {
      try {
        const arr = JSON.parse(blog.tags);
        parsedTags = Array.isArray(arr) ? arr.join(', ') : blog.tags;
      } catch {
        parsedTags = blog.tags;
      }
    } else if (Array.isArray(blog.tags)) {
      parsedTags = blog.tags.join(', ');
    }

    setFormData({
      title: blog.title,
      slug: blog.slug,
      author: blog.author || 'Arsalan Ansari',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      image: blog.image || '',
      tags: parsedTags,
      is_published: Boolean(blog.is_published),
    });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (deletingBlogId !== null) {
      await dispatch(deleteBlog(deletingBlogId));
      setDeletingBlogId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      author: 'Arsalan Ansari',
      excerpt: '',
      content: '',
      image: '',
      tags: '',
      is_published: true,
    });
    setUploadError(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Blog & CMS Articles</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage articles with manual file upload directly to backend storage.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setEditingBlog(null);
            setIsCreateModalOpen(true);
          }}
        >
          Publish New Article
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearError())}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Filters & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by article title or excerpt..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {(['all', 'published', 'draft'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => dispatch(setStatusFilter(tab))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. Articles Table / Grid */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading articles from backend database...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No blog posts found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No articles matched your search query "${searchQuery}".`
                : 'Your database has no blog posts. Click below to create your first article!'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
              >
                Create Article
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((art) => {
              const isPub = Boolean(art.is_published);
              return (
                <div
                  key={art.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Image Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 p-0.5 relative">
                      <img
                        src={
                          art.image ||
                          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={art.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isPub ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isPub ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">/{art.slug}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2">{art.excerpt}</p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {art.author || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {art.created_at ? new Date(art.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* Toggle Status */}
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(togglePublishStatus({ id: art.id, currentStatus: art.is_published }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isPub
                          ? 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={isPub ? 'Unpublish to Draft' : 'Publish to Store'}
                    >
                      {isPub ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      <span>{isPub ? 'Draft' : 'Publish'}</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleEditClick(art)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeletingBlogId(art.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 4. Create / Edit Blog Modal */}
      {(isCreateModalOpen || editingBlog) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingBlog ? 'Edit Blog Article' : 'Publish New Blog Article'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingBlog(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Article Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Health Benefits of Himalayan Shilajit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. health-benefits-himalayan-shilajit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Author & Image Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Arsalan Ansari"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* File Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Header Cover Image <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 border border-dashed border-blue-300 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-blue-600" />
                          <span>Choose Image File...</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  {uploadError && <p className="text-[11px] text-rose-600 mt-1">{uploadError}</p>}
                </div>
              </div>

              {/* Image Preview / Direct URL Input Fallback */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500">
                  Image URL / Upload Preview:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Upload image above or paste image URL..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {formData.image && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=120&q=80';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Excerpt / Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary displayed on article cards and search results..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Main Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Article Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write full article body text, HTML, or markdown content..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              {/* Tags & Publish Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Shilajit, Wellness, Science, ATP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-end pb-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Publish Immediately</span>
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingBlog(null);
                  }}
                >
                  Cancel
                </Button>

                <Button type="submit" variant="primary" size="sm" disabled={actionLoading || uploadingImage}>
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : editingBlog ? (
                    'Save Changes'
                  ) : (
                    'Publish Post'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deletingBlogId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Blog Article?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This action will permanently delete this article from your MySQL database.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingBlogId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete Post'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
