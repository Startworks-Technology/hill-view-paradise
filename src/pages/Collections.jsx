/**
 * ==============================================================================
 * File: src/pages/Collections.jsx
 * Description: Monthly Maintenance Collections & Ledger Management Page
 * 
 * Features:
 * 1. Combined Month & Year Picker.
 * 2. Real-time dynamic financial calculations (Total Expected from Villas & Plots,
 *    Collected, Pending, etc.).
 * 3. Open to everyone for viewing; mutating actions (Add/Edit/Delete) are ONLY
 *    visible & enabled when admin login is active.
 * 4. Search filter by villa/plot number/resident name and status filter (Paid/Pending).
 * 5. Modals: Add/Edit Collection (`CollectionFormModal`) and Delete Confirmation (`ConfirmModal`).
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  CalendarPlus,
  CalendarCheck,
  History,
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import MonthYearPicker from '../components/common/MonthYearPicker';
import CollectionSummaryCards from '../components/collections/CollectionSummaryCards';
import CollectionTable from '../components/collections/CollectionTable';
import CollectionFormModal from '../components/collections/CollectionFormModal';
import BillingLogsModal from '../components/collections/BillingLogsModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import {
  getCollectionsByMonth,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../services/collectionService';
import { getResidents, generateMonthlyDues } from '../services/residentService';
import { getBillingLogByMonth } from '../services/billingLogService';
import { COLLECTION_STATUSES } from '../utils/constants';
import { getMonthName } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';

const Collections = () => {
  const { isAdmin } = useAuth();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [collections, setCollections] = useState([]);
  const [residents, setResidents] = useState([]);
  const [billingLog, setBillingLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCollectionForEdit, setSelectedCollectionForEdit] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCollectionForDelete, setSelectedCollectionForDelete] = useState(null);

  const [isGenerateDuesOpen, setIsGenerateDuesOpen] = useState(false);
  const [isBillingLogsOpen, setIsBillingLogsOpen] = useState(false);

  // Fetch collections, residents, and billing log concurrently for the active month & year
  const fetchData = async () => {
    try {
      setLoading(true);
      const [cols, resList, bLog] = await Promise.all([
        getCollectionsByMonth(selectedMonth, selectedYear),
        getResidents(),
        getBillingLogByMonth(selectedMonth, selectedYear),
      ]);
      setCollections(cols);
      setResidents(resList);
      setBillingLog(bLog);
    } catch (error) {
      console.error('Error loading collections data:', error);
      setToast({ type: 'error', message: 'Unable to load collections for the selected month.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Dynamic Financial Analytics:
  // Total Expected = Sum of stored monthlyMaintenance for all active residents
  const totalExpected = residents.reduce((sum, r) => {
    return sum + (Number(r.monthlyMaintenance) || 0);
  }, 0);

  const paidCollections = collections.filter((c) => c.status === 'Paid');
  const totalCollected = paidCollections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalPending = Math.max(0, totalExpected - totalCollected);

  const paidCount = paidCollections.length;
  const pendingCount = Math.max(0, residents.length - paidCount);

  // Month-start dues status derived from billing_logs table and resident billing state
  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const unbilledResidents = residents.filter((r) => r.lastBilledMonthYear !== monthKey);
  const unbilledCount = unbilledResidents.length;
  const isMonthBilled = Boolean(billingLog && billingLog.status === 'Completed' && unbilledCount === 0);

  // Handle Month-Start Dues Generation
  const handleGenerateDuesConfirm = async () => {
    if (!isAdmin) return;

    try {
      setActionLoading(true);
      const res = await generateMonthlyDues(selectedMonth, selectedYear, 'Manual (Admin)', true);
      if (res.billedCount > 0) {
        setToast({
          type: 'success',
          message: `Generated dues of ${formatCurrency(res.totalBilled)} across ${res.billedCount} properties for ${monthName} ${selectedYear}.`,
        });
      } else {
        setToast({
          type: 'info',
          message: `All properties have already been billed for ${monthName} ${selectedYear}.`,
        });
      }
      setIsGenerateDuesOpen(false);
      await fetchData();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to generate monthly dues.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      const unit = (col.flatNumber || col.villaNumber || '').toLowerCase();
      const matchesSearch =
        unit.includes(searchTerm.toLowerCase()) ||
        col.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || col.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [collections, searchTerm, statusFilter]);

  // Handle Add/Edit form submit
  const handleFormSubmit = async (formData) => {
    if (!isAdmin) return;

    try {
      setActionLoading(true);
      if (selectedCollectionForEdit) {
        await updateCollection(selectedCollectionForEdit.id, formData);
        setToast({ type: 'success', message: `Collection record for ${formData.flatNumber} updated.` });
      } else {
        await createCollection(formData);
        setToast({ type: 'success', message: `Maintenance payment for ${formData.flatNumber} recorded.` });
      }
      setIsFormOpen(false);
      setSelectedCollectionForEdit(null);
      await fetchData();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to save collection.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete confirm
  const handleDeleteConfirm = async () => {
    if (!isAdmin) return;
    if (!selectedCollectionForDelete) return;

    try {
      setActionLoading(true);
      await deleteCollection(selectedCollectionForDelete.id);
      setToast({
        type: 'success',
        message: `Maintenance record for ${selectedCollectionForDelete.flatNumber} deleted.`,
      });
      setIsDeleteOpen(false);
      setSelectedCollectionForDelete(null);
      await fetchData();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to delete collection record.' });
    } finally {
      setActionLoading(false);
    }
  };

  const monthName = getMonthName(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header with Combined Month/Year Selector & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-emerald-600" />
            Maintenance Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage society monthly maintenance receipts and pending dues for Villas & Plots
          </p>
        </div>

        {/* Combined Month & Year Picker + Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <MonthYearPicker
            month={selectedMonth}
            year={selectedYear}
            onChange={({ month, year }) => {
              setSelectedMonth(month);
              setSelectedYear(year);
            }}
          />

          {/* Admin Actions */}
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                icon={History}
                onClick={() => setIsBillingLogsOpen(true)}
                title="View monthly dues billing audit logs"
              >
                Billing Logs
              </Button>
              {unbilledCount > 0 ? (
                <Button
                  variant="secondary"
                  icon={CalendarPlus}
                  onClick={() => setIsGenerateDuesOpen(true)}
                  title={`Generate monthly maintenance dues for ${monthName} ${selectedYear}`}
                >
                  Generate Dues ({unbilledCount})
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBillingLogsOpen(true)}
                  className="hidden sm:inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Click to view billing audit details"
                >
                  <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  {monthName} Dues Billed ({formatCurrency(billingLog?.totalBilledAmount || totalExpected)})
                </button>
              )}
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedCollectionForEdit(null);
                  setIsFormOpen(true);
                }}
              >
                Add Collection
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <CollectionSummaryCards
        totalExpected={totalExpected}
        totalCollected={totalCollected}
        totalPending={totalPending}
        paidCount={paidCount}
        pendingCount={pendingCount}
        loading={loading}
      />

      {/* Table Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by villa/plot number, resident name, or transaction notes..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={COLLECTION_STATUSES}
            placeholder="All Payment Statuses"
          />
        </div>
      </div>

      {/* Collection Records Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12">
          <LoadingSpinner text={`Loading maintenance collections for ${monthName} ${selectedYear}...`} />
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={`No maintenance collections found for ${monthName} ${selectedYear}.`}
          description={isAdmin ? "Click '+ Add Collection' above to record maintenance collections for this month." : "No collections logged for this month."}
          actionLabel={isAdmin ? "+ Add Collection" : null}
          onAction={isAdmin ? () => {
            setSelectedCollectionForEdit(null);
            setIsFormOpen(true);
          } : null}
        />
      ) : filteredCollections.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No matching collection records found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or status filter.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <CollectionTable
          collections={filteredCollections}
          isAuthenticated={isAdmin}
          onEdit={(col) => {
            setSelectedCollectionForEdit(col);
            setIsFormOpen(true);
          }}
          onDelete={(col) => {
            setSelectedCollectionForDelete(col);
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Add / Edit Collection Modal */}
      <CollectionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCollectionForEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={selectedCollectionForEdit}
        residents={residents}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCollectionForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Collection Record?"
        message={`Are you sure you want to delete the maintenance record for ${selectedCollectionForDelete?.residentName} (${selectedCollectionForDelete?.flatNumber})?`}
        confirmText="Delete Record"
        loading={actionLoading}
      />

      {/* Generate Monthly Dues Confirmation Modal */}
      <ConfirmModal
        isOpen={isGenerateDuesOpen}
        onClose={() => setIsGenerateDuesOpen(false)}
        onConfirm={handleGenerateDuesConfirm}
        title={`Generate Monthly Dues for ${monthName} ${selectedYear}?`}
        message={`This will apply the monthly maintenance fee to all ${unbilledCount} unbilled properties for ${monthName} ${selectedYear}, adding it to each resident's balance as due. Properties already billed for this month will be skipped.`}
        confirmText="Generate Dues"
        confirmVariant="primary"
        loading={actionLoading}
      />

      {/* Monthly Dues Billing Audit Logs Modal */}
      <BillingLogsModal
        isOpen={isBillingLogsOpen}
        onClose={() => setIsBillingLogsOpen(false)}
      />
    </div>
  );
};

export default Collections;
