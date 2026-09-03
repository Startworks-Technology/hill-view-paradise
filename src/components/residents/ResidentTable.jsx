/**
 * ==============================================================================
 * File: src/components/residents/ResidentTable.jsx
 * Description: Data Table for Displaying Society Villas & Plots
 * 
 * Columns:
 * 1. Unit Number (Villa / Plot #)
 * 2. Resident / Owner Name
 * 3. Property Type (Villa / Plot)
 * 4. Plot Size (in Sq. Yards for Plot, '—' for Villa)
 * 5. Monthly Maintenance (Fixed ₹3,000 for Villa, Plot Size * 3 for Plot)
 * 6. Contact (Phone & Email)
 * 7. Actions: View Profile (All); Edit & Delete (Admin Only)
 * ==============================================================================
 */

import React from 'react';
import { Eye, Edit2, Trash2, Home, Layers } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const ResidentTable = ({
  residents = [],
  isAuthenticated = false,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-3.5">Unit / Villa / Plot</th>
            <th scope="col" className="px-5 py-3.5">Owner / Resident</th>
            <th scope="col" className="px-5 py-3.5">Type</th>
            <th scope="col" className="px-5 py-3.5">Plot Size</th>
            <th scope="col" className="px-5 py-3.5">Monthly Maintenance</th>
            <th scope="col" className="px-5 py-3.5">Contact</th>
            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {residents.map((resident) => {
            const isPlot = resident.propertyType === 'Plot';
            const unitNumber = resident.villaNumber || resident.flatNumber || '—';
            const plotSize = resident.plotSize ? `${resident.plotSize} sq. yd` : '—';
            const maintenance = resident.monthlyMaintenance || (isPlot ? (Number(resident.plotSize) || 0) * 3 : 3000);

            return (
              <tr
                key={resident.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {/* Unit / Villa / Plot Number badge */}
                <td className="whitespace-nowrap px-5 py-3.5 font-bold text-slate-800">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs">
                    {unitNumber}
                  </span>
                </td>

                {/* Resident Name */}
                <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">
                  {resident.residentName}
                </td>

                {/* Property Type badge */}
                <td className="whitespace-nowrap px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isPlot
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isPlot ? (
                      <>
                        <Layers className="w-3 h-3 mr-1 text-amber-600" />
                        Plot
                      </>
                    ) : (
                      <>
                        <Home className="w-3 h-3 mr-1 text-emerald-600" />
                        Villa
                      </>
                    )}
                  </span>
                </td>

                {/* Plot Size */}
                <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 text-xs">
                  {plotSize}
                </td>

                {/* Monthly Maintenance */}
                <td className="whitespace-nowrap px-5 py-3.5 font-bold text-emerald-600">
                  {formatCurrency(maintenance)}
                  <span className="text-[10px] text-slate-400 font-normal"> /mo</span>
                </td>

                {/* Contact Phone & Email */}
                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                  <p>{resident.phone || '—'}</p>
                  {resident.email && <p className="text-slate-400 text-[11px] truncate max-w-[150px]">{resident.email}</p>}
                </td>

                {/* Action buttons */}
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    {/* View Profile is open to everyone */}
                    <button
                      type="button"
                      onClick={() => onView(resident)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Edit and Delete are ONLY rendered for authenticated admin */}
                    {isAuthenticated && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(resident)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(resident)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResidentTable;
