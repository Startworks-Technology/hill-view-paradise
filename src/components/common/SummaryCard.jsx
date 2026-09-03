/**
 * ==============================================================================
 * File: src/components/common/SummaryCard.jsx
 * Description: Metric / KPI Summary Card Component
 * 
 * Features:
 * - Color themes: emerald, blue, amber, rose, purple, slate.
 * - Icon container and customizable subtitle.
 * - Animated pulse skeleton loading state.
 * ==============================================================================
 */

import React from 'react';

const colorThemes = {
  emerald: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-500 text-white',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-500 text-white',
    text: 'text-blue-700',
    border: 'border-blue-100',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500 text-white',
    text: 'text-amber-700',
    border: 'border-amber-100',
  },
  rose: {
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-500 text-white',
    text: 'text-rose-700',
    border: 'border-rose-100',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-500 text-white',
    text: 'text-purple-700',
    border: 'border-purple-100',
  },
  slate: {
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-600 text-white',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  className = '',
  loading = false,
}) => {
  const theme = colorThemes[color] || colorThemes.emerald;

  return (
    <div
      className={`
        bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-5 border ${theme.border} shadow-xs hover:shadow-md
        transition-all duration-200 flex flex-col justify-between overflow-hidden
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-1 sm:gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 mb-0.5 sm:mb-1">
            <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${theme.iconBg} shrink-0`} />
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
              {title}
            </p>
          </div>
          {loading ? (
            <div className="h-5 sm:h-8 w-14 sm:w-24 bg-slate-200 animate-pulse rounded my-1" />
          ) : (
            <h4 className="text-xs xs:text-sm sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight whitespace-nowrap">
              {value}
            </h4>
          )}
        </div>
        {Icon && (
          <div className={`hidden sm:flex p-2 md:p-3 rounded-xl ${theme.iconBg} shadow-xs shrink-0`}>
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-1.5 pt-1.5 sm:mt-3 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] xs:text-[10px] sm:text-xs text-slate-500">
          <span className="truncate">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
