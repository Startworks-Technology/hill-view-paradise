/**
 * ==============================================================================
 * File: src/components/common/Button.jsx
 * Description: Reusable Button Component with Variants & Loading State
 * 
 * Features:
 * - Color variants: primary, secondary, danger, outline, ghost.
 * - Sizing: sm, md, lg.
 * - Built-in loading spinner state which disables clicks automatically.
 * - Icon integration (Lucide icons).
 * ==============================================================================
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 border-transparent',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm focus:ring-emerald-500',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 border-transparent',
  outline: 'bg-transparent hover:bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-500',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent focus:ring-slate-400',
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || Boolean(loading)}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border
        transition-all duration-150 ease-in-out select-none
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
          <span>{typeof loading === 'string' ? loading : 'Please wait...'}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`shrink-0 ${children ? 'mr-2' : ''} ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
