import React from 'react';

/**
 * Universal KPI Card for OLED Pro Identity
 * Features: pill-shaped accent bar, high-contrast values, responsive icons.
 */
const KPICard = ({ label, value, icon, color = 'blue', sub, footer }) => {
    const barColor = 
        color === 'emerald' ? 'bg-emerald-500' : 
        color === 'red' ? 'bg-red-500' : 
        color === 'blue' ? 'bg-blue-600' : 'bg-slate-400';
        
    const iconColor = 
        color === 'emerald' ? 'text-emerald-500' : 
        color === 'red' ? 'text-red-500' : 
        color === 'blue' ? 'text-blue-600' : 'text-slate-500';

    const valueColor = 
        color === 'emerald' ? 'text-emerald-600 dark:text-emerald-500' : 
        color === 'red' ? 'text-red-600 dark:text-red-500' : 
        color === 'blue' ? 'text-blue-600' : 'text-slate-900 dark:text-white';

    return (
        <div className="group relative p-5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-lg transition-all flex flex-col justify-between shadow-sm dark:shadow-none hover:shadow-lg dark:hover:border-white/20 overflow-hidden text-left">
            {/* Round Accent Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor} rounded-r-full`}></div>
            
            <div className="pl-2">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest leading-none">
                        {label}
                    </span>
                    <div className={`${iconColor} opacity-70 group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className={`text-2xl font-black tracking-tighter tabular-nums ${valueColor}`}>
                        {value}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-zinc-600 font-bold uppercase mt-2 tracking-tighter leading-relaxed">
                        {sub}
                    </span>
                </div>
            </div>
            
            {footer && (
                <div className="pl-2 mt-4">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default KPICard;
