/**
 * ==============================================================================
 * File: src/components/residents/ResidentTable.jsx
 * Description: Responsive Residents & Properties Directory (Mobile Cards + Desktop Table)
 * 
 * Features:
 * 1. Mobile & Tablet (< 768px): Instant Card View — displays Unit, Owner, Type,
 *    Maintenance Rate, Phone (tap-to-call), and Email in one glance with ZERO horizontal scrolling.
 * 2. Desktop (>= 768px): Full Data Table with hover rows and action toolbar.
 * 3. View Details Modal trigger and Admin-gated Edit / Delete actions.
 * ==============================================================================
 */

import React from 'react';
import { Eye, Edit2, Trash2, Home, Layers, Phone, Mail, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const ResidentTable = ({
  residents = [],
  isAuthenticated = false,
  onView,
  onEdit,
  onDelete,
  viewMode = 'auto', // 'auto' (cards on mobile, table on desktop), 'grid', or 'table'
}) => {
  return (
    <div>
      {/* 1. MOBILE & TABLET ADAPTIVE CARDS (No horizontal scrolling required) */}
      <div className={`${viewMode === 'table' ? 'hidden' : viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3 md:hidden'}`}>
        {residents.map((resident) => {
          const isPlot = resident.propertyType === 'Plot';
          const unitNumber = resident.villaNumber || resident.flatNumber || '—';
          const plotSize = resident.plotSize ? `${resident.plotSize} sq. yd` : null;
          const maintenance = resident.monthlyMaintenance || (isPlot ? (Number(resident.plotSize) || 0) * 3 : 3000);

          return (
            <div
              key={resident.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 hover:border-slate-300 transition-all"
            >
              {/* Top Row: Unit Badge, Property Type Pill, and Monthly Rate */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs shadow-xs">
                    {unitNumber}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isPlot
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isPlot ? (
                      <>
                        <Layers className="w-3 h-3 mr-1 text-amber-600" />
                        Plot {plotSize && `(${plotSize})`}
                      </>
                    ) : (
                      <>
                        <Home className="w-3 h-3 mr-1 text-emerald-600" />
                        Villa
                      </>
                    )}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600 block">
                    {formatCurrency(maintenance)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">/month</span>
                </div>
              </div>

              {/* Middle Row: Resident Name, Outstanding & Contact Details */}
              <div className="pt-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{resident.residentName}</p>
                    <p className="text-[11px] text-slate-400">Registered Owner / Resident</p>
                  </div>
                  <div>
                    {(Number(resident.outstandingBalance) || 0) > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {formatCurrency(resident.outstandingBalance)}
                        <span className="ml-1 text-[10px] font-semibold text-rose-500">Due</span>
                      </span>
                    ) : (Number(resident.outstandingBalance) || 0) < 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {formatCurrency(Math.abs(resident.outstandingBalance))}
                        <span className="ml-1 text-[10px] font-semibold text-blue-500">Cr</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ₹0
                        <span className="ml-1 text-[10px] font-semibold text-emerald-500">Clear</span>
                      </span>
                    )}
                  </div>
                </div>

                {(resident.phone || resident.email) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                    {resident.phone && (
                      <a
                        href={`tel:${resident.phone}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
                      >
                        <Phone className="w-3 h-3 mr-1.5 text-emerald-600" />
                        {resident.phone}
                      </a>
                    )}
                    {resident.email && (
                      <a
                        href={`mailto:${resident.email}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors truncate max-w-[200px]"
                      >
                        <Mail className="w-3 h-3 mr-1.5 text-blue-600 shrink-0" />
                        <span className="truncate">{resident.email}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onView(resident)}
                  className="inline-flex items-center text-xs font-semibold text-slate-700 hover:text-emerald-700 py-1 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  View Details
                </button>

                {isAuthenticated && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(resident)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Edit Property"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(resident)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. DESKTOP FULL DATA TABLE */}
      <div className={`${viewMode === 'grid' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs`}>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Unit / Villa / Plot</th>
              <th scope="col" className="px-5 py-3.5">Owner / Resident</th>
              <th scope="col" className="px-5 py-3.5">Type</th>
              <th scope="col" className="px-5 py-3.5">Plot Size</th>
              <th scope="col" className="px-5 py-3.5">Monthly Maintenance</th>
              <th scope="col" className="px-5 py-3.5">Outstanding Balance</th>
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
              const outstanding = Number(resident.outstandingBalance) || 0;

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

                  {/* Outstanding Balance */}
                  <td className="whitespace-nowrap px-5 py-3.5">
                    {outstanding > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {formatCurrency(outstanding)}
                        <span className="ml-1 text-[10px] font-semibold text-rose-500">Due</span>
                      </span>
                    ) : outstanding < 0 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {formatCurrency(Math.abs(outstanding))}
                        <span className="ml-1 text-[10px] font-semibold text-blue-500">Cr</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ₹0
                        <span className="ml-1 text-[10px] font-semibold text-emerald-500">Clear</span>
                      </span>
                    )}
                  </td>

                  {/* Contact Phone & Email */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                    <p>{resident.phone || '—'}</p>
                    {resident.email && <p className="text-slate-400 text-[11px] truncate max-w-[150px]">{resident.email}</p>}
                  </td>

                  {/* Action buttons */}
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onView(resident)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {isAuthenticated && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(resident)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(resident)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
    </div>
  );
};

export default ResidentTable;
