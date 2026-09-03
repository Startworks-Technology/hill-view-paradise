/**
 * ==============================================================================
 * File: src/components/collections/CollectionTable.jsx
 * Description: Data Table for Maintenance Collection Records
 * 
 * Columns:
 * 1. Flat Number
 * 2. Resident Name & Notes
 * 3. Amount (INR)
 * 4. Paid Date
 * 5. Payment Mode (UPI, Bank Transfer, Cash, Cheque)
 * 6. Status Badge (Paid / Pending)
 * 7. Actions (Edit, Delete): ONLY rendered when admin is logged in
 * ==============================================================================
 */

import React from 'react';
import { Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';

const CollectionTable = ({
  collections = [],
  isAuthenticated = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-3.5">Flat Number</th>
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
                  {col.flatNumber}
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Edit Collection"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(col)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
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
  );
};

export default CollectionTable;
