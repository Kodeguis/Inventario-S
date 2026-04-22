import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-black w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header - Shadcn Style */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white rounded-lg border border-slate-200 dark:border-white/10">
                                <Icon size={18} />
                            </div>
                        )}
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100 italic">
                            {title}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-10 w-10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg flex items-center justify-center transition-all group border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    >
                        <X size={20} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-black">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
