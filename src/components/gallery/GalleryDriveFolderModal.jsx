/**
 * ==============================================================================
 * File: src/components/gallery/GalleryDriveFolderModal.jsx
 * Description: Set / Update Google Shared Drive Folder Link Modal
 * 
 * Features:
 * 1. Allows admins to attach a Google Shared Drive folder URL to the active month.
 * 2. Gives residents a direct one-click button to browse raw high-res files in Google Drive.
 * 3. Validates folder ID and format.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { FolderPlus, HelpCircle, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { MONTHS } from '../../utils/constants';
import { extractDriveId } from '../../utils/driveUtils';

const GalleryDriveFolderModal = ({
  isOpen,
  onClose,
  onSave,
  month,
  year,
  initialFolder = null,
}) => {
  const [folderUrl, setFolderUrl] = useState('');
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthName = MONTHS.find((m) => m.value === Number(month))?.label || 'Month';

  useEffect(() => {
    if (initialFolder) {
      setFolderUrl(initialFolder.driveFolderUrl || '');
      setFolderName(initialFolder.folderName || `Gallery - ${monthName} ${year}`);
    } else {
      setFolderUrl('');
      setFolderName(`Gallery - ${monthName} ${year}`);
    }
    setError('');
  }, [isOpen, initialFolder, month, year, monthName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!folderUrl.trim()) {
      setError('Please provide a valid Google Shared Drive folder link.');
      return;
    }

    const folderId = extractDriveId(folderUrl);
    if (!folderId) {
      setError('Please provide a valid Google Drive folder link or folder ID.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        month: Number(month),
        year: Number(year),
        driveFolderUrl: folderUrl.trim(),
        folderName: folderName.trim() || `Gallery - ${monthName} ${year}`,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save Shared Drive folder:', err);
      setError(err.message || 'Failed to save Google Drive folder link.');
    } finally {
      setLoading(false);
    }
  };

  const extractedId = extractDriveId(folderUrl);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Google Shared Drive Folder"
      subtitle={`Configure Google Drive Folder for ${monthName} ${year}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 leading-relaxed">
          <div className="flex items-center space-x-1.5 font-bold text-emerald-900 mb-1">
            <FolderPlus className="w-4 h-4 text-emerald-600" />
            <span>Google Shared Drive Integration</span>
          </div>
          Attach your Google Shared Drive monthly folder link. Residents can click &ldquo;Open Shared Drive Folder&rdquo; to browse all raw photos & videos directly in Google Drive.
        </div>

        <div>
          <Input
            label="Google Drive / Shared Drive Folder Link"
            placeholder="https://drive.google.com/drive/folders/1A2B3C..."
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            required
          />
          <p className="text-[11px] text-slate-400 mt-1 flex items-center">
            <HelpCircle className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
            Ensure folder sharing is set to &ldquo;Anyone with the link can view&rdquo;
          </p>
        </div>

        {extractedId && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Detected Folder ID: </span>
            <code className="font-mono text-emerald-700 text-[11px]">{extractedId}</code>
          </div>
        )}

        <div>
          <Input
            label="Folder Display Name (Optional)"
            placeholder={`e.g. ${monthName} ${year} Community Photos`}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save Drive Folder Link
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GalleryDriveFolderModal;
