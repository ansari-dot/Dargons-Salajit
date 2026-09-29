import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface BrandImagePreviewCardProps {
  previewUrl?: string | null;
  brandName?: string;
}

/**
 * Live preview of the brand logo that is about to be uploaded.
 * Rendered as a section (no card wrapper) so it can be composed
 * inside any container.
 */
export const BrandImagePreviewCard: React.FC<BrandImagePreviewCardProps> = ({
  previewUrl,
  brandName,
}) => {
  return (
    <section>
      <h3 className="text-[14.5px] font-bold text-slate-900 tracking-tight">Image Preview</h3>
      <p className="text-xs text-slate-400 mt-0.5">Your brand image will appear here</p>

      <div className="mt-3.5 h-[210px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-center p-4 overflow-hidden">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={brandName?.trim() || 'Brand logo preview'}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="w-[74px] h-[74px] rounded-full bg-slate-200/70 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-slate-400" strokeWidth={1.8} />
          </div>
        )}
      </div>

      {previewUrl && brandName?.trim() && (
        <p className="text-[11px] font-semibold text-slate-500 text-center mt-2.5 truncate">
          {brandName.trim()}
        </p>
      )}
    </section>
  );
};
