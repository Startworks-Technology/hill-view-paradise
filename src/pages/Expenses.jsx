/**
 * ==============================================================================
 * File: src/pages/Expenses.jsx
 * Description: Society Expenditures Ledger & Category Analytics Page
 * 
 * Features:
 * 1. Combined Month & Year Picker.
 * 2. Category filtering & keyword search.
 * 3. Open to everyone for viewing; mutating actions (Add/Edit/Delete) are ONLY
 *    visible & enabled when admin login is active.
 * 4. Total Expenses summary card.
 * 5. Modals: Add/Edit Expense (`ExpenseFormModal`) and Delete Confirmation (`ConfirmModal`).
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import MonthYearPicker from '../components/common/MonthYearPicker';
import ExpenseSummaryCards from '../components/expenses/ExpenseSummaryCards';
import ExpenseTable from '../components/expenses/ExpenseTable';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import {
  getExpensesByMonth,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenseService';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { getMonthName } from '../utils/dateUtils';

const Expenses = () => {
  const { isAdmin } = useAuth();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpenseForDelete, setSelectedExpenseForDelete] = useState(null);

  // Fetch expenses for active month and year
  const fetchExpensesList = async () => {
    try {
      setLoading(true);
      const data = await getExpensesByMonth(selectedMonth, selectedYear);
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setToast({ type: 'error', message: 'Unable to load expenses for the selected period.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesList();
  }, [selectedMonth, selectedYear]);

  // Financial calculations: Total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !categoryFilter || exp.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Handle Form Submit
  const handleFormSubmit = async (formData) => {
    if (!isAdmin) return;

    try {
      setActionLoading(true);
      if (selectedExpenseForEdit) {
        await updateExpense(selectedExpenseForEdit.id, formData);
        setToast({ type: 'success', message: 'Expense record updated successfully.' });
      } else {
        await createExpense(formData);
        setToast({ type: 'success', message: 'New expense voucher saved.' });
      }
      setIsFormOpen(false);
      setSelectedExpenseForEdit(null);
      await fetchExpensesList();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to save expense.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!isAdmin) return;
    if (!selectedExpenseForDelete) return;

    try {
      setActionLoading(true);
      await deleteExpense(selectedExpenseForDelete.id);
      setToast({
        type: 'success',
        message: `Expense voucher "${selectedExpenseForDelete.description}" deleted.`,
      });
      setIsDeleteOpen(false);
      setSelectedExpenseForDelete(null);
      await fetchExpensesList();
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to delete expense record.' });
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

      {/* Header with Title and Combined Month/Year Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Receipt className="w-5 h-5 mr-2 text-rose-600" />
            Society Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and categorize operational, maintenance, and utility expenditures
          </p>
        </div>

        {/* Combined Month & Year Filter Controls + Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <MonthYearPicker
            month={selectedMonth}
            year={selectedYear}
            onChange={({ month, year }) => {
              setSelectedMonth(month);
              setSelectedYear(year);
            }}
          />

          {/* Add Expense button ONLY rendered for logged-in Admin */}
          {isAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedExpenseForEdit(null);
                setIsFormOpen(true);
              }}
            >
              Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* Summary Card (Total Expenses) */}
      <ExpenseSummaryCards
        totalExpenses={totalExpenses}
        expenseCount={expenses.length}
        loading={loading}
      />

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search expenses by description, vendor, or notes..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-56">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={EXPENSE_CATEGORIES}
            placeholder="All Categories"
          />
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12">
          <LoadingSpinner text={`Loading expenses for ${monthName} ${selectedYear}...`} />
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={`No expenses recorded for ${monthName} ${selectedYear}.`}
          description={isAdmin ? "Click '+ Add Expense' above to record bills and payments for this month." : "No expense vouchers logged for this month."}
          actionLabel={isAdmin ? "+ Add Expense" : null}
          onAction={isAdmin ? () => {
            setSelectedExpenseForEdit(null);
            setIsFormOpen(true);
          } : null}
        />
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No matching expense records found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or category filter.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <ExpenseTable
          expenses={filteredExpenses}
          isAuthenticated={isAdmin}
          onEdit={(exp) => {
            setSelectedExpenseForEdit(exp);
            setIsFormOpen(true);
          }}
          onDelete={(exp) => {
            setSelectedExpenseForDelete(exp);
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Add / Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedExpenseForEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={selectedExpenseForEdit}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedExpenseForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Record?"
        message={`Are you sure you want to delete the expense voucher "${selectedExpenseForDelete?.description}"?`}
        confirmText="Delete Expense"
        loading={actionLoading}
      />
    </div>
  );
};

export default Expenses;
