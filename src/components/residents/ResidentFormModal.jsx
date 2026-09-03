/**
 * ==============================================================================
 * File: src/components/residents/ResidentFormModal.jsx
 * Description: Modal Form for Adding and Editing Villa and Plot Records
 * 
 * Rules:
 * 1. Resident / Owner Name (required).
 * 2. Property Type: 'Villa' vs 'Plot'.
 * 3. If 'Villa': Prompts for Villa Number (e.g. Villa-101). Fixed rate: ₹3,000/mo.
 * 4. If 'Plot': Prompts for Plot Size (in Sq. Yards). No Plot Number required.
 *    - Monthly rate: Plot Size * ₹3/mo.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { PROPERTY_TYPES, VILLA_MAINTENANCE_RATE, PLOT_RATE_PER_SQYD } from '../../utils/constants';
import { formatCurrency } from '../../utils/currencyUtils';
import { Calculator } from 'lucide-react';

const ResidentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  // Form input state
  const [formData, setFormData] = useState({
    residentName: '',
    propertyType: 'Villa',
    villaNumber: '',
    plotSize: '',
    outstandingBalance: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState({});

  // Synchronize form values when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        residentName: initialData.residentName || '',
        propertyType: initialData.propertyType || 'Villa',
        villaNumber: initialData.villaNumber || initialData.flatNumber || '',
        plotSize: initialData.plotSize ? String(initialData.plotSize) : '',
        outstandingBalance: initialData.outstandingBalance !== undefined ? String(initialData.outstandingBalance) : '0',
        phone: initialData.phone || '',
        email: initialData.email || '',
      });
    } else {
      setFormData({
        residentName: '',
        propertyType: 'Villa',
        villaNumber: '',
        plotSize: '',
        outstandingBalance: '0',
        phone: '',
        email: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Derived live monthly maintenance calculation
  const calculatedMaintenance =
    formData.propertyType === 'Plot'
      ? (Number(formData.plotSize) || 0) * PLOT_RATE_PER_SQYD
      : VILLA_MAINTENANCE_RATE;

  // Client-side form validation
  const validate = () => {
    const newErrors = {};

    if (!formData.residentName.trim()) {
      newErrors.residentName = 'Owner / Resident name is required';
    }

    if (formData.propertyType === 'Villa') {
      if (!formData.villaNumber.trim()) {
        newErrors.villaNumber = 'Villa number is required (e.g. Villa-101)';
      }
    } else if (formData.propertyType === 'Plot') {
      const size = Number(formData.plotSize);
      if (!formData.plotSize || isNaN(size) || size <= 0) {
        newErrors.plotSize = 'Please enter a valid plot size in square yards';
      }
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[\s-+()]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.outstandingBalance && isNaN(Number(formData.outstandingBalance))) {
      newErrors.outstandingBalance = 'Please enter a valid number for outstanding balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const isPlot = formData.propertyType === 'Plot';
    const unitIdentifier = isPlot ? 'Plot' : formData.villaNumber.trim().toUpperCase();

    onSubmit({
      residentName: formData.residentName.trim(),
      propertyType: formData.propertyType,
      villaNumber: unitIdentifier,
      flatNumber: unitIdentifier,
      plotSize: isPlot ? Number(formData.plotSize) : 0,
      monthlyMaintenance: calculatedMaintenance,
      outstandingBalance: Number(formData.outstandingBalance) || 0,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    });
  };

  const isEditing = Boolean(initialData?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={isEditing ? 'Edit Property Record' : 'Add Property / Resident'}
      subtitle={
        isEditing
          ? `Updating details for ${initialData?.residentName} (${initialData?.propertyType || 'Property'})`
          : 'Register a new Villa or Plot'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resident / Owner Name */}
        <Input
          label="Resident / Owner Name"
          placeholder="e.g. Krishna Veni"
          value={formData.residentName}
          onChange={(e) => setFormData({ ...formData, residentName: e.target.value })}
          error={errors.residentName}
          required
          disabled={loading}
        />

        {/* Property Type Dropdown (Villa / Plot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Property Type"
            value={formData.propertyType}
            onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
            options={PROPERTY_TYPES}
            required
            disabled={loading}
          />

          {/* If Villa: Show Villa Number */}
          {formData.propertyType === 'Villa' ? (
            <Input
              label="Villa Number"
              placeholder="e.g. Villa-101"
              value={formData.villaNumber}
              onChange={(e) => setFormData({ ...formData, villaNumber: e.target.value })}
              error={errors.villaNumber}
              required
              disabled={loading}
            />
          ) : (
            /* If Plot: Show Plot Size directly in the 2nd column */
            <Input
              label="Plot Size (in Square Yards)"
              inputMode="decimal"
              placeholder="e.g. 500"
              value={formData.plotSize}
              onChange={(e) => setFormData({ ...formData, plotSize: e.target.value })}
              error={errors.plotSize}
              required
              disabled={loading}
            />
          )}
        </div>

        {/* Live Monthly Maintenance Calculation Box */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Monthly Maintenance Rate</p>
              <p className="text-[11px] text-slate-500">
                {formData.propertyType === 'Plot'
                  ? `${formData.plotSize || 0} sq. yd × ₹${PLOT_RATE_PER_SQYD}/sq.yd`
                  : 'Fixed ₹3,000 / month for Villa'}
              </p>
            </div>
          </div>
          <span className="text-sm font-black text-emerald-600">
            {formatCurrency(calculatedMaintenance)}
            <span className="text-[10px] text-slate-400 font-normal"> /mo</span>
          </span>
        </div>

        {/* Outstanding Balance Field */}
        <div>
          <Input
            label="Outstanding Balance (₹)"
            inputMode="decimal"
            placeholder="0"
            helperText="Current unpaid balance or legacy dues (Enter 0 if clear)"
            value={formData.outstandingBalance}
            onChange={(e) => setFormData({ ...formData, outstandingBalance: e.target.value })}
            error={errors.outstandingBalance}
            disabled={loading}
          />
        </div>

        {/* Optional Contact: Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. 9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
            disabled={loading}
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="e.g. krishna@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            disabled={loading}
          />
        </div>

        {/* Modal footer buttons */}
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
            {isEditing ? 'Update Property' : 'Save Property'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ResidentFormModal;
