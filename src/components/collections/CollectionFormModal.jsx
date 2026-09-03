/**
 * ==============================================================================
 * File: src/components/collections/CollectionFormModal.jsx
 * Description: Modal Form for Recording & Updating Maintenance Collections
 * 
 * Requirements & Features:
 * 1. Starts with an empty searchable resident input (no arbitrary pre-selection).
 * 2. Searchable combobox/dropdown for selecting a property/resident:
 *    - Type to search by Name, Villa Number, Plot, Plot Size, or Phone.
 *    - Selecting automatically populates:
 *      * `residentId`
 *      * `flatNumber` (Villa number or 'Plot')
 *      * `residentName`
 *      * `amount` (₹3,000 for Villa, Plot Size * 3 for Plot).
 * 3. Supports setting Status ("Paid" / "Pending"), Paid Date, and Payment Mode.
 * 4. Strictly generates scalar-only data (ZERO ARRAYS).
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import SearchableSelect from '../common/SearchableSelect';
import Button from '../common/Button';
import { MONTHS, PAYMENT_MODES, COLLECTION_STATUSES } from '../../utils/constants';
import { toInputDateString, getYearOptions } from '../../utils/dateUtils';

const CollectionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  residents = [],
  selectedMonth,
  selectedYear,
  loading = false,
}) => {
  // Collection form state (starts blank on new collection)
  const [formData, setFormData] = useState({
    residentId: '',
    flatNumber: '',
    residentName: '',
    amount: '',
    month: selectedMonth || new Date().getMonth() + 1,
    year: selectedYear || new Date().getFullYear(),
    status: 'Paid',
    paidDate: toInputDateString(new Date()),
    paymentMode: 'UPI',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Populate data on open or when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        residentId: initialData.residentId || '',
        flatNumber: initialData.villaNumber || initialData.flatNumber || '',
        residentName: initialData.residentName || '',
        amount: initialData.amount ?? '',
        month: Number(initialData.month) || selectedMonth || new Date().getMonth() + 1,
        year: Number(initialData.year) || selectedYear || new Date().getFullYear(),
        status: initialData.status || 'Paid',
        paidDate: initialData.paidDate ? toInputDateString(initialData.paidDate) : toInputDateString(new Date()),
        paymentMode: initialData.paymentMode || 'UPI',
        notes: initialData.notes || '',
      });
    } else {
      // Start completely blank so the admin can search and select the resident
      setFormData({
        residentId: '',
        flatNumber: '',
        residentName: '',
        amount: '',
        month: Number(selectedMonth) || new Date().getMonth() + 1,
        year: Number(selectedYear) || new Date().getFullYear(),
        status: 'Paid',
        paidDate: toInputDateString(new Date()),
        paymentMode: 'UPI',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen, selectedMonth, selectedYear]);

  // Handle Searchable Resident Selection: auto-populates unit number, name, and exact monthly maintenance amount
  const handleResidentSelect = (selectedResident) => {
    if (selectedResident) {
      const unit = selectedResident.propertyType === 'Plot' ? 'Plot' : (selectedResident.villaNumber || selectedResident.flatNumber || '');
      const maintenance = selectedResident.monthlyMaintenance || (selectedResident.propertyType === 'Plot' ? (Number(selectedResident.plotSize) || 0) * 3 : 3000);
      setFormData({
        ...formData,
        residentId: selectedResident.id,
        flatNumber: unit,
        residentName: selectedResident.residentName,
        amount: maintenance,
      });
      if (errors.residentId) {
        setErrors((prev) => ({ ...prev, residentId: null }));
      }
    } else {
      setFormData({
        ...formData,
        residentId: '',
        flatNumber: '',
        residentName: '',
        amount: '',
      });
    }
  };

  // Validation logic
  const validate = () => {
    const newErrors = {};

    if (!formData.residentId) {
      newErrors.residentId = 'Please search and select a property or resident';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid maintenance amount';
    }

    if (!formData.month) {
      newErrors.month = 'Please select a month';
    }

    if (!formData.year) {
      newErrors.year = 'Please select a year';
    }

    if (formData.status === 'Paid' && !formData.paidDate) {
      newErrors.paidDate = 'Please specify payment date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      amount: Number(formData.amount),
      month: Number(formData.month),
      year: Number(formData.year),
      paidDate: formData.status === 'Paid' ? formData.paidDate : null,
      notes: formData.notes.trim(),
    });
  };

  const isEditing = Boolean(initialData?.id);
  const years = getYearOptions();

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={isEditing ? 'Edit Maintenance Collection' : 'Record Maintenance Collection'}
      subtitle={
        isEditing
          ? `Modifying payment record for ${formData.residentName} (${formData.flatNumber})`
          : 'Search and select a resident to record their monthly maintenance'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Searchable Property / Resident Combobox */}
        <SearchableSelect
          label="Property / Resident"
          options={residents}
          value={formData.residentId}
          onChange={handleResidentSelect}
          placeholder="Type to search name, villa, or plot..."
          error={errors.residentId}
          required
          disabled={isEditing || loading}
        />

        {/* Month & Year Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Month"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            options={MONTHS}
            error={errors.month}
            required
            disabled={loading}
          />

          <Select
            label="Year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            options={years.map((y) => ({ value: y, label: String(y) }))}
            error={errors.year}
            required
            disabled={loading}
          />
        </div>

        {/* Amount & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="50"
            placeholder="Select a resident above or enter amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
            required
            disabled={loading}
          />

          <Select
            label="Payment Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={COLLECTION_STATUSES}
            required
            disabled={loading}
          />
        </div>

        {/* Payment Date & Mode (Only relevant when Paid) */}
        {formData.status === 'Paid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Paid Date"
              type="date"
              value={formData.paidDate}
              onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
              error={errors.paidDate}
              required
              disabled={loading}
            />

            <Select
              label="Payment Mode"
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              options={PAYMENT_MODES}
              required
              disabled={loading}
            />
          </div>
        )}

        {/* Notes & Ref */}
        <div>
          <Input
            label="Notes / Transaction ID (Optional)"
            placeholder="e.g. UPI Ref #48927492, Bank Cheque #102938"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={loading}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading ? 'Saving...' : false}
          >
            {isEditing ? 'Update Record' : 'Save Collection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CollectionFormModal;
