/**
 * ==============================================================================
 * File: src/components/collections/BillingLogsModal.jsx
 * Description: Audit Modal for viewing historical monthly dues generation logs.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle2, Bot, User, RefreshCw } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { getBillingLogs } from '../../services/billingLogService';
import { getMonthName } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

const BillingLogsModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getBillingLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load billing logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Dues Generation Logs"
      subtitle="Audit history of maintenance dues applied to resident outstanding balances"
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-slate-500">
            <History className="w-4 h-4 mr-1.5 text-slate-400" />
            Showing {logs.length} logged billing cycles
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <LoadingSpinner text="Loading billing audit logs..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No billing logs found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Monthly dues logs will be recorded here automatically when dues are generated on the 1st of the month or triggered manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Billing Cycle</th>
                  <th className="px-4 py-3">Billed Timestamp</th>
                  <th className="px-4 py-3">Properties</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Trigger Source</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => {
                  const isAuto = log.triggeredBy?.includes('Auto-Scheduler');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {getMonthName(log.month)} {log.year}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(log.billedDate || log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        <span className="font-semibold">{log.billedPropertiesCount}</span> properties
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(log.totalBilledAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            isAuto
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isAuto ? (
                            <Bot className="w-3 h-3 mr-1 text-purple-600" />
                          ) : (
                            <User className="w-3 h-3 mr-1 text-blue-600" />
                          )}
                          {log.triggeredBy || 'Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          {log.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BillingLogsModal;
