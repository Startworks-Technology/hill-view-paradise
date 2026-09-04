/**
 * ==============================================================================
 * File: src/pages/Gallery.jsx
 * Description: Month-Based Society Media Gallery (Google Drive + Firebase)
 * 
 * Features:
 * 1. Month & Year filter (`MonthYearPicker`) for browsing monthly event archives.
 * 2. KPI Analytics: Total Media, Photos, Videos, Albums count.
 * 3. Filters & Search: Media Type (All / Photos / Videos), Album selector, text search.
 * 4. Fullscreen Lightbox & Google Drive video player.
 * 5. Automated Google Drive Month-Wise upload and Firebase sync.
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Images,
  Image as ImageIcon,
  Play,
  Plus,
  Search,
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import MonthYearPicker from '../components/common/MonthYearPicker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Toast from '../components/common/Toast';
import ConfirmModal from '../components/common/ConfirmModal';

import GalleryCard from '../components/gallery/GalleryCard';
import GalleryFormModal from '../components/gallery/GalleryFormModal';
import GalleryLightboxModal from '../components/gallery/GalleryLightboxModal';

import { useAuth } from '../hooks/useAuth';
import {
  getMediaByMonth,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
} from '../services/galleryService';
import { getMonthName } from '../utils/dateUtils';
import {
  getGoogleAccessToken,
  deleteFileFromGoogleDrive,
} from '../services/googleDriveService';

const Gallery = () => {
  const { isAdmin, canManageMedia } = useAuth();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'image' | 'video'
  const [albumFilter, setAlbumFilter] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lightbox Modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Load monthly media
  const fetchGalleryData = async () => {
    try {
      setLoading(true);
      const items = await getMediaByMonth(selectedMonth, selectedYear);
      setMediaItems(items);
    } catch (error) {
      console.error('Failed to load gallery:', error);
      setToast({ type: 'error', message: 'Unable to load media for the selected month.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryData();
  }, [selectedMonth, selectedYear]);

  // Extract unique albums for filter dropdown
  const uniqueAlbums = useMemo(() => {
    const albums = new Set();
    mediaItems.forEach((item) => {
      if (item.album) albums.add(item.album);
    });
    return Array.from(albums);
  }, [mediaItems]);

  // Filtered media items
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item.mediaType !== typeFilter) return false;

      // Album filter
      if (albumFilter !== 'all' && item.album !== albumFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const albumMatch = item.album?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !albumMatch) return false;
      }

      return true;
    });
  }, [mediaItems, typeFilter, albumFilter, searchTerm]);

  // Summary Metrics
  const totalPhotos = mediaItems.reduce((acc, m) => {
    if (m.mediaFiles?.length) {
      return acc + m.mediaFiles.filter((f) => f.mediaType === 'image').length;
    }
    return acc + (m.mediaType === 'image' ? 1 : 0);
  }, 0);

  const totalVideos = mediaItems.reduce((acc, m) => {
    if (m.mediaFiles?.length) {
      return acc + m.mediaFiles.filter((f) => f.mediaType === 'video').length;
    }
    return acc + (m.mediaType === 'video' ? 1 : 0);
  }, 0);

  const totalAlbumsCount = uniqueAlbums.length;

  // Handlers
  const handleCreateOrUpdateMedia = async (mediaData) => {
    if (selectedItemForEdit) {
      const updated = await updateMediaItem(selectedItemForEdit.id, mediaData);
      setMediaItems((prev) =>
        prev.map((item) => (item.id === selectedItemForEdit.id ? updated : item))
      );
      setToast({ type: 'success', message: 'Media details updated successfully.' });
    } else {
      const created = await createMediaItem(mediaData);
      if (
        Number(mediaData.month) === Number(selectedMonth) &&
        Number(mediaData.year) === Number(selectedYear)
      ) {
        setMediaItems((prev) => [created, ...prev]);
      }
      setToast({ type: 'success', message: 'Photo / Video saved to gallery!' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItemForDelete) return;
    try {
      setDeleteLoading(true);

      // 1. Delete from Google Drive if file IDs are present and client ID configured
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (googleClientId) {
        const filesToDelete = selectedItemForDelete.mediaFiles?.length
          ? selectedItemForDelete.mediaFiles
          : [selectedItemForDelete];

        try {
          const accessToken = await getGoogleAccessToken(googleClientId);
          for (const file of filesToDelete) {
            const fId = file.driveFileId || file.id;
            if (fId) {
              await deleteFileFromGoogleDrive({
                fileId: fId,
                accessToken,
              });
            }
          }
        } catch (driveErr) {
          console.warn('Could not delete files from Google Drive:', driveErr);
        }
      }

      // 2. Delete record from Firebase Firestore
      await deleteMediaItem(selectedItemForDelete.id);
      setMediaItems((prev) => prev.filter((m) => m.id !== selectedItemForDelete.id));
      setToast({ type: 'success', message: 'Post and associated files removed from gallery.' });
      setIsDeleteOpen(false);
      setSelectedItemForDelete(null);
    } catch (err) {
      console.error('Delete media error:', err);
      setToast({ type: 'error', message: 'Failed to delete media post.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewMedia = (item) => {
    const index = filteredMedia.findIndex((m) => m.id === item.id);
    if (index !== -1) {
      setLightboxIndex(index);
      setIsLightboxOpen(true);
    }
  };

  const monthName = getMonthName(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Images className="h-5 w-5" />
            </div>
            <span>Society Media Gallery</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Month-wise photo & video archives for Hill View Paradise
          </p>
        </div>

        {/* Top Controls: Month Picker & Admin Add Action */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <MonthYearPicker
            month={selectedMonth}
            year={selectedYear}
            onChange={({ month, year }) => {
              setSelectedMonth(month);
              setSelectedYear(year);
            }}
          />

          {canManageMedia && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedItemForEdit(null);
                setIsFormOpen(true);
              }}
            >
              Add Media
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative w-full md:w-80">
          <Input
            icon={Search}
            placeholder="Search by title, album, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right: Media Type pills & Album Selector */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Media Type Toggle Pills */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`
                px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
                ${
                  typeFilter === 'all'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              All ({mediaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('image')}
              className={`
                px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1 transition-all cursor-pointer
                ${
                  typeFilter === 'image'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Photos ({totalPhotos})</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('video')}
              className={`
                px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1 transition-all cursor-pointer
                ${
                  typeFilter === 'video'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <Play className="w-3 h-3" />
              <span>Videos ({totalVideos})</span>
            </button>
          </div>

          {/* Album Selector Filter */}
          {uniqueAlbums.length > 0 && (
            <div className="min-w-[150px] shrink-0">
              <Select
                value={albumFilter}
                onChange={(e) => setAlbumFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Albums' },
                  ...uniqueAlbums.map((alb) => ({ value: alb, label: alb })),
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text={`Loading ${monthName} ${selectedYear} gallery...`} />
        </div>
      ) : filteredMedia.length > 0 ? (
        /* Responsive Media Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredMedia.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              isAdmin={canManageMedia}
              onView={handleViewMedia}
              onEdit={(it) => {
                setSelectedItemForEdit(it);
                setIsFormOpen(true);
              }}
              onDelete={(it) => {
                setSelectedItemForDelete(it);
                setIsDeleteOpen(true);
              }}
              onCopySuccess={(msg) => setToast({ type: 'success', message: msg })}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          title={`No Media in ${monthName} ${selectedYear}`}
          description={
            searchTerm || typeFilter !== 'all' || albumFilter !== 'all'
              ? 'No photos or videos match your selected search or filter criteria.'
              : 'Start building this month\'s gallery by uploading photos and videos to Google Drive.'
          }
          actionLabel={canManageMedia ? 'Add First Photo / Video' : undefined}
          onAction={
            canManageMedia
              ? () => {
                  setSelectedItemForEdit(null);
                  setIsFormOpen(true);
                }
              : undefined
          }
        />
      )}

      {/* Lightbox / Video Player Modal */}
      <GalleryLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        items={filteredMedia}
        currentIndex={lightboxIndex}
        isAdmin={canManageMedia}
        onIndexChange={(idx) => setLightboxIndex(idx)}
        onCopySuccess={(msg) => setToast({ type: 'success', message: msg })}
      />

      {/* Add / Edit Media Form Modal */}
      <GalleryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedItemForEdit(null);
        }}
        onSubmit={handleCreateOrUpdateMedia}
        initialData={selectedItemForEdit}
        activeMonth={selectedMonth}
        activeYear={selectedYear}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedItemForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Media Item"
        message={`Are you sure you want to remove "${selectedItemForDelete?.title}" from the gallery?`}
        confirmText="Delete Media"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Gallery;
