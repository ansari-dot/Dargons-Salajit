export interface ImageValidationRules {
  allowedTypes: string[];
  allowedExtensions: string[];
  /** Human readable list used in the UI hint text, e.g. "PNG, JPG, WEBP" */
  label: string;
  maxSizeMb: number;
  /** Value for the file input `accept` attribute */
  accept: string;
}

export const BRAND_IMAGE_RULES: ImageValidationRules = {
  allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
  label: 'PNG, JPG, WEBP',
  maxSizeMb: 5,
  accept: 'image/png,image/jpeg,image/webp',
};

/** "PNG, JPG, WEBP • Max size 5MB" */
export const describeImageRules = (rules: ImageValidationRules = BRAND_IMAGE_RULES): string =>
  `${rules.label} • Max size ${rules.maxSizeMb}MB`;

/** Human readable file size, e.g. 842 KB / 2.4 MB */
export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Validates an image file against the given rules.
 * @returns an error message, or `null` when the file is valid.
 */
export const validateImageFile = (file: File, rules: ImageValidationRules = BRAND_IMAGE_RULES): string | null => {
  const extension = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
  const isAllowedType =
    rules.allowedTypes.includes(file.type) || rules.allowedExtensions.includes(extension);

  if (!isAllowedType) {
    return `Invalid format. Supported formats: ${rules.label}.`;
  }

  if (file.size > rules.maxSizeMb * 1024 * 1024) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is ${rules.maxSizeMb}MB.`;
  }

  return null;
};
