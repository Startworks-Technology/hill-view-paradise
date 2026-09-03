/**
 * ==============================================================================
 * File: src/utils/dateUtils.js
 * Description: Date & Timestamp Conversion Utilities
 * 
 * Responsibilities:
 * 1. Formats Firestore Timestamps, Dates, or strings to human-readable strings.
 * 2. Formats Dates to `YYYY-MM-DD` strings for HTML `<input type="date">`.
 * 3. Provides month label lookups and year range generators for dropdowns.
 * ==============================================================================
 */

import { MONTHS } from './constants';

/**
 * Format Firestore Timestamp or Date object into human-readable date string (e.g. 15 Sep 2026).
 * @param {any} timestampOrDate - Firestore Timestamp, Date instance, or date string
 * @returns {string} Human-readable date string or 'N/A'
 */
export const formatDate = (timestampOrDate) => {
  if (!timestampOrDate) return 'N/A';
  
  let date;
  if (typeof timestampOrDate.toDate === 'function') {
    date = timestampOrDate.toDate();
  } else if (timestampOrDate instanceof Date) {
    date = timestampOrDate;
  } else if (typeof timestampOrDate === 'string' || typeof timestampOrDate === 'number') {
    date = new Date(timestampOrDate);
  } else {
    return 'N/A';
  }

  if (isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Format Firestore Timestamp or Date into `YYYY-MM-DD` string for HTML `<input type="date">`.
 * @param {any} timestampOrDate - Firestore Timestamp or Date
 * @returns {string} `YYYY-MM-DD` string
 */
export const toInputDateString = (timestampOrDate) => {
  if (!timestampOrDate) return '';
  
  let date;
  if (typeof timestampOrDate.toDate === 'function') {
    date = timestampOrDate.toDate();
  } else if (timestampOrDate instanceof Date) {
    date = timestampOrDate;
  } else if (typeof timestampOrDate === 'string') {
    date = new Date(timestampOrDate);
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the human-readable month name for a numeric month (1-12).
 * @param {number} monthNum - Month index 1 to 12
 * @returns {string} Month name (e.g. "September")
 */
export const getMonthName = (monthNum) => {
  const match = MONTHS.find((m) => m.value === Number(monthNum));
  return match ? match.label : '';
};

/**
 * Returns an array of recent and upcoming years for select dropdowns.
 * @param {number} rangeBefore - Years before current year
 * @param {number} rangeAfter - Years after current year
 * @returns {number[]} Array of numeric years
 */
export const getYearOptions = (rangeBefore = 3, rangeAfter = 3) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - rangeBefore; y <= currentYear + rangeAfter; y++) {
    years.push(y);
  }
  return years;
};
