/**
 * ==============================================================================
 * File: src/components/expenses/ExpenseTable.jsx
 * Description: Data Table & Responsive Cards for Society Expense Records
 * 
 * Features:
 * - Mobile & Tablet (< 768px): Instant Card View with category, amount, payment mode, and date.
 * - Desktop (>= 768px): Full Data Table.
 * ==============================================================================
 */

import React from 'react';
import { Edit2, Trash2, Tag, Calendar, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';

const ExpenseTable = ({
  expenses = [],
  isAuthenticated = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div>
      {/* 1. MOBILE & TABLET ADAPTIVE CARDS */}
      <div className="space-y-3 md:hidden">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 hover:border-slate-300 transition-all"
          >
            {/* Top Row: Category Badge & Amount */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Tag className="w-3 h-3 mr-1 text-rose-500" />
                {expense.category}
              </span>

              <span className="text-sm font-black text-rose-700">
                {formatCurrency(expense.amount)}
              </span>
            </div>

            {/* Middle Row: Description & Notes */}
            <div className="pt-3 space-y-2">
              <p className="text-sm font-bold text-slate-800">{expense.description}</p>
              {expense.notes && <p className="text-xs text-slate-500">{expense.notes}</p>}

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                  {formatDate(expense.expenseDate)}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  <Wallet className="w-3 h-3 mr-1 text-slate-500" />
                  {expense.paymentMode || 'Bank Transfer'}
                </span>
              </div>
            </div>

            {/* Bottom Row: Actions (Admin Only) */}
            {isAuthenticated && (
              <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onEdit(expense)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(expense)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2. DESKTOP DATA TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(expense)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
    </div>
  );
};

export default ExpenseTable;
