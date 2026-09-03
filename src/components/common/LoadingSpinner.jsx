/**
 * ==============================================================================
 * File: src/components/common/LoadingSpinner.jsx
 * Description: Animated Loading Spinner Component
 * 
 * Features:
 * - Sizing options: sm, md, lg.
 * - Contextual loading message text.
 * ==============================================================================
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-emerald-600 mb-2`} />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
