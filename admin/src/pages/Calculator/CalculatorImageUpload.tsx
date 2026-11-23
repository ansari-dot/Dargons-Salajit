import React, { useRef, useState } from 'react';
import { Loader2, Trash2, UploadCloud } from 'lucide-react';
import { uploadImageFile } from '../../services/uploadService';
import {
  BRAND_IMAGE_RULES,
  describeImageRules,
  validateImageFile,
} from '../../utils/imageValidation';
import './CalculatorImageUpload.css';

interface CalculatorImageUploadProps {
  value?: string | null;
  onChange: (imageUrl: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export const CalculatorImageUpload: React.FC<CalculatorImageUploadProps> = ({
  value,
  onChange,
  onUploadingChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;

    const validationError = validateImageFile(file, BRAND_IMAGE_RULES);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const imageUrl = await uploadImageFile(file);
      if (!imageUrl) throw new Error('The image upload response did not include a URL.');
      onChange(imageUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="calculator-image-upload">
      {value && (
        <div className="calculator-image-upload__preview">
          <img src={value} alt="Product preview" />
          <button
            type="button"
            className="calculator-image-upload__remove"
            onClick={() => onChange('')}
            disabled={isUploading}
            aria-label="Remove image"
          >
            <Trash2 />
          </button>
        </div>
      )}
      <div className="calculator-image-upload__control">
        <input
          ref={inputRef}
          type="file"
          accept={BRAND_IMAGE_RULES.accept}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            void handleFile(file);
          }}
          disabled={isUploading}
        />
        <button
          type="button"
          className="calculator-image-upload__button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="calculator-image-upload__spinner" /> : <UploadCloud />}
          {isUploading ? 'Uploading image...' : value ? 'Change image' : 'Upload image'}
        </button>
        <span className="calculator-image-upload__hint">{describeImageRules(BRAND_IMAGE_RULES)}</span>
      </div>
      {error && <p className="calculator-image-upload__error" role="alert">{error}</p>}
    </div>
  );
};
