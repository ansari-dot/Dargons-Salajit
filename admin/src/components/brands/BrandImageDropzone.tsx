import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react';
import {
  BRAND_IMAGE_RULES,
  describeImageRules,
  formatFileSize,
  validateImageFile,
} from '../../utils/imageValidation';

interface BrandImageDropzoneProps {
  /** Currently selected logo file (kept in the parent form state) */
  file: File | null;
  /** Object URL used for the live preview */
  previewUrl?: string | null;
  /** Shows a spinner while the brand is being submitted */
  isUploading?: boolean;
  /** Error reported by the parent (validation or API) */
  error?: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Drag & drop / click-to-browse upload area for the brand logo image.
 * Handles its own drag state and client side validation, and reports the
 * selected file up to the parent form.
 */
export const BrandImageDropzone: React.FC<BrandImageDropzoneProps> = ({
  file,
  previewUrl,
  isUploading = false,
  error,
  onFileSelect,
  onClear,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const openFilePicker = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const handleFile = (selected?: File | null) => {
    if (!selected) return;

    const validationError = validateImageFile(selected, BRAND_IMAGE_RULES);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    onFileSelect(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    // Reset so selecting the same file again still triggers a change event
    e.target.value = '';
  };

  const message = error || localError;

  // ── Selected file summary ──────────────────────────────────────────────────
  if (file) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/70">
          <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {previewUrl ? (
              <img src={previewUrl} alt={file.name} className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatFileSize(file.size)} • Ready to upload
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              onClear();
            }}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Remove image"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>

        {message && <p className="text-[11px] font-medium text-rose-600">{message}</p>}
      </div>
    );
  }

  // ── Empty drop area ────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload brand image"
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-1.5 px-4 py-9 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60'
            : message
              ? 'border-rose-300 bg-rose-50/30'
              : 'border-slate-200 bg-slate-50/40 hover:border-blue-400 hover:bg-blue-50/40'
        } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="w-12 h-12 rounded-full bg-[#E8F1FF] flex items-center justify-center mb-1.5">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-[#2563EB]" strokeWidth={1.9} />
          )}
        </div>

        <p className="text-[13.5px] font-bold text-slate-800">
          {isUploading ? 'Uploading your brand image...' : 'Drag & drop your brand image here'}
        </p>
        <p className="text-xs text-slate-500">
          or <span className="text-[#2563EB] font-semibold underline underline-offset-2">click to browse</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-1.5">{describeImageRules(BRAND_IMAGE_RULES)}</p>

        <input
          ref={inputRef}
          type="file"
          accept={BRAND_IMAGE_RULES.accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {message && <p className="text-[11px] font-medium text-rose-600">{message}</p>}
    </div>
  );
};
