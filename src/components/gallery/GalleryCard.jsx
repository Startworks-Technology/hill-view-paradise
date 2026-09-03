/**
 * ==============================================================================
 * File: src/components/gallery/GalleryCard.jsx
 * Description: Interactive Media Card for Gallery Photos & Videos
 * 
 * Features:
 * 1. High-resolution Google Drive image / video thumbnail with graceful fallback.
 * 2. Visual badges for Album name and Media Type (Photo vs Video).
 * 3. Play overlay indicator for videos.
 * 4. Quick action buttons: Fullscreen Lightbox / Video Player, Copy Link, Open in Drive.
 * 5. Admin actions (Edit & Delete) visible exclusively to authenticated administrators.
 * ==============================================================================
 */

import React, { useState } from 'react';
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

  const isVideo = item.mediaType === 'video';
  const thumbnail = item.thumbnailUrl || (item.driveFileId ? getDriveThumbnailUrl(item.driveFileId, 800) : item.driveLink);
  const driveViewUrl = item.driveLink || getDriveViewUrl(item.driveFileId);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (item.driveLink) {
      navigator.clipboard.writeText(item.driveLink);
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

        {/* Thumbnail Image */}
        {!imgError && thumbnail ? (
          <img
            src={thumbnail}
            alt={item.title || 'Gallery item'}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
            className={`
              w-full h-full object-cover transition-transform duration-500 group-hover:scale-105
              ${imgLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            loading="lazy"
          />
        ) : (
          /* Fallback when direct thumbnail fails (e.g. video or restricted permission) */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-300">
            {isVideo ? (
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

        {/* Top Badges: Album & Media Type */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
          {item.album && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 truncate max-w-[65%]">
              <Folder className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{item.album}</span>
            </span>
          )}

          <span
            className={`
              inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ml-auto shrink-0
              ${
                isVideo
                  ? 'bg-rose-500/90 text-white backdrop-blur-md'
                  : 'bg-emerald-600/90 text-white backdrop-blur-md'
              }
            `}
          >
            {isVideo ? (
              <>
                <Play className="w-2.5 h-2.5 fill-white" />
                <span>Video</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-2.5 h-2.5" />
                <span>Photo</span>
              </>
            )}
          </span>
        </div>

        {/* Video Play Overlay Indicator */}
        {isVideo && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-md group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300 shadow-lg">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Hover Action Overlay (Expand / Quick View) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-white text-xs font-semibold flex items-center space-x-1">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Click to {isVideo ? 'Play' : 'Preview'}</span>
            </span>

            <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors shadow-xs"
                title="Copy Google Drive Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleOpenDrive}
                className="p-1.5 rounded-lg bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors shadow-xs"
                title="Open in Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
          <span>{item.eventDate || 'Recent'}</span>

          {/* Admin Edit & Delete Actions */}
          {isAdmin && (
            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Edit Media Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Media"
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
