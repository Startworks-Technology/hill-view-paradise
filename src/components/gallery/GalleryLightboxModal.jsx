/**
 * ==============================================================================
 * File: src/components/gallery/GalleryLightboxModal.jsx
 * Description: Multi-Image Slideshow Lightbox & S3 Video Player Dialog
 * 
 * Features:
 * 1. Fullscreen responsive photo viewer.
 * 2. In-post slideshow: Next / Previous buttons to browse all photos/videos within a post.
 * 3. Thumbnail selector strip at the bottom of the lightbox for instant hopping.
 * 4. Native HTML5 `<video controls playsInline>` player for direct S3 video playback.
 * 5. Keyboard navigation (ArrowLeft, ArrowRight, Escape).
 * 6. "Copy Share Link" button for current active photo/video.
 * ==============================================================================
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Play,
  Image as ImageIcon,
  Folder,
  Calendar,
  Layers,
} from 'lucide-react';
import { isVideoMedia } from '../../utils/s3Utils';

const GalleryLightboxModal = ({
  isOpen,
  onClose,
  items = [], // Array of posts
  currentIndex = 0,
  initialFileIndex = 0,
  isAdmin = false,
  onIndexChange,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Active Post & Active File inside post
  const [activePostIdx, setActivePostIdx] = useState(currentIndex);
  const [activeFileIdx, setActiveFileIdx] = useState(initialFileIndex);

  // Sync state when opened or props change
  useEffect(() => {
    setActivePostIdx(currentIndex);
    setActiveFileIdx(initialFileIndex);
  }, [isOpen, currentIndex, initialFileIndex]);

  const activePost = items[activePostIdx] || null;

  // Flattened files of active post
  const postFiles = useMemo(() => {
    if (!activePost) return [];
    if (activePost.mediaFiles && activePost.mediaFiles.length > 0) {
      return activePost.mediaFiles;
    }
    const singleUrl = activePost.s3Url || activePost.thumbnailUrl || activePost.driveLink || '';
    return [
      {
        id: activePost.s3Key || 'file_0',
        s3Url: singleUrl,
        thumbnailUrl: activePost.thumbnailUrl || singleUrl,
        mediaType: activePost.mediaType || (isVideoMedia(singleUrl) ? 'video' : 'image'),
        name: activePost.title,
      },
    ];
  }, [activePost]);

  const activeFile = postFiles[activeFileIdx] || postFiles[0] || null;
  const isVideo = activeFile?.mediaType === 'video' || isVideoMedia(activeFile?.s3Url);

  const mediaSrc = activeFile?.s3Url || activeFile?.thumbnailUrl || activePost?.s3Url || '';

  useEffect(() => {
    setImgError(false);
  }, [activePostIdx, activeFileIdx, mediaSrc]);

  const handlePrev = () => {
    setImgError(false);

    // If more than 1 file in this post, navigate files first
    if (activeFileIdx > 0) {
      setActiveFileIdx(activeFileIdx - 1);
    } else if (activePostIdx > 0) {
      // Go to previous post
      const prevPost = items[activePostIdx - 1];
      const prevPostFiles = prevPost.mediaFiles?.length ? prevPost.mediaFiles : [prevPost];
      const newPostIdx = activePostIdx - 1;
      setActivePostIdx(newPostIdx);
      setActiveFileIdx(prevPostFiles.length - 1);
      if (onIndexChange) onIndexChange(newPostIdx);
    } else {
      // Loop to last post
      const lastPost = items[items.length - 1];
      const lastFiles = lastPost.mediaFiles?.length ? lastPost.mediaFiles : [lastPost];
      const newPostIdx = items.length - 1;
      setActivePostIdx(newPostIdx);
      setActiveFileIdx(lastFiles.length - 1);
      if (onIndexChange) onIndexChange(newPostIdx);
    }
  };

  const handleNext = () => {
    setImgError(false);

    // If more than 1 file in this post, navigate files first
    if (activeFileIdx < postFiles.length - 1) {
      setActiveFileIdx(activeFileIdx + 1);
    } else if (activePostIdx < items.length - 1) {
      // Go to next post
      const newPostIdx = activePostIdx + 1;
      setActivePostIdx(newPostIdx);
      setActiveFileIdx(0);
      if (onIndexChange) onIndexChange(newPostIdx);
    } else {
      // Loop to first post
      setActivePostIdx(0);
      setActiveFileIdx(0);
      if (onIndexChange) onIndexChange(0);
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
  }, [isOpen, activePostIdx, activeFileIdx, postFiles.length, items.length, onClose]);

  if (!isOpen || !activePost || !activeFile) return null;

  const handleCopyLink = () => {
    if (mediaSrc) {
      navigator.clipboard.writeText(mediaSrc);
      setCopied(true);
      if (onCopySuccess) onCopySuccess('Media link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/95 backdrop-blur-xl flex flex-col animate-fadeIn">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
        <div className="flex items-center space-x-3 text-white truncate max-w-[60%] sm:max-w-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {isVideo ? <Play className="w-4 h-4 fill-emerald-400" /> : <ImageIcon className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-white truncate">{activePost.title}</h3>
            <p className="text-[11px] text-slate-400 flex items-center space-x-2">
              <span>Photo {activeFileIdx + 1} of {postFiles.length}</span>
              {items.length > 1 && (
                <span className="text-slate-500">&bull; (Post {activePostIdx + 1} of {items.length})</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Copy Media URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Media Display Area */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Navigation Chevron Left */}
        {(postFiles.length > 1 || items.length > 1) && (
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
        <div className="max-w-5xl max-h-[70vh] w-full h-full flex items-center justify-center">
          {isVideo ? (
            /* HTML5 Native Video Player */
            <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center">
              <video
                src={mediaSrc}
                controls
                playsInline
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          ) : !imgError && mediaSrc ? (
            /* High-Res S3 Photo Display */
            <img
              src={mediaSrc}
              alt={activePost.title}
              onError={() => setImgError(true)}
              className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all select-none"
            />
          ) : (
            /* Fallback when image fails */
            <div className="text-center p-8 bg-slate-900/80 rounded-2xl border border-slate-800 max-w-md">
              <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Image Preview Unavailable</h4>
              <p className="text-xs text-slate-400">
                This image could not be loaded. Please verify the URL or S3 bucket permissions.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Chevron Right */}
        {(postFiles.length > 1 || items.length > 1) && (
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

      {/* Thumbnail Selector Strip for Multi-Photo Posts */}
      {postFiles.length > 1 && (
        <div className="px-6 py-2 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-center space-x-2 overflow-x-auto shrink-0 max-h-20">
          {postFiles.map((f, idx) => (
            <button
              key={f.id || idx}
              type="button"
              onClick={() => setActiveFileIdx(idx)}
              className={`
                h-12 w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer relative
                ${
                  activeFileIdx === idx
                    ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                    : 'border-slate-700 opacity-60 hover:opacity-100'
                }
              `}
            >
              {f.mediaType === 'video' || isVideoMedia(f.s3Url) ? (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-emerald-400">
                  <Play className="w-4 h-4 fill-emerald-400" />
                </div>
              ) : (
                <img
                  src={f.thumbnailUrl || f.s3Url}
                  alt="Thumb"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Metadata Bar */}
      <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-sm font-bold text-white">{activePost.title}</span>
              {activePost.album && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Folder className="w-2.5 h-2.5" />
                  <span>{activePost.album}</span>
                </span>
              )}
              {postFiles.length > 1 && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  <Layers className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{postFiles.length} photos in post</span>
                </span>
              )}
            </div>
            {activePost.description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                {activePost.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 shrink-0">
            {activePost.eventDate && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{activePost.eventDate}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryLightboxModal;
