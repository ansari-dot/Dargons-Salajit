import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: (string | DropdownOption)[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  className = '',
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const currentLabel =
    normalizedOptions.find((opt) => opt.value === value)?.label || value;

  const sizeClasses =
    size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${sizeClasses}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1 focus:outline-none">
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                option.value === value
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-750 hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
