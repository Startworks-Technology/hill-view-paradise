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
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {/* Total Expected Revenue Card */}
      <SummaryCard
        title="Expected"
        value={formatCurrency(totalExpected)}
        subtitle={`${paidCount + pendingCount} units`}
        icon={PieChart}
        color="blue"
        loading={loading}
      />

      {/* Total Collected Revenue Card */}
      <SummaryCard
        title="Collected"
        value={formatCurrency(totalCollected)}
        subtitle={`${paidCount} paid`}
        icon={CheckCircle}
        color="emerald"
        loading={loading}
      />

      {/* Total Pending Revenue Card */}
      <SummaryCard
        title="Pending"
        value={formatCurrency(totalPending)}
        subtitle={`${pendingCount} pending`}
        icon={Clock}
        color={totalPending > 0 ? 'rose' : 'slate'}
        loading={loading}
      />
    </div>
  );
};

export default CollectionSummaryCards;
