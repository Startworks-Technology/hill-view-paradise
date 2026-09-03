/**
 * ==============================================================================
 * File: src/utils/constants.js
 * Description: Global Application Constants & Default Configuration
 * 
 * Rules:
 * 1. Property Types: Villa vs Plot.
 * 2. Maintenance Rates:
 *    - Villa: Fixed ₹3,000 / month.
 *    - Plot: Plot Size (in Sq. Yards) * ₹3 / month.
 * 3. Supported payment modes & expense categories.
 * ==============================================================================
 */

/**
 * Standard expense categories for residential society maintenance.
 */
export const EXPENSE_CATEGORIES = [
  'Electricity',
  'Water',
  'Cleaning',
  'Security',
  'Lift Maintenance',
  'Repairs',
  'Gardening',
  'Plumbing',
  'Other',
];

/**
 * Property / Unit classification.
 */
export const PROPERTY_TYPES = ['Villa', 'Plot'];

/**
 * Rate configurations:
 * - Villa: ₹3,000 / month (fixed)
 * - Plot: ₹3 / Sq. Yard / month
 */
export const VILLA_MAINTENANCE_RATE = 3000;
export const PLOT_RATE_PER_SQYD = 3;

/**
 * Maintenance payment lifecycle status.
 */
export const COLLECTION_STATUSES = ['Paid', 'Pending'];

/**
 * Supported payment methods for collections and expenses.
 */
export const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Cheque'];

/**
 * Months array with numeric 1-indexed values and labels.
 */
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

/**
 * Society profile default values (can be overridden via environment variables).
 */
export const DEFAULT_SOCIETY_CONFIG = {
  societyName: import.meta.env.VITE_SOCIETY_NAME || 'Hill View Paradise Co-Op Housing Society',
  address: import.meta.env.VITE_SOCIETY_ADDRESS || 'Survey No. 42, Green Hills Road, Baner',
  city: import.meta.env.VITE_SOCIETY_CITY || 'Pune',
  state: import.meta.env.VITE_SOCIETY_STATE || 'Maharashtra',
  pincode: import.meta.env.VITE_SOCIETY_PINCODE || '411045',
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || '9876543210',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'admin@hillviewparadise.com',
};
