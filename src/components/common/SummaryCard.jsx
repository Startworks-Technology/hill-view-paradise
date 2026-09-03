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
        bg-white rounded-2xl p-5 border ${theme.border} shadow-sm hover:shadow-md
        transition-all duration-200 flex flex-col justify-between
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 animate-pulse rounded my-1" />
          ) : (
            <h4 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">{value}</h4>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${theme.iconBg} shadow-sm shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
