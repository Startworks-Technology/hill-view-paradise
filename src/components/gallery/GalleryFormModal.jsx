/**
 * ==============================================================================
 * File: src/components/gallery/GalleryFormModal.jsx
 * Description: Multi-Image/Video Google Drive Month Uploader & Post Form Modal
 * 
 * Features:
 * 1. Multi-file upload: Select 1 or many photos/videos for a single gallery post.
 * 2. Thumbnail preview grid for pending files with one-click remove option.
 * 3. Batch uploads directly to Google Drive month folder (e.g. `September 2026`).
 * 4. Paste multiple Google Drive links (one per line).
 * 5. Saves entire media list with metadata to Firestore.
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Play,
  AlertCircle,
  FolderCheck,
  CheckCircle2,
  X,
  Plus,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { MONTHS } from '../../utils/constants';
import { extractDriveId, getDriveThumbnailUrl, formatFileSize } from '../../utils/driveUtils';
import {
  getGoogleAccessToken,
  getOrCreateMonthFolder,
  uploadFileToMonthFolder,
} from '../../services/googleDriveService';
import { setMonthlyDriveFolder } from '../../services/galleryService';

const DEFAULT_ALBUMS = [
  'General',
  'Festivals & Celebrations',
  'Maintenance & Infrastructure',
  'Landscaping & Gardens',
  'Clubhouse & Amenities',
  'Meetings & AGMs',
  'Sports & Activities',
];

const GalleryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  activeMonth,
  activeYear,
}) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'link'
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    album: 'General',
    customAlbum: '',
    month: activeMonth,
    year: activeYear,
    eventDate: new Date().toISOString().split('T')[0],
  });

  // Selected Files state (Array of { file, preview, isVideo, id })
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Link mode state (Supports multiple links - one per line)
  const [rawDriveLinks, setRawDriveLinks] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const rootFolderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

  // Initialize form state
  useEffect(() => {
    if (initialData) {
      const isExistingAlbum = DEFAULT_ALBUMS.includes(initialData.album);
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        album: isExistingAlbum ? initialData.album : 'Custom',
        customAlbum: isExistingAlbum ? '' : initialData.album || '',
        month: Number(initialData.month) || activeMonth,
        year: Number(initialData.year) || activeYear,
        eventDate: initialData.eventDate || new Date().toISOString().split('T')[0],
      });

      // Populate raw drive links
      const links = (initialData.mediaFiles || []).map((f) => f.driveLink || '').filter(Boolean);
      if (links.length === 0 && initialData.driveLink) {
        links.push(initialData.driveLink);
      }
      setRawDriveLinks(links.join('\n'));
      setActiveTab('link');
      setSelectedFiles([]);
    } else {
      setFormData({
        title: '',
        description: '',
        album: 'General',
        customAlbum: '',
        month: activeMonth,
        year: activeYear,
        eventDate: new Date().toISOString().split('T')[0],
      });
      setSelectedFiles([]);
      setRawDriveLinks('');
      setActiveTab(googleClientId ? 'upload' : 'link');
    }
    setError('');
    setStatusMessage('');
    setUploadProgress(0);
  }, [isOpen, initialData, activeMonth, activeYear, googleClientId]);

  // Handle local files selection
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');

    const newFilesList = files.map((file) => {
      const isVideo = file.type.startsWith('video/');
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        isVideo,
        preview: isVideo ? null : URL.createObjectURL(file),
      };
    });

    setSelectedFiles((prev) => [...prev, ...newFilesList]);

    // Auto-fill title if empty
    if (!formData.title && files[0]) {
      const autoTitle = files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFormData((prev) => ({ ...prev, title: autoTitle }));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalAlbum =
      formData.album === 'Custom' ? formData.customAlbum.trim() || 'General' : formData.album;

    if (!formData.title.trim()) {
      setError('Please provide a title for this gallery post.');
      return;
    }

    try {
      setLoading(true);

      if (activeTab === 'upload' && !initialData) {
        if (selectedFiles.length === 0) {
          setError('Please select at least one photo or video file to upload.');
          setLoading(false);
          return;
        }

        if (!googleClientId) {
          setError('Google OAuth Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
          setLoading(false);
          return;
        }

        const selectedMonthObj = MONTHS.find((m) => m.value === Number(formData.month));
        const monthFolderName = `${selectedMonthObj?.label || 'Month'} ${formData.year}`;

        // 1. Obtain Google OAuth Access Token
        setStatusMessage('Authorizing with Google Drive...');
        const accessToken = await getGoogleAccessToken(googleClientId);

        // 2. Auto-find or Auto-create Month Subfolder
        setStatusMessage(`Auto-locating or creating "${monthFolderName}" folder...`);
        const monthFolder = await getOrCreateMonthFolder({
          rootFolderId: rootFolderId || '',
          folderName: monthFolderName,
          accessToken,
        });

        // 3. Save Month Folder Link in Firestore
        if (monthFolder.folderUrl) {
          try {
            await setMonthlyDriveFolder(
              Number(formData.month),
              Number(formData.year),
              monthFolder.folderUrl,
              monthFolder.name
            );
          } catch (folderErr) {
            console.warn('Could not auto-link monthly folder in Firestore:', folderErr);
          }
        }

        // 4. Batch Upload files sequentially into Google Drive
        const uploadedMediaFiles = [];
        const totalFiles = selectedFiles.length;

        for (let i = 0; i < totalFiles; i++) {
          const item = selectedFiles[i];
          const fileIndexStr = totalFiles > 1 ? ` (${i + 1}/${totalFiles})` : '';
          setStatusMessage(`Uploading "${item.name}"${fileIndexStr}...`);

          const ext = item.name.split('.').pop();
          const customName = `${formData.title}_${i + 1}_${Date.now()}.${ext}`;

          const uploadResult = await uploadFileToMonthFolder({
            file: item.file,
            targetFolderId: monthFolder.folderId,
            accessToken,
            customFileName: customName,
            onProgress: (pct) => {
              const overall = Math.round(((i * 100) + pct) / totalFiles);
              setUploadProgress(overall);
            },
          });

          uploadedMediaFiles.push({
            id: uploadResult.fileId,
            driveFileId: uploadResult.fileId,
            driveLink: uploadResult.driveLink,
            thumbnailUrl: getDriveThumbnailUrl(uploadResult.fileId, 800),
            mediaType: item.isVideo ? 'video' : 'image',
            name: item.name,
            size: uploadResult.size,
          });
        }

        // 5. Save Multi-Image Post to Firestore
        setStatusMessage('Saving post to Gallery...');
        const totalSize = uploadedMediaFiles.reduce((acc, f) => acc + (f.size || 0), 0);

        await onSubmit({
          title: formData.title,
          description: formData.description,
          album: finalAlbum,
          month: Number(formData.month),
          year: Number(formData.year),
          eventDate: formData.eventDate,
          fileSize: totalSize,
          mediaFiles: uploadedMediaFiles,
        });
      } else {
        // Mode B: Paste Drive Links
        const lines = rawDriveLinks
          .split(/[\n,]+/)
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length === 0) {
          setError('Please provide at least one Google Drive link.');
          setLoading(false);
          return;
        }

        const mediaFiles = lines.map((link, idx) => {
          const driveFileId = extractDriveId(link);
          const isVideo = link.toLowerCase().includes('video') || link.toLowerCase().includes('.mp4');
          return {
            id: driveFileId || `link_${idx}_${Date.now()}`,
            driveLink: link,
            driveFileId: driveFileId || '',
            thumbnailUrl: driveFileId ? getDriveThumbnailUrl(driveFileId, 800) : link,
            mediaType: isVideo ? 'video' : 'image',
            name: `${formData.title} - Item ${idx + 1}`,
            size: 0,
          };
        });

        await onSubmit({
          title: formData.title,
          description: formData.description,
          album: finalAlbum,
          month: Number(formData.month),
          year: Number(formData.year),
          eventDate: formData.eventDate,
          mediaFiles,
        });
      }

      onClose();
    } catch (err) {
      console.error('Gallery form submission error:', err);
      setError(err.message || 'Failed to complete Google Drive upload. Please try again.');
    } finally {
      setLoading(false);
      setStatusMessage('');
      setUploadProgress(0);
    }
  };

  const monthName = MONTHS.find((m) => m.value === Number(formData.month))?.label || 'Month';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Gallery Post' : 'New Gallery Event Post'}
      subtitle={`Auto Month Folder: ${monthName} ${formData.year}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        {!initialData && (
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`
                flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer
                ${
                  activeTab === 'upload'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Multi-File Upload to Drive</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`
                flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer
                ${
                  activeTab === 'link'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Paste Drive Links</span>
            </button>
          </div>
        )}

        {/* Tab 1: Multi-File Upload Dropzone */}
        {activeTab === 'upload' && !initialData && (
          <div className="space-y-3">
            {/* Dropzone Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-4 text-center cursor-pointer transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFilesChange}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />

              <div className="flex flex-col items-center py-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click or drag & drop one or multiple photos/videos
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hold Ctrl / Shift to select multiple files at once
                </p>
              </div>
            </div>

            {/* Selected Files Preview Strip */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selected Media ({selectedFiles.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-[11px] text-rose-500 hover:text-rose-700 cursor-pointer font-medium"
                  >
                    Clear all
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {selectedFiles.map((f, idx) => (
                    <div
                      key={f.id}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-300"
                    >
                      {f.isVideo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white bg-slate-800 p-1">
                          <Play className="w-5 h-5 text-emerald-400 fill-emerald-400 mb-1" />
                          <span className="text-[9px] text-slate-300 font-mono truncate max-w-full px-1">
                            {f.name}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={f.preview}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Remove item button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(f.id);
                        }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 flex items-center justify-center text-xs transition-colors shadow-xs cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Index badge */}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* Add more button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[9px] font-semibold mt-0.5">Add more</span>
                  </button>
                </div>
              </div>
            )}

            {/* Upload Progress & Live Status */}
            {loading && (
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <FolderCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>{statusMessage || 'Processing Google Drive upload...'}</span>
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Paste Google Drive Links */}
        {(activeTab === 'link' || initialData) && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Google Shared Drive Links <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Paste one Google Drive link per line:&#10;https://drive.google.com/file/d/1A2B3C.../view&#10;https://drive.google.com/file/d/4D5E6F.../view"
              value={rawDriveLinks}
              onChange={(e) => setRawDriveLinks(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              required
            />
            <p className="text-[11px] text-slate-400">
              Tip: You can paste multiple links separated by new lines or commas.
            </p>
          </div>
        )}

        {/* Post Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Title / Caption */}
          <div className="sm:col-span-2">
            <Input
              label="Event Post Title"
              placeholder="e.g. Independence Day Celebrations, Clubhouse Lawn"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Event Date */}
          <div>
            <Input
              type="date"
              label="Event Date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            />
          </div>

          {/* Album / Category */}
          <div>
            <Select
              label="Album / Category"
              value={formData.album}
              onChange={(e) => setFormData({ ...formData, album: e.target.value })}
              options={[
                ...DEFAULT_ALBUMS.map((alb) => ({ value: alb, label: alb })),
                { value: 'Custom', label: '+ New Custom Album...' },
              ]}
            />
          </div>

          {/* Month / Year Assignment */}
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <div>
              <Select
                label="Month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                options={MONTHS}
              />
            </div>
            <div>
              <Input
                type="number"
                label="Year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                min="2020"
                max="2040"
              />
            </div>
          </div>

          {/* Custom Album Name input if 'Custom' selected */}
          {formData.album === 'Custom' && (
            <div className="sm:col-span-2">
              <Input
                label="Custom Album Name"
                placeholder="e.g. Annual Sports Day 2026"
                value={formData.customAlbum}
                onChange={(e) => setFormData({ ...formData, customAlbum: e.target.value })}
                required
              />
            </div>
          )}

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Event Highlights (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Add event highlights, organizer names, or notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData
              ? 'Save Changes'
              : activeTab === 'upload'
              ? `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} Files to Drive`
              : 'Save Post'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GalleryFormModal;
