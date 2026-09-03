/**
 * ==============================================================================
 * File: src/components/expenses/ExpenseTable.jsx
 * Description: Data Table for Society Expense Records
 * 
 * Columns:
 * 1. Date
 * 2. Category Badge
 * 3. Description & Notes
 * 4. Amount (INR)
 * 5. Payment Mode (Bank Transfer, UPI, Cheque, Cash)
 * 6. Actions (Edit, Delete): ONLY rendered when admin is logged in
 * ==============================================================================
 */

import React from 'react';
import { Edit2, Trash2, Tag } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';

const ExpenseTable = ({
  expenses = [],
  isAuthenticated = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-3.5">Date</th>
            <th scope="col" className="px-5 py-3.5">Category</th>
            <th scope="col" className="px-5 py-3.5">Description</th>
            <th scope="col" className="px-5 py-3.5">Amount</th>
            <th scope="col" className="px-5 py-3.5">Payment Mode</th>
            {isAuthenticated && <th scope="col" className="px-5 py-3.5 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className="hover:bg-slate-50/80 transition-colors group"
            >
              {/* Expense Date */}
              <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 text-xs font-medium">
                {formatDate(expense.expenseDate)}
              </td>

              {/* Category Badge */}
              <td className="whitespace-nowrap px-5 py-3.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <Tag className="w-3 h-3 mr-1 text-rose-500" />
                  {expense.category}
                </span>
              </td>

              {/* Description */}
              <td className="px-5 py-3.5">
                <p className="font-semibold text-slate-800 text-sm line-clamp-1">{expense.description}</p>
                {expense.notes && (
                  <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{expense.notes}</p>
                )}
              </td>

              {/* Amount */}
              <td className="whitespace-nowrap px-5 py-3.5 font-bold text-rose-700">
                {formatCurrency(expense.amount)}
              </td>

              {/* Payment Mode */}
              <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  {expense.paymentMode || 'Bank Transfer'}
                </span>
              </td>

              {/* Actions (ONLY rendered when authenticated admin) */}
              {isAuthenticated && (
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Edit Expense"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;
