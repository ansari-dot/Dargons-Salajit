import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/common/Toast';
import { galleryApi, GalleryItem, CreateGalleryPayload } from '../../services/gallery.api';
import { uploadSingleImageFile } from '../../services/uploadService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  X, 
  Search,
  Upload,
  Eye,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const toast = useToast();

  // Form State
  const [formData, setFormData] = useState<CreateGalleryPayload>({
    title: '',
    category: 'Nature',
    image_url: '',
    caption: '',
    display_order: 1,
    is_active: true
  });

  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const data = await galleryApi.getGalleryItems();
      setGalleryItems(data);
    } catch (err) {
      console.error('Failed to load gallery items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadSingleImageFile(file);
      setFormData(prev => ({ ...prev, image_url: url }));
      toast.success('Gallery photo uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleStatus = async (id: string | number, title: string) => {
    try {
      const updated = await galleryApi.toggleStatus(id);
      setGalleryItems(prev => prev.map(item => item.id === id ? { ...item, is_active: updated.is_active } : item));
      toast.success(`Gallery photo '${title}' status updated.`);
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update photo status.');
    }
  };

  const handleDeleteItem = async (id: string | number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete '${title}' from gallery?`)) return;

    try {
      await galleryApi.deleteGalleryItem(id);
      setGalleryItems(prev => prev.filter(item => item.id !== id));
      toast.success(`Photo '${title}' deleted successfully.`);
    } catch (error) {
      console.error('Failed to delete gallery item:', error);
      toast.error('Failed to delete photo.');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Nature',
      image_url: '',
      caption: '',
      display_order: galleryItems.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      image_url: item.image_url,
      caption: item.caption || '',
      display_order: item.display_order || 1,
      is_active: Boolean(item.is_active)
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      toast.error('Title and Image are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateGalleryPayload = {
        title: formData.title.trim(),
        category: formData.category,
        image_url: formData.image_url.trim(),
        caption: formData.caption,
        display_order: Number(formData.display_order) || 1,
        is_active: Boolean(formData.is_active)
      };

      if (editingItem) {
        const updated = await galleryApi.updateGalleryItem(editingItem.id, payload);
        setGalleryItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
        toast.success(`Gallery photo '${updated.title}' updated successfully.`);
      } else {
        const created = await galleryApi.createGalleryItem(payload);
        setGalleryItems(prev => [created, ...prev]);
        toast.success(`Gallery photo '${created.title}' added successfully!`);
      }

      setIsModalOpen(false);
      loadGallery();
    } catch (error: any) {
      console.error('Error saving gallery item:', error);
      toast.error(error.response?.data?.message || 'Failed to save gallery item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = galleryItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.caption && item.caption.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Nature', 'Product', 'Process', 'Lifestyle', 'Certificates'];

  // Metrics
  const totalItemsCount = galleryItems.length;
  const activeItemsCount = galleryItems.filter(i => i.is_active).length;
  const uniqueCategoriesCount = new Set(galleryItems.map(i => i.category)).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gallery Showcase</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Live REST API
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage high-resolution showcase photos, mountain sourcing images, and certificates displayed on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadGallery}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenCreateModal}
          >
            Add Photo
          </Button>
        </div>
      </div>


      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Gallery Photos</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalItemsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Photos</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeItemsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Unique Categories</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{uniqueCategoriesCount}</h3>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search photo title or caption..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Gallery Cards Grid */}
      {isLoading ? (
        <Card className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading showcase photos from database...</p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-700">No Gallery Photos Found</p>
          <p className="text-xs text-slate-400 mt-1">Add new photos or clear search query.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group flex flex-col justify-between">
              <div>
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={item.image_url || '/herosection.png'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id, item.title)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors shadow-xs ${
                        item.is_active
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800/80 text-white backdrop-blur-xs'
                      }`}
                    >
                      {item.is_active ? 'ACTIVE' : 'PAUSED'}
                    </button>
                  </div>
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs truncate" title={item.title}>
                    {item.title}
                  </h4>
                  {item.caption && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3.5 pt-0 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Order: #{item.display_order || 0}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    title="Edit Photo"
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    title="Delete Photo"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? `Edit Photo '${editingItem.title}'` : 'Add New Showcase Photo'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Photo Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Pure Shilajit Extraction at Altitude"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Nature">Nature</option>
                    <option value="Product">Product</option>
                    <option value="Process">Process</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Certificates">Certificates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    min="1"
                    value={formData.display_order || 1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Cover Image Upload / Dropzone */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Upload Photo *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    id="gallery-file-input"
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-file-input"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Choose File'}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {formData.image_url ? 'Photo selected' : 'No file chosen'}
                  </span>
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Or paste image URL (e.g. /herosection.png)"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {formData.image_url && (
                  <div className="mt-2.5 h-28 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Caption / Subtitle</label>
                <textarea
                  name="caption"
                  rows={2}
                  value={formData.caption}
                  onChange={handleInputChange}
                  placeholder="Optional brief description..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={Boolean(formData.is_active)}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Display Photo in Storefront Gallery</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || uploadingImage}
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Photo' : 'Add Photo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
