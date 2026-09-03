/**
 * ==============================================================================
 * File: src/components/common/ConfirmModal.jsx
 * Description: Confirmation Modal for Destructive Operations
 * 
 * Requirements:
 * "Never immediately delete a record when the admin clicks Delete. Show a confirmation modal."
 * Used for deleting residents, collections, and expenses safely.
 * ==============================================================================
 */

import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  confirmVariant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} size="sm" showCloseButton={!loading}>
      <div className="flex flex-col items-center text-center pt-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4 border border-rose-100">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 px-2">{message}</p>
        <div className="flex items-center justify-end space-x-3 w-full pt-4 border-t border-slate-100">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-1/2"
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading ? 'Deleting...' : false}
            className="w-1/2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
