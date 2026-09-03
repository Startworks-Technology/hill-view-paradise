/**
 * ==============================================================================
 * File: src/utils/currencyUtils.js
 * Description: Currency Formatting & Financial Parsing Utilities
 * 
 * Responsibilities:
 * 1. Formats numeric monetary amounts into Indian Rupee representation (e.g. ₹42,500).
 * 2. Safely parses input strings or numbers into valid numbers.
 * ==============================================================================
 */

/**
 * Format a numeric amount to Indian Rupee currency format (e.g. ₹42,500).
 * @param {number|string} amount - Monetary amount
 * @param {boolean} includeDecimals - Whether to display paise decimals (.00)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, includeDecimals = false) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
};

/**
 * Parses user input into a safe number value, defaulting to 0 for invalid inputs.
 * @param {any} value - Raw input value
 * @returns {number} Sanitized number
 */
export const parseAmount = (value) => {
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};
