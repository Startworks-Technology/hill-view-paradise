/**
 * ==============================================================================
 * File: src/pages/Dashboard.jsx
 * Description: Executive Society Management Dashboard
 * 
 * Summary Cards & Metrics:
 * 1. Total Properties (Villas vs Plots count)
 * 2. Current Month Collections (Sum of paid receipts)
 * 3. Current Month Expenses (Sum of expense vouchers)
 * 4. Current Month Balance = Collections - Expenses
 * 5. Pending Maintenance = Total Expected - Total Collected
 * 6. Total Expected = Sum of each Villa (₹3,000) + Plot (Plot Size * ₹3)
 * 7. Collection recovery progress bar, recent collections & expenses feeds.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Wallet,
  Receipt,
  Scale,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import SummaryCard from '../components/common/SummaryCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import { getResidents } from '../services/residentService';
import { getCollectionsByMonth } from '../services/collectionService';
import { getExpensesByMonth } from '../services/expenseService';
import { formatCurrency } from '../utils/currencyUtils';
import { getMonthName } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const monthName = getMonthName(currentMonth);

  const [residents, setResidents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Load all dashboard metrics concurrently
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [resList, colList, expList] = await Promise.all([
        getResidents(),
        getCollectionsByMonth(currentMonth, currentYear),
        getExpensesByMonth(currentMonth, currentYear),
      ]);
      setResidents(resList);
      setCollections(colList);
      setExpenses(expList);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setToast({ type: 'error', message: 'Failed to load dashboard metrics.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentMonth, currentYear]);

  // Calculations
  const villaCount = residents.filter((r) => r.propertyType === 'Villa').length;
  const plotCount = residents.filter((r) => r.propertyType === 'Plot').length;
  const totalProperties = residents.length;

  const paidCollections = collections.filter((c) => c.status === 'Paid');
  const totalCollected = paidCollections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentMonthBalance = totalCollected - totalExpenses;

  const totalExpected = residents.reduce((sum, r) => {
    if (r.propertyType === 'Plot') {
      return sum + (Number(r.plotSize) || 0) * 3;
    }
    return sum + (Number(r.monthlyMaintenance) || 3000);
  }, 0);

  const totalPendingMaintenance = Math.max(0, totalExpected - totalCollected);
  const pendingUnitsCount = Math.max(0, totalProperties - paidCollections.length);
  const collectionRate = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;

  const totalSocietyOutstanding = residents.reduce((sum, r) => sum + (Number(r.outstandingBalance) || 0), 0);
  const defaultersCount = residents.filter((r) => (Number(r.outstandingBalance) || 0) > 0).length;

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner size="lg" text="Loading society metrics..." />
      </div>
    );
  }

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

      {/* 6 Key Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Total Properties (Villas & Plots) */}
        <SummaryCard
          title="Total Properties & Residents"
          value={totalProperties}
          subtitle={`${villaCount} Villas • ${plotCount} Plots`}
          icon={Users}
          color="blue"
          loading={loading}
        />

        {/* Current Month Collections */}
        <SummaryCard
          title={`Collections (${monthName})`}
          value={formatCurrency(totalCollected)}
          subtitle={`${paidCollections.length} units paid • ${collectionRate}% achieved`}
          icon={Wallet}
          color="emerald"
          loading={loading}
        />

        {/* Current Month Expenses */}
        <SummaryCard
          title={`Expenses (${monthName})`}
          value={formatCurrency(totalExpenses)}
          subtitle={`${expenses.length} expense vouchers logged`}
          icon={Receipt}
          color="rose"
          loading={loading}
        />

        {/* Current Month Net Balance */}
        <SummaryCard
          title={`Net Balance (${monthName})`}
          value={formatCurrency(currentMonthBalance)}
          subtitle="Total Collections - Total Expenses"
          icon={Scale}
          color={currentMonthBalance >= 0 ? 'emerald' : 'rose'}
          loading={loading}
        />

        {/* Pending Maintenance Amount */}
        <SummaryCard
          title="Pending Maintenance"
          value={formatCurrency(totalPendingMaintenance)}
          subtitle={
            totalSocietyOutstanding > 0
              ? `${pendingUnitsCount} units pending • ${formatCurrency(totalSocietyOutstanding)} total outstanding`
              : `${pendingUnitsCount} units pending for ${monthName}`
          }
          icon={Clock}
          color={totalPendingMaintenance > 0 ? 'amber' : 'slate'}
          loading={loading}
        />

        {/* Total Expected Revenue */}
        <SummaryCard
          title="Total Expected"
          value={formatCurrency(totalExpected)}
          subtitle={`${villaCount} Villas (₹3,000) • ${plotCount} Plots (₹3/sq.yd)`}
          icon={Building2}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Progress & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Efficiency & Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>Collection Progress</span>
              <span className="text-xs font-semibold text-emerald-600">{collectionRate}%</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time maintenance recovery for {monthName} {currentYear}
            </p>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${collectionRate}%` }}
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Collected Amount:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalCollected)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Pending Amount:</span>
                <span className="font-bold text-amber-600">{formatCurrency(totalPendingMaintenance)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Expected:</span>
                <span className="font-bold text-slate-700">{formatCurrency(totalExpected)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/collections"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center"
            >
              View all collections <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Recent Collections Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Wallet className="w-4 h-4 mr-1.5 text-emerald-600" />
                Recent Collections
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">{collections.length} total</span>
            </div>

            {loading ? (
              <LoadingSpinner size="sm" />
            ) : collections.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No collections recorded this month yet.</p>
            ) : (
              <div className="space-y-2.5 divide-y divide-slate-100">
                {collections.slice(0, 4).map((c) => (
                  <div key={c.id} className="pt-2 first:pt-0 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {c.flatNumber || c.villaNumber} • {c.residentName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {c.status === 'Paid' ? `Paid via ${c.paymentMode || 'UPI'}` : 'Pending'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">
                      {formatCurrency(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              to="/collections"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center"
            >
              Open Collections Ledger <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Recent Expenses Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Receipt className="w-4 h-4 mr-1.5 text-rose-600" />
                Recent Expenses
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">{expenses.length} total</span>
            </div>

            {loading ? (
              <LoadingSpinner size="sm" />
            ) : expenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No expenses recorded this month yet.</p>
            ) : (
              <div className="space-y-2.5 divide-y divide-slate-100">
                {expenses.slice(0, 4).map((e) => (
                  <div key={e.id} className="pt-2 first:pt-0 flex items-center justify-between">
                    <div className="overflow-hidden pr-2">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {e.category}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{e.description}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 shrink-0">
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              to="/expenses"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center"
            >
              Manage Expenses <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
