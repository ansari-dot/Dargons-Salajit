import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FolderOpen, Leaf, Plus } from 'lucide-react';

interface UploadBrandHeaderProps {
  title?: string;
  subtitle?: string;
  /** Accent copy shown next to the illustration */
  tagline?: [string, string];
}

/**
 * Page header for the Upload Brand page: breadcrumb, title, description
 * and the "Build your brand / Grow your store" brand illustration.
 */
export const UploadBrandHeader: React.FC<UploadBrandHeaderProps> = ({
  title = 'Upload Brand',
  subtitle = 'Add a new brand to your store and showcase it to your customers.',
  tagline = ['Build your brand', 'Grow your store'],
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div className="min-w-0">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-500 truncate">{title}</span>
        </nav>

        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight mt-2">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>

      {/* Brand illustration */}
      <div className="hidden sm:flex items-center gap-4 shrink-0 pr-2">
        <div className="relative">
          <Leaf className="absolute -bottom-1 -left-3 w-7 h-7 text-emerald-200 -rotate-45" />
          <Leaf className="absolute -bottom-2 left-3 w-5 h-5 text-emerald-100 rotate-12" />

          <div className="relative w-[72px] h-[62px] rounded-2xl bg-[#E3EDFF] -rotate-6 flex items-center justify-center shadow-[0_6px_16px_rgba(37,99,235,0.12)]">
            <FolderOpen className="w-9 h-9 text-[#2563EB]" strokeWidth={1.75} />
            <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center ring-2 ring-white">
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            </span>
          </div>
        </div>

        <div className="relative">
          <p
            className="text-[15px] leading-[1.35] text-slate-600 font-semibold"
            style={{ fontFamily: "'Caveat', 'Segoe Script', 'Brush Script MT', cursive" }}
          >
            {tagline[0]}
            <br />
            {tagline[1]}
          </p>
          <svg
            viewBox="0 0 120 10"
            className="absolute -right-3 -bottom-3 w-[95px] h-[10px] text-[#2563EB]"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 7C26 2.5 62 2 118 5.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
