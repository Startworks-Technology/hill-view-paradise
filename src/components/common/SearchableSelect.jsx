/**
 * ==============================================================================
 * File: src/components/common/SearchableSelect.jsx
 * Description: Searchable Autocomplete Combobox / Dropdown Component
 * 
 * Features:
 * 1. Live type-to-search filtering on multiple fields (name, unit, type, size).
 * 2. Keyboard navigable (Arrow keys, Enter, Escape).
 * 3. Click-outside detection to auto-close.
 * 4. Displays rich item details (badges, subtitle, maintenance amount).
 * ==============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Layers, Home } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const SearchableSelect = ({
  label,
  options = [], // [{ id, residentName, villaNumber, propertyType, plotSize, monthlyMaintenance, ... }]
  value, // currently selected residentId
  onChange, // function(selectedOption)
  placeholder = 'Search by name, villa, or plot...',
  error,
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find currently selected option
  const selectedItem = options.find((opt) => opt.id === value);

  // Filter options based on user search term
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (opt.residentName || '').toLowerCase();
    const unit = (opt.villaNumber || opt.flatNumber || '').toLowerCase();
    const type = (opt.propertyType || '').toLowerCase();
    const size = opt.plotSize ? `${opt.plotSize}` : '';
    const phone = (opt.phone || '').toLowerCase();

    return (
      name.includes(term) ||
      unit.includes(term) ||
      type.includes(term) ||
      size.includes(term) ||
      phone.includes(term)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input / Trigger Box */}
      <div
        className={`
          relative flex items-center w-full rounded-xl border bg-white transition-all
          ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-75' : 'cursor-pointer'}
          ${error ? 'border-rose-300 ring-2 ring-rose-100' : isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-300 hover:border-slate-400'}
        `}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="pl-3.5 text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedItem ? (
            selectedItem.propertyType === 'Plot'
              ? `Plot — ${selectedItem.residentName} (${selectedItem.plotSize} sq.yd)`
              : `${selectedItem.villaNumber || 'Villa'} — ${selectedItem.residentName}`
          ) : ''}
          placeholder={selectedItem && !isOpen ? '' : placeholder}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full py-2.5 pl-2.5 pr-16 text-sm text-slate-800 bg-transparent border-0 focus:outline-hidden focus:ring-0 placeholder:text-slate-400"
        />

        {/* Right side controls (Clear / Chevron) */}
        <div className="absolute right-2.5 flex items-center space-x-1">
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Dropdown Results Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 duration-150">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching properties or residents found for "{searchTerm}"
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = selectedItem?.id === opt.id;
              const isHighlighted = highlightedIndex === idx;
              const isPlot = opt.propertyType === 'Plot';
              const rate = opt.monthlyMaintenance || (isPlot ? (Number(opt.plotSize) || 0) * 3 : 3000);

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`
                    px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-sm
                    ${isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : isHighlighted ? 'bg-slate-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}
                  `}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isPlot ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isPlot ? <Layers className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                    </div>

                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {opt.residentName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {isPlot ? (
                          <span>Plot • {opt.plotSize} sq. yards</span>
                        ) : (
                          <span>{opt.villaNumber || 'Villa'}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <span className="text-xs font-bold text-emerald-600">
                      {formatCurrency(rate)}
                      <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
