import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-8 py-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                <Icon size={20} />
              </div>
            )}
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] dark:text-slate-200">
              {title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="h-12 w-12 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-center transition-all group"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300 opacity-40 group-hover:opacity-100" />
          </button>
        </div>
        <div className="p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
