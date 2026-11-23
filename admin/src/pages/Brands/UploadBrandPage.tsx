import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, Tag, UploadCloud } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { UploadBrandHeader } from '../../components/brands/UploadBrandHeader';
import { BrandImageDropzone } from '../../components/brands/BrandImageDropzone';
import { BrandImagePreviewCard } from '../../components/brands/BrandImagePreviewCard';
import { BrandGuidelinesCard } from '../../components/brands/BrandGuidelinesCard';
import { brandsApi } from '../../services/brands.api';

const MAX_DESCRIPTION_LENGTH = 500;

export const UploadBrandPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build (and clean up) an object URL for the selected logo preview
  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const resetForm = () => {
    setBrandName('');
    setDescription('');
    setLogoFile(null);
    setImageError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandName.trim()) {
      toast.error('Brand name is required.');
      return;
    }

    if (!logoFile) {
      setImageError('Please select a brand logo image to upload.');
      toast.error('Please select a brand logo image to upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await brandsApi.createBrand({
        name: brandName,
        description,
        logo: logoFile,
      });

      toast.success(
        `Brand '${created.name}' uploaded successfully and is now available in your store.`,
        'Brand uploaded'
      );
      resetForm();
    } catch (error: any) {
      console.error('Failed to upload brand:', error);
      toast.error(error?.response?.data?.message || 'Brand upload failed. Please try again.', 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <UploadBrandHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ── Brand Information form ── */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Brand Information</h2>
              <p className="text-xs text-slate-400 mt-0.5">Fill in the details below to add a new brand.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Brand Logo / Image
              </label>
              <BrandImageDropzone
                file={logoFile}
                previewUrl={logoPreviewUrl}
                isUploading={isSubmitting}
                error={imageError}
                onFileSelect={(file) => {
                  setLogoFile(file);
                  setImageError(null);
                }}
                onClear={() => setLogoFile(null)}
              />
            </div>

            <div>
              <label htmlFor="brand-name" className="block text-xs font-semibold text-slate-700 mb-2">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="brand-name"
                  type="text"
                  name="name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter brand name"
                  maxLength={120}
                  required
                  className="w-full pl-10 pr-3.5 py-3 text-[13px] text-slate-800 bg-white border border-slate-200 rounded-xl placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="brand-description" className="block text-xs font-semibold text-slate-700 mb-2">
                Brand Description{' '}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  id="brand-description"
                  name="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Tell us about this brand..."
                  className="w-full pl-10 pr-3.5 py-3 pb-7 text-[13px] text-slate-800 bg-white border border-slate-200 rounded-xl placeholder-slate-400 resize-y transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="absolute bottom-2.5 right-3.5 text-[11px] text-slate-400">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/products')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                icon={
                  isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )
                }
              >
                {isSubmitting ? 'Uploading...' : 'Upload Brand'}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Preview + guidelines ── */}
        <Card className="p-5 space-y-5">
          <BrandImagePreviewCard previewUrl={logoPreviewUrl} brandName={brandName} />
          <div className="h-px bg-slate-100" />
          <BrandGuidelinesCard />
        </Card>
      </div>
    </div>
  );
};

export default UploadBrandPage;
