import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  setSearchQuery,
  setCategoryFilter,
  clearError,
} from '../../store/slices/productSlice';
import { ProductItem } from '../../services/productApiService';
import { uploadImageFile, uploadMultipleImageFiles } from '../../services/uploadService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  UploadCloud,
  Package,
  Star,
  Images,
  Layers,
  FileText,
} from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: 'Resin' },
  { id: 2, name: 'Capsules' },
  { id: 3, name: 'Extract' },
  { id: 4, name: 'Honey' },
  { id: 5, name: 'Bundles' },
];

export const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, actionLoading, error, searchQuery, categoryFilter } = useAppSelector(
    (state) => state.products
  );

  // Local Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    category_id: 1,
    price: '',
    old_price: '',
    vendor: 'Himalayan Surp',
    size: 'Medium',
    rating: '5.0',
    stock_quantity: '50',
    main_image: '',
    gallery_images: [] as string[],
    short_description: '',
    full_description: '',
    features_list: '',
    tags: '',
  });

  // Auto-generate slug and SKU
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: editingProduct ? prev.slug : generateSlug(val),
      sku: editingProduct
        ? prev.sku
        : `SKU-${val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
    }));
  };

  // Handle Main Image File Upload via Multer
  const handleMainFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setUploadError(null);
      const uploadedUrl = await uploadImageFile(file);
      setFormData((prev) => {
        const updatedGallery = prev.gallery_images.includes(uploadedUrl)
          ? prev.gallery_images
          : [uploadedUrl, ...prev.gallery_images];
        return { ...prev, main_image: uploadedUrl, gallery_images: updatedGallery };
      });
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Additional Gallery Image File Upload
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      setUploadError(null);
      const uploadedUrls = await uploadMultipleImageFiles(files);

      setFormData((prev) => ({
        ...prev,
        main_image: prev.main_image || uploadedUrls[0] || '',
        gallery_images: Array.from(new Set([...prev.gallery_images, ...uploadedUrls])),
      }));
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Gallery upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove single image from gallery
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const newGallery = prev.gallery_images.filter((_, idx) => idx !== indexToRemove);
      const newMain = newGallery.length > 0 ? newGallery[0] : '';
      return { ...prev, gallery_images: newGallery, main_image: prev.main_image === prev.gallery_images[indexToRemove] ? newMain : prev.main_image };
    });
  };

  // Dispatch Redux Fetch on Mount & Filter Change
  useEffect(() => {
    dispatch(fetchProducts({ search: searchQuery, category: categoryFilter }));
  }, [dispatch, searchQuery, categoryFilter]);

  // Form Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceVal = parseFloat(formData.price) || 0;
    const oldPriceVal = formData.old_price ? parseFloat(formData.old_price) : undefined;
    const stockVal = parseInt(formData.stock_quantity, 10) || 0;
    const ratingVal = parseFloat(formData.rating) || 5.0;
    const defaultImage =
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';

    const mainImg = formData.main_image || defaultImage;
    const galleryArr = Array.from(
      new Set([mainImg, ...formData.gallery_images].filter(Boolean))
    );

    const tagArray = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const featureArray = formData.features_list
      ? formData.features_list.split('\n').map((f) => f.trim()).filter(Boolean)
      : [];

    if (editingProduct) {
      const result = await dispatch(
        updateProduct({
          id: editingProduct.id,
          payload: {
            name: formData.name,
            slug: formData.slug,
            sku: formData.sku,
            category_id: Number(formData.category_id),
            price: priceVal,
            old_price: oldPriceVal,
            vendor: formData.vendor,
            size: formData.size,
            rating: ratingVal,
            stock_quantity: stockVal,
            main_image: formData.main_image || defaultImage,
            gallery_images: galleryArr,
            short_description: formData.short_description,
            full_description: formData.full_description,
            features_list: featureArray as any,
            tags: tagArray,
          },
        })
      );
      if (updateProduct.fulfilled.match(result)) {
        setIsModalOpen(false);
        setEditingProduct(null);
        resetForm();
      }
    } else {
      const result = await dispatch(
        createProduct({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          sku:
            formData.sku ||
            `SKU-${formData.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}-${Math.floor(
              100 + Math.random() * 900
            )}`,
          category_id: Number(formData.category_id),
          price: priceVal,
          old_price: oldPriceVal,
          vendor: formData.vendor || 'Himalayan Surp',
          size: formData.size || 'Medium',
          rating: ratingVal,
          stock_quantity: stockVal,
          main_image: formData.main_image || defaultImage,
          gallery_images: galleryArr,
          short_description: formData.short_description,
          full_description: formData.full_description,
          features_list: featureArray as any,
          tags: tagArray,
        })
      );
      if (createProduct.fulfilled.match(result)) {
        setIsModalOpen(false);
        resetForm();
      }
    }
  };

  // Open Edit Modal
  const handleEditClick = (product: ProductItem) => {
    setEditingProduct(product);

    let gallery: string[] = [];
    if (Array.isArray(product.gallery_images)) {
      gallery = product.gallery_images.map((g: any) => (typeof g === 'string' ? g : g.image_url));
    }
    if (!gallery.includes(product.main_image) && product.main_image) {
      gallery.unshift(product.main_image);
    }

    let parsedFeatures = '';
    if (typeof product.features_list === 'string') {
      try {
        const arr = JSON.parse(product.features_list);
        parsedFeatures = Array.isArray(arr) ? arr.join('\n') : product.features_list;
      } catch {
        parsedFeatures = product.features_list;
      }
    } else if (Array.isArray(product.features_list)) {
      parsedFeatures = product.features_list.join('\n');
    }

    let parsedTags = '';
    if (typeof product.tags === 'string') {
      try {
        const arr = JSON.parse(product.tags);
        parsedTags = Array.isArray(arr) ? arr.join(', ') : product.tags;
      } catch {
        parsedTags = product.tags;
      }
    } else if (Array.isArray(product.tags)) {
      parsedTags = product.tags.join(', ');
    }

    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      category_id: product.category_id || 1,
      price: product.price ? product.price.toString() : '',
      old_price: product.old_price ? product.old_price.toString() : '',
      vendor: product.vendor || 'Himalayan Surp',
      size: product.size || 'Medium',
      rating: product.rating ? product.rating.toString() : '5.0',
      stock_quantity: product.stock_quantity !== undefined ? product.stock_quantity.toString() : '50',
      main_image: product.main_image || '',
      gallery_images: gallery,
      short_description: product.short_description || '',
      full_description: product.full_description || '',
      features_list: parsedFeatures,
      tags: parsedTags,
    });
    setIsModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (deletingProductId !== null) {
      await dispatch(deleteProduct(deletingProductId));
      setDeletingProductId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      sku: '',
      category_id: 1,
      price: '',
      old_price: '',
      vendor: 'Himalayan Surp',
      size: 'Medium',
      rating: '5.0',
      stock_quantity: '50',
      main_image: '',
      gallery_images: [],
      short_description: '',
      full_description: '',
      features_list: '',
      tags: '',
    });
    setUploadError(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your product SKUs, multiple gallery images, detailed features, and inventory.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
        >
          Add New Product
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

      {/* 2. Filters and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['All', 'Resin', 'Capsules', 'Extract', 'Honey', 'Bundles'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => dispatch(setCategoryFilter(cat))}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${categoryFilter === cat
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* 3. Products Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading product catalog from database...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No products matched your search query "${searchQuery}".`
                : 'Your store database has no products yet. Click below to add your first product!'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                Add Product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category / Vendor</th>
                  <th className="py-3.5 px-4 text-right">Price</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                  <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((p) => {
                  const isStocked = (p.stock_quantity ?? 0) > 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 p-0.5 relative">
                            <img
                              src={
                                p.main_image ||
                                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80'
                              }
                              alt={p.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80';
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">
                              {p.short_description || `Size: ${p.size || 'Medium'}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.sku}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{p.category_name || 'Shilajit'}</span>
                        <p className="text-[10px] text-slate-400">{p.vendor || 'Himalayan Surp'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(p.price)}</span>
                        {p.old_price && (
                          <p className="text-[10px] text-slate-400 line-through">
                            {formatCurrency(p.old_price)}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${isStocked
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                          {p.stock_quantity ?? 0} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{p.rating || 5.0}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditClick(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProductId(p.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product SKU & Details' : 'Add New Product to Store'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. SHILAJIT SURP 50ML"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. SKU-SHILAJIT-50ML"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Price, Old Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sale Price (PKR / USD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="2500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Compare-At / Old Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.old_price}
                    onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
                    placeholder="3500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category, Vendor, Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor / Brand</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Himalayan Surp"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Weight / Size Option</label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Small">Small (30ml / 30g)</option>
                    <option value="Medium">Medium (50ml / 50g)</option>
                    <option value="Large">Large (100ml / 100g)</option>
                  </select>
                </div>
              </div>

              {/* Main Image & Multiple Gallery File Upload Dropzone */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Multiple Product Images (Multer Upload) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 border border-dashed border-blue-300 rounded-xl font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Uploading Main...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-blue-600" />
                        <span>Upload Main Cover Image...</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>

                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-50 border border-dashed border-purple-300 rounded-xl font-semibold text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Uploading Gallery...</span>
                      </>
                    ) : (
                      <>
                        <Images className="w-4 h-4 text-purple-600" />
                        <span>+ Add Multiple Gallery Photos...</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {uploadError && <p className="text-[11px] text-rose-600">{uploadError}</p>}

                {/* Gallery Images Thumbnail Strip */}
                {formData.gallery_images.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      Gallery Photos ({formData.gallery_images.length}): Click main tag or X to remove
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {formData.gallery_images.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 bg-slate-100 group shrink-0 ${formData.main_image === img ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'
                            }`}
                        >
                          <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, main_image: img }))}
                            className="absolute inset-0 bg-black/40 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-0.5"
                          >
                            Set Main
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs z-10"
                            title="Remove Photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Short & Full Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Card Summary</label>
                  <textarea
                    rows={3}
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Pure Himalayan Shilajit Extract. Rich in 85+ trace minerals..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    placeholder="Full product background, scientific extraction process..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Product Features List (Bullet Points) & Search Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Features List (One Feature Per Line)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.features_list}
                    onChange={(e) => setFormData({ ...formData, features_list: e.target.value })}
                    placeholder="85+ Trace Mineral Matrix&#10;100% Pure Himalayan Extraction&#10;Third-Party Lab Tested"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Search Tags (Comma Separated)</label>
                  <textarea
                    rows={3}
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Shilajit, Organic, Resin, Extract, Premium, Energy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
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
                  ) : editingProduct ? (
                    'Save Product Changes'
                  ) : (
                    'Publish Product'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deletingProductId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Product SKU?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently delete this product SKU and inventory record from your database.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingProductId(null)}
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
                {actionLoading ? 'Deleting...' : 'Yes, Delete Product'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
