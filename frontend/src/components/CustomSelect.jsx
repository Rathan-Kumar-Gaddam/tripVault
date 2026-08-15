import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  icon = null,
  className = '',
  dropdownClassName = '',
  renderOption = null,
  renderSelected = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value || opt.code === value || opt.id === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border transition-all text-left flex items-center justify-between gap-2.5 outline-none shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen
            ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-white'
            : 'border-slate-200/90 focus:border-indigo-500 focus:bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && (
            <div className="text-slate-400 shrink-0">
              {icon}
            </div>
          )}

          {renderSelected ? (
            renderSelected(selectedOption)
          ) : selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedOption.icon && (
                <span className="text-base shrink-0">{selectedOption.icon}</span>
              )}
              {selectedOption.avatar && (
                <img src={selectedOption.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1 truncate">
                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate block">
                  {selectedOption.label || selectedOption.name || selectedOption.title}
                </span>
                {selectedOption.sublabel && (
                  <span className="text-[10px] text-slate-400 font-medium block truncate">
                    {selectedOption.sublabel}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-2xl p-1.5 max-h-64 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
        >
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 font-medium">
              No options available
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {options.map((opt, idx) => {
                const optVal = opt.value !== undefined ? opt.value : opt.code !== undefined ? opt.code : opt.id;
                const isSelected = optVal === value;

                return (
                  <button
                    key={optVal || idx}
                    type="button"
                    onClick={() => handleSelect(optVal)}
                    className={`w-full p-2.5 sm:p-3 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all text-xs active:scale-[0.99] ${
                      isSelected
                        ? 'bg-indigo-50/90 text-indigo-900 font-bold border border-indigo-200/80 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                    }`}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.icon && <span className="text-base shrink-0">{opt.icon}</span>}
                        {opt.avatar ? (
                          <img src={opt.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
                        ) : opt.initials ? (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {opt.initials}
                          </div>
                        ) : null}

                        <div className="min-w-0 flex-1 truncate">
                          <div className="flex items-center gap-1.5">
                            <span className={`truncate block ${isSelected ? 'font-black text-indigo-950' : 'font-bold text-slate-800'}`}>
                              {opt.label || opt.name || opt.title}
                            </span>
                            {opt.badge && (
                              <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.sublabel && (
                            <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
