import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Dropdown({ value, options, onChange, placeholder = '请选择' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 px-4 py-2 min-w-[120px]
          bg-white border rounded-lg text-sm
          transition-all duration-200
          ${isOpen
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      <div
        className={`
          absolute top-full left-0 mt-1 w-full min-w-[120px]
          bg-white border border-gray-200 rounded-lg shadow-lg
          py-1 z-50
          transition-all duration-200 origin-top
          ${isOpen
            ? 'opacity-100 scale-100 visible'
            : 'opacity-0 scale-95 invisible'
          }
        `}
      >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                w-full px-4 py-2 text-left text-sm
                transition-colors duration-150
                ${option.value === value
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {option.value === value && (
                <span className="mr-2">✓</span>
              )}
              {option.label}
            </button>
          ))}
        </div>
    </div>
  );
}
