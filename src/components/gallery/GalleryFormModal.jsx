/**
 * ==============================================================================
 * File: src/components/gallery/GalleryFormModal.jsx
 * Description: Direct Media Uploader & Google Drive Link Modal for Gallery
 * 
 * Capabilities:
 * 1. Direct File Upload (Photos & Videos) from local device with live preview.
 * 2. Paste Google Drive / Shared Drive link option.
 * 3. Automatic Month & Year assignment.
 * 4. Album / Category organization with custom album creation.
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Play,
  AlertCircle,
  Folder,
  Calendar,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { MONTHS } from '../../utils/constants';
import { extractDriveId, getDriveThumbnailUrl, formatFileSize } from '../../utils/driveUtils';

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
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'image',
    driveLink: '',
    album: 'General',
    customAlbum: '',
    month: activeMonth,
    year: activeYear,
    eventDate: new Date().toISOString().split('T')[0],
  });

  // Uploaded File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileDataUrl, setFileDataUrl] = useState('');
  const fileInputRef = useRef(null);

  // Initialize form state
  useEffect(() => {
    if (initialData) {
      const isExistingAlbum = DEFAULT_ALBUMS.includes(initialData.album);
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        mediaType: initialData.mediaType || 'image',
        driveLink: initialData.driveLink || '',
        album: isExistingAlbum ? initialData.album : 'Custom',
        customAlbum: isExistingAlbum ? '' : initialData.album || '',
        month: Number(initialData.month) || activeMonth,
        year: Number(initialData.year) || activeYear,
        eventDate: initialData.eventDate || new Date().toISOString().split('T')[0],
      });
      setActiveTab('link');
      setSelectedFile(null);
      setFilePreview(null);
      setFileDataUrl('');
    } else {
      setFormData({
        title: '',
        description: '',
        mediaType: 'image',
        driveLink: '',
        album: 'General',
        customAlbum: '',
        month: activeMonth,
        year: activeYear,
        eventDate: new Date().toISOString().split('T')[0],
      });
      setSelectedFile(null);
      setFilePreview(null);
      setFileDataUrl('');
      setActiveTab('upload');
    }
    setError('');
    setUploadProgress(0);
  }, [isOpen, initialData, activeMonth, activeYear]);

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');

    const isVideo = file.type.startsWith('video/');
    const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    setFormData((prev) => ({
      ...prev,
      mediaType: isVideo ? 'video' : 'image',
      title: prev.title || autoTitle,
    }));

    if (isVideo) {
      const videoUrl = URL.createObjectURL(file);
      setFilePreview(videoUrl);
      setFileDataUrl(videoUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreview(ev.target.result);
        setFileDataUrl(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLinkChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, driveLink: url }));

    if (url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('video')) {
      setFormData((prev) => ({ ...prev, mediaType: 'video' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalAlbum =
      formData.album === 'Custom' ? formData.customAlbum.trim() || 'General' : formData.album;

    if (!formData.title.trim()) {
      setError('Please provide a title or caption for this media.');
      return;
    }

    try {
      setLoading(true);

      if (activeTab === 'upload' && !initialData) {
        if (!selectedFile && !fileDataUrl) {
          setError('Please select a photo or video file from your device.');
          setLoading(false);
          return;
        }

        setUploadProgress(40);
        // Simulate progress for smooth UX
        await new Promise((r) => setTimeout(r, 200));
        setUploadProgress(80);

        const driveFileId = extractDriveId(fileDataUrl);

        await onSubmit({
          title: formData.title,
          description: formData.description,
          mediaType: formData.mediaType,
          driveLink: fileDataUrl,
          driveFileId: driveFileId || '',
          thumbnailUrl: formData.mediaType === 'image' ? fileDataUrl : '',
          album: finalAlbum,
          month: Number(formData.month),
          year: Number(formData.year),
          eventDate: formData.eventDate,
          fileSize: selectedFile?.size || 0,
        });

        setUploadProgress(100);
      } else {
        if (!formData.driveLink.trim()) {
          setError('Please enter a Google Drive link or media URL.');
          setLoading(false);
          return;
        }

        const driveFileId = extractDriveId(formData.driveLink);

        await onSubmit({
          title: formData.title,
          description: formData.description,
          mediaType: formData.mediaType,
          driveLink: formData.driveLink.trim(),
          driveFileId: driveFileId || '',
          thumbnailUrl: driveFileId ? getDriveThumbnailUrl(driveFileId) : formData.driveLink.trim(),
          album: finalAlbum,
          month: Number(formData.month),
          year: Number(formData.year),
          eventDate: formData.eventDate,
        });
      }

      onClose();
    } catch (err) {
      console.error('Gallery upload error:', err);
      setError(err.message || 'Failed to save media item. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const extractedId = extractDriveId(formData.driveLink);
  const parsedThumbnail = extractedId ? getDriveThumbnailUrl(extractedId, 400) : null;
  const monthName = MONTHS.find((m) => m.value === Number(formData.month))?.label || 'Month';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Media Details' : 'Add Photo or Video to Gallery'}
      subtitle={`Month: ${monthName} ${formData.year}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher: Direct Upload vs Drive Link */}
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
              <span>Upload from Device</span>
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
              <span>Google Drive Link</span>
            </button>
          </div>
        )}

        {/* Tab 1: Direct File Dropzone */}
        {activeTab === 'upload' && !initialData && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all
                ${
                  selectedFile
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20'
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  {formData.mediaType === 'image' && filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="h-32 w-auto object-cover rounded-xl shadow-xs mb-2 border border-emerald-200"
                    />
                  ) : (
                    <div className="h-20 w-32 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center mb-2 shadow-xs border border-slate-700">
                      <Play className="w-8 h-8 fill-emerald-400 text-emerald-400 mb-1" />
                      <span className="text-[10px] text-slate-300 font-semibold">Video Selected</span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-emerald-900">{selectedFile.name}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    {formatFileSize(selectedFile.size)} • Click to replace file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click or drag & drop photo or video here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, WEBP, MP4, MOV, WEBM
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {loading && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Saving to {monthName} Gallery...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Paste Google Drive Link */}
        {(activeTab === 'link' || initialData) && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Google Shared Drive File Link <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                icon={LinkIcon}
                placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
                value={formData.driveLink}
                onChange={handleLinkChange}
                required
              />
            </div>

            {parsedThumbnail && (
              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                <img
                  src={parsedThumbnail}
                  alt="Drive Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-emerald-300 shrink-0 bg-slate-900"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="overflow-hidden">
                  <span className="font-bold text-emerald-900 block truncate">
                    Google Drive File Connected
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono truncate block">
                    File ID: {extractedId}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Title / Caption */}
          <div className="sm:col-span-2">
            <Input
              label="Title / Caption"
              placeholder="e.g. Independence Day Celebrations, Clubhouse Lawn"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Media Type */}
          <div>
            <Select
              label="Media Type"
              value={formData.mediaType}
              onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
              options={[
                { value: 'image', label: 'Photo / Image' },
                { value: 'video', label: 'Video Clip' },
              ]}
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
          <div className="grid grid-cols-2 gap-2">
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
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Add additional details or event highlights..."
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
            {initialData ? 'Save Changes' : activeTab === 'upload' ? 'Upload & Save' : 'Save to Gallery'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GalleryFormModal;
