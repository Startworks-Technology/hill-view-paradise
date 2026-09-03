/**
 * ==============================================================================
 * File: src/components/gallery/GalleryLightboxModal.jsx
 * Description: High-Resolution Lightbox & Video Player Dialog
 * 
 * Features:
 * 1. Fullscreen responsive photo viewer with zoom & pan.
 * 2. Embedded Google Drive video player for direct in-app video playback.
 * 3. Next / Previous item navigation with keyboard arrows.
 * 4. Direct "Open in Google Drive" & "Copy Share Link" buttons.
 * 5. Display title, album tag, event date, and description.
 * ==============================================================================
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Play,
  Image as ImageIcon,
  Folder,
  Calendar,
} from 'lucide-react';
import { getDriveThumbnailUrl, getDriveEmbedUrl, getDriveViewUrl } from '../../utils/driveUtils';

const GalleryLightboxModal = ({
  isOpen,
  onClose,
  items = [],
  currentIndex = 0,
  onIndexChange,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const activeItem = items[currentIndex] || null;
  const isVideo = activeItem?.mediaType === 'video';

  const handlePrev = () => {
    setImgError(false);
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    } else {
      onIndexChange(items.length - 1); // Loop to last
    }
  };

  const handleNext = () => {
    setImgError(false);
    if (currentIndex < items.length - 1) {
      onIndexChange(currentIndex + 1);
    } else {
      onIndexChange(0); // Loop to first
    }
  };

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose]);

  if (!isOpen || !activeItem) return null;

  const handleCopyLink = () => {
    if (activeItem.driveLink) {
      navigator.clipboard.writeText(activeItem.driveLink);
      setCopied(true);
      if (onCopySuccess) onCopySuccess('Google Drive link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const driveViewUrl = activeItem.driveLink || getDriveViewUrl(activeItem.driveFileId);
  const embedUrl = activeItem.driveFileId ? getDriveEmbedUrl(activeItem.driveFileId) : activeItem.driveLink;
  const highResImage = activeItem.driveFileId ? getDriveThumbnailUrl(activeItem.driveFileId, 2048) : activeItem.driveLink;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/95 backdrop-blur-xl flex flex-col animate-fadeIn">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
        <div className="flex items-center space-x-3 text-white truncate max-w-[60%] sm:max-w-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {isVideo ? <Play className="w-4 h-4 fill-emerald-400" /> : <ImageIcon className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-white truncate">{activeItem.title}</h3>
            <p className="text-[11px] text-slate-400">
              {currentIndex + 1} of {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
            title="Copy Drive Share Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Copy Link</span>
          </button>

          {driveViewUrl && (
            <a
              href={driveViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
              title="Open directly in Google Shared Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Drive</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Media Display Area */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Navigation Chevron Left */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white backdrop-blur-md border border-slate-700/60 shadow-xl transition-all cursor-pointer select-none group"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Media Container */}
        <div className="max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center">
          {isVideo ? (
            activeItem.driveFileId ? (
              /* Google Drive Video Player Iframe */
              <div className="w-full h-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                <iframe
                  src={embedUrl}
                  title={activeItem.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              /* HTML5 Video Player for uploaded files / direct video URLs */
              <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center">
                <video
                  src={activeItem.driveLink}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            )
          ) : !imgError ? (
            /* High-Res Photo Display */
            <img
              src={highResImage}
              alt={activeItem.title}
              onError={() => setImgError(true)}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all select-none"
            />
          ) : (
            /* Fallback when image direct preview is blocked by permissions */
            <div className="text-center p-8 bg-slate-900/80 rounded-2xl border border-slate-800 max-w-md">
              <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Image Preview Unavailable</h4>
              <p className="text-xs text-slate-400 mb-4">
                This image is stored securely on Google Shared Drive.
              </p>
              <a
                href={driveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on Google Drive</span>
              </a>
            </div>
          )}
        </div>

        {/* Navigation Chevron Right */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white backdrop-blur-md border border-slate-700/60 shadow-xl transition-all cursor-pointer select-none group"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-sm font-bold text-white">{activeItem.title}</span>
              {activeItem.album && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Folder className="w-2.5 h-2.5" />
                  <span>{activeItem.album}</span>
                </span>
              )}
            </div>
            {activeItem.description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                {activeItem.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 shrink-0">
            {activeItem.eventDate && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{activeItem.eventDate}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryLightboxModal;
