import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, className = "", placeholder = "Seleccionar" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-full px-4 py-2 text-[10px] font-bold uppercase 
                   bg-white dark:bg-black border border-slate-200 dark:border-white/10 
                   hover:border-slate-300 dark:hover:border-white/20 rounded-md transition-all 
                   text-slate-900 dark:text-white outline-none active:scale-[0.98] shadow-sm dark:shadow-none"
      >
        <span className="truncate pr-2">{value || placeholder}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-300 text-slate-400 dark:text-zinc-500 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-[1100] w-full mt-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 
                        rounded-md shadow-xl dark:shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-1 space-y-0.5">
            {options.map((opt) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = value === optValue;

              return (
                <button
                  key={optValue}
                  type="button"
                  onClick={() => handleSelect(optValue)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold uppercase rounded-sm transition-all ${
                    isSelected 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black' 
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{optLabel}</span>
                  {isSelected && <Check size={12} strokeWidth={4} className="text-white dark:text-black" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
