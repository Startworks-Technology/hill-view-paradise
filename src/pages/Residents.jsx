/**
 * ==============================================================================
 * File: src/pages/Residents.jsx
 * Description: Properties & Residents Directory (Villas & Plots)
 * 
 * Features:
 * 1. Directory of all registered Villas (fixed ₹3,000/mo) and Plots (Plot Size * ₹3/mo).
 * 2. Search by Unit number, Owner name, or contact.
 * 3. Filter by Property Type (Villa vs Plot).
 * 4. Add/Edit/Delete actions gated by Admin login.
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Sparkles,
  Home,
  Layers,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import ResidentTable from '../components/residents/ResidentTable';
import ResidentFormModal from '../components/residents/ResidentFormModal';
import ResidentDetailsModal from '../components/residents/ResidentDetailsModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import {
  getResidents,
  createResident,
  updateResident,
  deleteResident,
} from '../services/residentService';
import { seedSampleData } from '../services/seedService';
import { PROPERTY_TYPES } from '../utils/constants';

const Residents = () => {
  const { isAuthenticated } = useAuth();

  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Search, filter and view mode states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'grid' | 'table'

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResidentForEdit, setSelectedResidentForEdit] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedResidentForDetails, setSelectedResidentForDetails] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedResidentForDelete, setSelectedResidentForDelete] = useState(null);

  // Fetch resident records from Firestore
  const fetchResidentsList = async () => {
    try {
      setLoading(true);
      const data = await getResidents();
      setResidents(data);
    } catch (error) {
      console.error('Error fetching residents:', error);
      setToast({ type: 'error', message: 'Unable to load properties and residents.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidentsList();
  }, []);

  // Filtered list
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const unit = (r.villaNumber || r.flatNumber || '').toLowerCase();
      const matchesSearch =
        unit.includes(searchTerm.toLowerCase()) ||
        r.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone?.includes(searchTerm) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !typeFilter || r.propertyType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [residents, searchTerm, typeFilter]);

  // Handle Add/Edit form submission
  const handleFormSubmit = async (formData) => {
    if (!isAuthenticated) return;

    try {
      setActionLoading(true);
      if (selectedResidentForEdit) {
        await updateResident(selectedResidentForEdit.id, formData);
        setToast({ type: 'success', message: `Property ${formData.villaNumber} updated successfully.` });
      } else {
        await createResident(formData);
        setToast({ type: 'success', message: `Property ${formData.villaNumber} registered successfully.` });
      }
      setIsFormOpen(false);
      setSelectedResidentForEdit(null);
      await fetchResidentsList();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to save property record.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete confirmation
  const handleDeleteConfirm = async () => {
    if (!isAuthenticated) return;
    if (!selectedResidentForDelete) return;

    try {
      setActionLoading(true);
      await deleteResident(selectedResidentForDelete.id);
      const unit = selectedResidentForDelete.villaNumber || selectedResidentForDelete.flatNumber;
      setToast({
        type: 'success',
        message: `Property ${unit} (${selectedResidentForDelete.residentName}) deleted.`,
      });
      setIsDeleteOpen(false);
      setSelectedResidentForDelete(null);
      await fetchResidentsList();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to delete property.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Seed Sample dataset
  const handleSeed = async () => {
    if (!isAuthenticated) return;

    try {
      setActionLoading(true);
      const res = await seedSampleData();
      setToast({ type: res.success ? 'success' : 'info', message: res.message });
      await fetchResidentsList();
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to seed sample dataset.' });
    } finally {
      setActionLoading(false);
    }
  };

  const villaCount = residents.filter((r) => r.propertyType === 'Villa').length;
  const plotCount = residents.filter((r) => r.propertyType === 'Plot').length;

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-600" />
            Properties & Residents
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {residents.length} Properties • {villaCount} Villas (₹3,000/mo) • {plotCount} Plots (₹3/sq.yd)
          </p>
        </div>

        {/* Action buttons (Only rendered when Admin is logged in) */}
        {isAuthenticated && (
          <div className="flex items-center space-x-3">
            {residents.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Sparkles}
                onClick={handleSeed}
                loading={actionLoading}
              >
                Seed Sample Data
              </Button>
            )}
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedResidentForEdit(null);
                setIsFormOpen(true);
              }}
            >
              Add Property / Resident
            </Button>
          </div>
        )}
      </div>

      {/* Filters Toolbar with View Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by villa/plot number, resident name, phone, or email..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-56">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={PROPERTY_TYPES}
              placeholder="All Property Types"
            />
          </div>

          {/* Desktop/Tablet View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content / Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12">
          <LoadingSpinner text="Loading property records..." />
        </div>
      ) : residents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No properties found"
          description={isAuthenticated ? "Add your first Villa or Plot to get started." : "No property records registered yet."}
          actionLabel={isAuthenticated ? "+ Add Property" : null}
          onAction={isAuthenticated ? () => {
            setSelectedResidentForEdit(null);
            setIsFormOpen(true);
          } : null}
        />
      ) : filteredResidents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No matching properties found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <ResidentTable
          residents={filteredResidents}
          isAuthenticated={isAuthenticated}
          viewMode={viewMode}
          onView={(resident) => {
            setSelectedResidentForDetails(resident);
            setIsDetailsOpen(true);
          }}
          onEdit={(resident) => {
            setSelectedResidentForEdit(resident);
            setIsFormOpen(true);
          }}
          onDelete={(resident) => {
            setSelectedResidentForDelete(resident);
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Form Modal (Add / Edit) */}
      <ResidentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedResidentForEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={selectedResidentForEdit}
        loading={actionLoading}
      />

      {/* Details View Modal */}
      <ResidentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedResidentForDetails(null);
        }}
        resident={selectedResidentForDetails}
        onEdit={isAuthenticated ? (resident) => {
          setSelectedResidentForEdit(resident);
          setIsFormOpen(true);
        } : null}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedResidentForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Property Record?"
        message={`Are you sure you want to delete ${selectedResidentForDelete?.residentName} (${selectedResidentForDelete?.villaNumber || selectedResidentForDelete?.flatNumber})?`}
        confirmText="Delete Property"
        loading={actionLoading}
      />
    </div>
  );
};

export default Residents;
