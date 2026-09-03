/**
 * ==============================================================================
 * File: src/components/common/MonthYearPicker.jsx
 * Description: Combined Month & Year Picker Component
 * 
 * Features:
 * 1. Single unified trigger showing "September 2026" with Calendar icon.
 * 2. Interactive popover with Year switcher (< 2026 >) and 12-month quick grid.
 * 3. One-click selection to immediately filter data by Month & Year.
 * 4. Includes "Current Month" quick jump button.
 * ==============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { MONTHS } from '../../utils/constants';
import { getMonthName } from '../../utils/dateUtils';

const MonthYearPicker = ({
  month, // numeric (1-12)
  year, // numeric (e.g. 2026)
  onChange, // function({ month, year })
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeYear, setActiveYear] = useState(year);
  const containerRef = useRef(null);

  // Synchronize internal active year when prop changes
  useEffect(() => {
    setActiveYear(year);
  }, [year]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (selectedMonth) => {
    onChange({ month: selectedMonth, year: activeYear });
    setIsOpen(false);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();
    setActiveYear(currentY);
    onChange({ month: currentM, year: currentY });
    setIsOpen(false);
  };

  const currentDate = new Date();
  const isCurrentMonthActive =
    month === currentDate.getMonth() + 1 && year === currentDate.getFullYear();

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Combined Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold
          border shadow-xs transition-all cursor-pointer bg-white
          ${
            isOpen
              ? 'border-emerald-500 ring-2 ring-emerald-100 text-emerald-900'
              : 'border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-bold text-slate-800">
          {getMonthName(month)} {year}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Floating Month-Year Picker Popover */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in-50 duration-150">
          {/* Year Switcher Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveYear((prev) => prev - 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">
              {activeYear}
            </span>

            <button
              type="button"
              onClick={() => setActiveYear((prev) => prev + 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12-Month Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m) => {
              const isSelected = month === m.value && year === activeYear;
              const isThisMonth =
                m.value === currentDate.getMonth() + 1 && activeYear === currentDate.getFullYear();

              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleMonthSelect(m.value)}
                  className={`
                    py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer relative
                    ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25'
                        : isThisMonth
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  {m.label.substring(0, 3)}
                  {isSelected && (
                    <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Quick Jump Action */}
          {!isCurrentMonthActive && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={handleCurrentMonth}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Jump to Current Month
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;
