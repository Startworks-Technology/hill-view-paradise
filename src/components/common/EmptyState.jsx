/**
 * ==============================================================================
 * File: src/components/common/EmptyState.jsx
 * Description: Empty State Component for Unpopulated Lists & Tables
 * 
 * Requirements:
 * Shows descriptive guidance and call-to-action buttons when collections,
 * expenses, or resident lists have no records.
 * ==============================================================================
 */

import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'Get started by adding your first record.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-100 mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
