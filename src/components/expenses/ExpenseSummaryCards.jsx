/**
 * ==============================================================================
 * File: src/components/expenses/ExpenseSummaryCards.jsx
 * Description: Summary Statistics for Monthly Society Expenses
 * 
 * Metrics:
 * 1. Total Expenses = Sum of all expense records in the selected month
 * ==============================================================================
 */

import React from 'react';
import { Receipt } from 'lucide-react';
import SummaryCard from '../common/SummaryCard';
import { formatCurrency } from '../../utils/currencyUtils';

const ExpenseSummaryCards = ({
  totalExpenses = 0,
  expenseCount = 0,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Expenses Card */}
      <SummaryCard
        title="Total Expenses"
        value={formatCurrency(totalExpenses)}
        subtitle={`${expenseCount} expense vouchers recorded`}
        icon={Receipt}
        color="rose"
        loading={loading}
      />
    </div>
  );
};

export default ExpenseSummaryCards;
