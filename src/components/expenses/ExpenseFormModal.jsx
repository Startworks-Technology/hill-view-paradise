/**
 * ==============================================================================
 * File: src/components/expenses/ExpenseFormModal.jsx
 * Description: Modal Form for Logging & Editing Society Expenses
 * 
 * Features:
 * 1. Category selection: Electricity, Water, Cleaning, Security, Lift Maintenance,
 *    Repairs, Gardening, Plumbing, Other.
 * 2. Description, Amount, Payment Mode, and Notes.
 * 3. Date input automatically populates `expenseDate` (month & year derived).
 * 4. Strictly generates scalar-only data (ZERO ARRAYS).
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from '../../utils/constants';
import { toInputDateString } from '../../utils/dateUtils';

const ExpenseFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  // Expense form state
  const [formData, setFormData] = useState({
    category: 'Electricity',
    description: '',
    amount: '',
    expenseDate: toInputDateString(new Date()),
    paymentMode: 'Bank Transfer',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Populate data when modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || 'Electricity',
        description: initialData.description || '',
        amount: initialData.amount || '',
        expenseDate: initialData.expenseDate ? toInputDateString(initialData.expenseDate) : toInputDateString(new Date()),
        paymentMode: initialData.paymentMode || 'Bank Transfer',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        category: 'Electricity',
        description: '',
        amount: '',
        expenseDate: toInputDateString(new Date()),
        paymentMode: 'Bank Transfer',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required (e.g. Common area electricity bill)';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid expense amount';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    }

    if (!formData.paymentMode) {
      newErrors.paymentMode = 'Payment mode is required';
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
      description: formData.description.trim(),
      amount: Number(formData.amount),
      notes: formData.notes.trim(),
    });
  };

  const isEditing = Boolean(initialData?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={isEditing ? 'Edit Expense Record' : 'Record New Expense'}
      subtitle={isEditing ? `Modifying expense voucher #${initialData?.id}` : 'Log society operational or maintenance expenditure'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Expense Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={EXPENSE_CATEGORIES}
            error={errors.category}
            required
            disabled={loading}
          />

          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="10"
            placeholder="5200"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
            required
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div>
          <Input
            label="Description"
            placeholder="e.g. Common area power bill for lift & water pump"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            required
            disabled={loading}
          />
        </div>

        {/* Expense Date & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Expense Date"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            error={errors.expenseDate}
            required
            disabled={loading}
          />

          <Select
            label="Payment Mode"
            value={formData.paymentMode}
            onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
            options={PAYMENT_MODES}
            error={errors.paymentMode}
            required
            disabled={loading}
          />
        </div>

        {/* Vendor Notes */}
        <div>
          <Input
            label="Vendor / Invoice / Notes (Optional)"
            placeholder="e.g. Invoice #9281, Paid to MSEDCL"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={loading}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-100">
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
            {isEditing ? 'Update Expense' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseFormModal;
