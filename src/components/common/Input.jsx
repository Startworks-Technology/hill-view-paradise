/**
 * ==============================================================================
 * File: src/components/common/Input.jsx
 * Description: Standard Form Input Field Component
 * 
 * Features:
 * - Label with required indicator.
 * - Validation error messages and styling.
 * - Helper text support.
 * - Leading icon support (Lucide icons).
 * ==============================================================================
 */

import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`
            block w-full rounded-lg border text-sm transition-colors duration-150
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
            ${Icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2
            ${error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
              : 'border-slate-300 text-slate-800 focus:border-emerald-500 focus:ring-emerald-200 bg-white'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
