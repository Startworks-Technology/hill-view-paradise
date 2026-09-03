/**
 * ==============================================================================
 * File: src/components/common/Select.jsx
 * Description: Dropdown Select Component
 * 
 * Features:
 * - Label with required indicator.
 * - Options list parsing from array of strings or `{ value, label }` objects.
 * - Custom chevron indicator.
 * - Error message display.
 * ==============================================================================
 */

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  className = '',
  id,
  required,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={`
            block w-full appearance-none rounded-lg border text-sm transition-colors duration-150
            pl-3.5 pr-10 py-2 bg-white
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 text-slate-800 focus:border-emerald-500 focus:ring-emerald-200'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children || options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
