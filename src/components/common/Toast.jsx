/**
 * ==============================================================================
 * File: src/components/common/Toast.jsx
 * Description: Feedback Toast Banner Component
 * 
 * Features:
 * - Types: success, error, info, warning.
 * - Icon and color scheme matching the notification type.
 * - Dismiss button support.
 * ==============================================================================
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mr-2.5" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mr-2.5" />,
    info: <Info className="h-5 w-5 text-blue-600 shrink-0 mr-2.5" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mr-2.5" />,
  };

  return (
    <div
      className={`
        flex items-center justify-between p-4 rounded-xl border text-sm shadow-sm transition-all duration-200
        ${styles[type] || styles.info}
      `}
    >
      <div className="flex items-center">
        {icons[type] || icons.info}
        <span className="font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 inline-flex rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
