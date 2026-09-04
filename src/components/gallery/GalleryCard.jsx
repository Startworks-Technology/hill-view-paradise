/**
 * ==============================================================================
 * File: src/components/gallery/GalleryCard.jsx
 * Description: Interactive Media Post Card for Gallery Events & Albums
 * 
 * Features:
 * 1. Multi-image hero cover with total photo/video count badge (+X photos).
 * 2. Mini thumbnail strip preview for posts with multiple photos/videos.
 * 3. High-resolution Google Drive image / video thumbnail with graceful fallback.
 * 4. Visual badges for Album name, Event Date, and Video indicator.
 * 5. Quick action buttons: Fullscreen Lightbox / Video Player, Copy Link, Open in Drive.
 * 6. Admin actions (Edit & Delete) visible exclusively to authenticated administrators.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Maximize2,
  Folder,
  Layers,
  Calendar,
} from 'lucide-react';
import { getDriveThumbnailUrl, getDriveViewUrl } from '../../utils/driveUtils';

const GalleryCard = ({
  item,
  isAdmin,
  onView,
  onEdit,
  onDelete,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Files in this post
  const files = item.mediaFiles && item.mediaFiles.length > 0 ? item.mediaFiles : [item];
  const primaryFile = files[0] || item;
  const count = files.length;
  const hasVideo = files.some((f) => f.mediaType === 'video') || item.mediaType === 'video';

  const initialThumb =
    primaryFile.thumbnailUrl ||
    (primaryFile.driveFileId ? getDriveThumbnailUrl(primaryFile.driveFileId, 800) : primaryFile.driveLink);

  const [currentSrc, setCurrentSrc] = useState(initialThumb);
  const [fallbackAttempt, setFallbackAttempt] = useState(0);
  const driveViewUrl = primaryFile.driveLink || getDriveViewUrl(primaryFile.driveFileId);

  // Sync state if item changes
  useEffect(() => {
    setCurrentSrc(initialThumb);
    setImgError(false);
    setImgLoaded(false);
    setFallbackAttempt(0);
  }, [initialThumb]);

  const handleImageError = () => {
    const fileId = primaryFile.driveFileId || item.driveFileId;
    if (fallbackAttempt === 0 && fileId) {
      // Fallback 1: drive.google.com/uc?export=view
      setFallbackAttempt(1);
      setCurrentSrc(`https://drive.google.com/uc?export=view&id=${fileId}`);
    } else if (fallbackAttempt === 1 && fileId) {
      // Fallback 2: lh3.googleusercontent.com
      setFallbackAttempt(2);
      setCurrentSrc(`https://lh3.googleusercontent.com/d/${fileId}=w800`);
    } else {
      setImgError(true);
      setImgLoaded(true);
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    const linkToCopy = primaryFile.driveLink || item.driveLink;
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      if (onCopySuccess) onCopySuccess('Google Drive link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenDrive = (e) => {
    e.stopPropagation();
    if (driveViewUrl) {
      window.open(driveViewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={() => onView(item)}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1"
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-4/3 w-full bg-slate-900 overflow-hidden select-none">
        {/* Loading Skeleton */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-600 animate-spin" />
          </div>
        )}

        {/* Primary Thumbnail Image */}
        {!imgError && currentSrc ? (
          <img
            src={currentSrc}
            alt={item.title || 'Gallery item'}
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoaded(true)}
            onError={handleImageError}
            className={`
              w-full h-full object-cover transition-transform duration-500 group-hover:scale-105
              ${imgLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            loading="lazy"
          />
        ) : (
          /* Fallback when direct thumbnail fails */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-300">
            {hasVideo ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
                <Play className="w-7 h-7 fill-emerald-400 ml-0.5" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/60 text-slate-300 border border-slate-600/50 mb-2">
                <ImageIcon className="w-7 h-7 text-emerald-400" />
              </div>
            )}
            <span className="text-xs font-semibold text-slate-200 text-center line-clamp-1">
              {item.title}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">Google Shared Drive</span>
          </div>
        )}

        {/* Top Badges: Album & Media Count */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
          {item.album && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 truncate max-w-[60%]">
              <Folder className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{item.album}</span>
            </span>
          )}

          {/* Multi-Photo / Video Count Badge */}
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/85 backdrop-blur-md text-white border border-white/20 shadow-xs ml-auto shrink-0">
            {hasVideo ? (
              <>
                <Play className="w-2.5 h-2.5 fill-white text-white" />
                <span>{count > 1 ? `${count} media` : 'Video'}</span>
              </>
            ) : (
              <>
                <Layers className="w-2.5 h-2.5 text-emerald-400" />
                <span>{count > 1 ? `${count} photos` : 'Photo'}</span>
              </>
            )}
          </span>
        </div>

        {/* Video Play Overlay Indicator */}
        {hasVideo && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/75 text-white backdrop-blur-md group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300 shadow-lg">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Hover Action Overlay (Expand / Quick View) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-white text-xs font-semibold flex items-center space-x-1">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Click to view {count > 1 ? `all ${count}` : ''}</span>
            </span>

            {isAdmin && driveViewUrl && (
              <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handleOpenDrive}
                  className="p-1.5 rounded-lg bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors shadow-xs"
                  title="Open in Google Drive (Admin only)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mini Thumbnail Row for Multi-Item Posts */}
      {count > 1 && (
        <div className="px-3 pt-2.5 pb-0 flex items-center space-x-1.5 overflow-hidden">
          {files.slice(0, 4).map((f, idx) => (
            <div
              key={f.id || idx}
              className="h-9 w-9 rounded-md overflow-hidden bg-slate-800 border border-slate-200 shrink-0 relative"
            >
              {f.mediaType === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-emerald-400">
                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                </div>
              ) : (
                <img
                  src={f.thumbnailUrl || (f.driveFileId ? getDriveThumbnailUrl(f.driveFileId, 120) : f.driveLink)}
                  alt="Thumb"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {idx === 3 && count > 4 && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-[10px] font-bold text-white">
                  +{count - 4}
                </div>
              )}
            </div>
          ))}
          <span className="text-[10px] text-slate-400 pl-1 font-medium">
            {count} files
          </span>
        </div>
      )}

      {/* Card Details & Metadata */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {item.title}
          </h4>
          {item.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{item.eventDate || 'Recent'}</span>
          </span>

          {/* Admin Edit & Delete Actions */}
          {isAdmin && (
            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Edit Post Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryCard;
