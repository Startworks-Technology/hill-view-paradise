/**
 * ==============================================================================
 * File: src/components/residents/ResidentDetailsModal.jsx
 * Description: Modal Dialog for Viewing Property & Resident Details
 * 
 * Features:
 * - Displays Unit/Villa/Plot number, Owner name, Property Type, Plot size (if Plot),
 *   and calculated Monthly Maintenance.
 * - Contact information (phone, email).
 * ==============================================================================
 */

import React from 'react';
import { Building2, Phone, Mail, Calendar, Home, Layers, Calculator } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

const ResidentDetailsModal = ({
  isOpen,
  onClose,
  resident,
  onEdit,
}) => {
  if (!resident) return null;

  const isPlot = resident.propertyType === 'Plot';
  const unitNumber = resident.villaNumber || resident.flatNumber || '—';
  const maintenance = resident.monthlyMaintenance || (isPlot ? (Number(resident.plotSize) || 0) * 3 : 3000);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${resident.propertyType || 'Property'} Details`}
      subtitle={unitNumber}
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
            {isPlot ? <Layers className="w-6 h-6" /> : <Home className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{resident.residentName}</h3>
            <p className="text-xs font-mono text-emerald-600 font-semibold">{unitNumber}</p>
          </div>
        </div>

        {/* Property & Maintenance & Outstanding Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Property Type
            </span>
            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center">
              {isPlot ? (
                <>
                  <Layers className="w-4 h-4 mr-1 text-amber-600" />
                  Plot
                </>
              ) : (
                <>
                  <Home className="w-4 h-4 mr-1 text-emerald-600" />
                  Villa
                </>
              )}
            </p>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Monthly Fee
            </span>
            <p className="text-sm font-extrabold text-emerald-700 mt-1 flex items-center">
              <Calculator className="w-4 h-4 mr-1 text-emerald-600" />
              {formatCurrency(maintenance)}
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${
            (Number(resident.outstandingBalance) || 0) > 0
              ? 'bg-rose-50/60 border-rose-100 text-rose-700'
              : (Number(resident.outstandingBalance) || 0) < 0
              ? 'bg-blue-50/60 border-blue-100 text-blue-700'
              : 'bg-slate-50 border-slate-100 text-emerald-700'
          }`}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Outstanding
            </span>
            <p className="text-sm font-extrabold mt-1">
              {(Number(resident.outstandingBalance) || 0) > 0
                ? `${formatCurrency(resident.outstandingBalance)} (Due)`
                : (Number(resident.outstandingBalance) || 0) < 0
                ? `${formatCurrency(Math.abs(resident.outstandingBalance))} (Credit)`
                : '₹0 (Clear)'}
            </p>
          </div>
        </div>

        {/* Information Table */}
        <div className="space-y-3 divide-y divide-slate-100 text-xs">
          {isPlot && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Plot Size:</span>
              <span className="font-semibold text-slate-800">{resident.plotSize} Square Yards</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Phone Number:
            </span>
            <span className="font-semibold text-slate-800">{resident.phone || '—'}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Email Address:
            </span>
            <span className="font-semibold text-slate-800">{resident.email || '—'}</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-medium flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Registered On:
            </span>
            <span className="text-slate-600">{formatDate(resident.createdAt)}</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(resident);
              }}
            >
              Edit Details
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ResidentDetailsModal;
