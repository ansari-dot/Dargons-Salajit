import React from 'react';
import { Check, Leaf, Lightbulb } from 'lucide-react';
import { BRAND_IMAGE_RULES } from '../../utils/imageValidation';

interface BrandGuidelinesCardProps {
  /** Extra checklist items appended after the default rules */
  extraGuidelines?: string[];
}

/**
 * Brand Guidelines panel: upload rules checklist + a helpful tip.
 * Kept as a section (no card wrapper) so the parent controls the container.
 */
export const BrandGuidelinesCard: React.FC<BrandGuidelinesCardProps> = ({ extraGuidelines = [] }) => {
  const guidelines = [
    'Use a clear and high-quality logo',
    `Supported formats: ${BRAND_IMAGE_RULES.label}`,
    `Maximum file size: ${BRAND_IMAGE_RULES.maxSizeMb}MB`,
    'Recommended size: 500 x 500 px (or higher)',
    ...extraGuidelines,
  ];

  return (
    <section className="space-y-3.5">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-500" />
        </span>
        <h3 className="text-[14.5px] font-bold text-slate-900 tracking-tight">Brand Guidelines</h3>
      </div>

      <ul className="space-y-2.5">
        {guidelines.map((guideline) => (
          <li key={guideline} className="flex items-start gap-2.5 text-[12.5px] text-slate-600">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-px" strokeWidth={3} />
            <span>{guideline}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
        <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[12px] leading-relaxed text-emerald-800">
          A great brand image helps your products look more professional and builds trust with
          customers.
        </p>
      </div>
    </section>
  );
};
