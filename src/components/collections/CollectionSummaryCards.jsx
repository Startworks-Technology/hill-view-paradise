/**
 * ==============================================================================
 * File: src/components/collections/CollectionSummaryCards.jsx
 * Description: Monthly Maintenance Financial Metrics Display
 * 
 * Metrics Calculated & Displayed:
 * 1. Total Expected = Occupied Flats count * Monthly Maintenance Amount
 * 2. Total Collected = Sum of collections with status == "Paid"
 * 3. Total Pending = Total Expected - Total Collected
 * ==============================================================================
 */

import React from 'react';
import { CheckCircle, Clock, PieChart } from 'lucide-react';
import SummaryCard from '../common/SummaryCard';
import { formatCurrency } from '../../utils/currencyUtils';

const CollectionSummaryCards = ({
  totalExpected = 0,
  totalCollected = 0,
  totalPending = 0,
  paidCount = 0,
  pendingCount = 0,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Expected Revenue Card */}
      <SummaryCard
        title="Total Expected"
        value={formatCurrency(totalExpected)}
        subtitle={`${paidCount + pendingCount} total occupied flats`}
        icon={PieChart}
        color="blue"
        loading={loading}
      />

      {/* Total Collected Revenue Card */}
      <SummaryCard
        title="Total Collected"
        value={formatCurrency(totalCollected)}
        subtitle={`${paidCount} flats marked Paid`}
        icon={CheckCircle}
        color="emerald"
        loading={loading}
      />

      {/* Total Pending Revenue Card */}
      <SummaryCard
        title="Total Pending"
        value={formatCurrency(totalPending)}
        subtitle={`${pendingCount} flats pending payment`}
        icon={Clock}
        color={totalPending > 0 ? 'rose' : 'slate'}
        loading={loading}
      />
    </div>
  );
};

export default CollectionSummaryCards;
