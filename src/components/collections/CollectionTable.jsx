/**
 * ==============================================================================
 * File: src/components/collections/CollectionTable.jsx
 * Description: Data Table & Responsive Cards for Maintenance Collection Records
 * 
 * Features:
 * - Mobile & Tablet (< 768px): Instant Card View with status badge, amount, mode, date.
 * - Desktop (>= 768px): Full Data Table.
 * ==============================================================================
 */

import React from 'react';
import { Edit2, Trash2, CheckCircle2, Clock, Wallet, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';

const CollectionTable = ({
  collections = [],
  isAuthenticated = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div>
      {/* 1. MOBILE & TABLET ADAPTIVE CARDS */}
      <div className="space-y-3 md:hidden">
        {collections.map((col) => {
          const isPaid = col.status === 'Paid';

          return (
            <div
              key={col.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 hover:border-slate-300 transition-all"
            >
              {/* Top Row: Unit, Status Badge, and Amount */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs shadow-xs">
                    {col.flatNumber || col.villaNumber}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1 text-amber-600" />
                        Pending
                      </>
                    )}
                  </span>
                </div>

                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(col.amount)}
                </span>
              </div>

              {/* Middle Row: Resident Name & Payment Details */}
              <div className="pt-3 space-y-2">
                <p className="text-sm font-bold text-slate-800">{col.residentName}</p>
                {col.notes && <p className="text-xs text-slate-500">{col.notes}</p>}

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                  {isPaid && (
                    <>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        <Wallet className="w-3 h-3 mr-1 text-slate-500" />
                        {col.paymentMode || 'UPI'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                        {formatDate(col.paidDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Row: Actions (Admin Only) */}
              {isAuthenticated && (
                <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onEdit(col)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(col)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. DESKTOP DATA TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Flat / Villa / Plot</th>
              <th scope="col" className="px-5 py-3.5">Resident</th>
              <th scope="col" className="px-5 py-3.5">Amount</th>
              <th scope="col" className="px-5 py-3.5">Paid Date</th>
              <th scope="col" className="px-5 py-3.5">Payment Mode</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              {isAuthenticated && <th scope="col" className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {collections.map((col) => (
              <tr
                key={col.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {/* Flat Number badge */}
                <td className="whitespace-nowrap px-5 py-3.5 font-bold text-slate-800">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs">
                    {col.flatNumber || col.villaNumber}
                  </span>
                </td>

                {/* Resident Name & Notes */}
                <td className="whitespace-nowrap px-5 py-3.5">
                  <p className="font-semibold text-slate-800">{col.residentName}</p>
                  {col.notes && <p className="text-[11px] text-slate-400 truncate max-w-xs">{col.notes}</p>}
                </td>

                {/* Amount */}
                <td className="whitespace-nowrap px-5 py-3.5 font-bold text-slate-800">
                  {formatCurrency(col.amount)}
                </td>

                {/* Paid Date */}
                <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 text-xs">
                  {col.status === 'Paid' ? formatDate(col.paidDate) : '—'}
                </td>

                {/* Payment Mode */}
                <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {col.status === 'Paid' ? (col.paymentMode || 'UPI') : '—'}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="whitespace-nowrap px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      col.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {col.status === 'Paid' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Pending
                      </>
                    )}
                  </span>
                </td>

                {/* Actions (ONLY rendered when authenticated admin) */}
                {isAuthenticated && (
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(col)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Edit Collection"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(col)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Collection"
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

export default CollectionTable;
