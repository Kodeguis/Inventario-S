import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  ShoppingCart, 
  Calendar,
  Plus, 
  Edit2, 
  Trash2,
  ArrowDown,
  ArrowUp,
  Tag,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useModals } from '../../context/ModalContext';
import { supabase } from '../../lib/supabaseClient';
import CustomSelect from '../../components/Common/CustomSelect';

const SalesPage = () => {
    const { sales, products, categories, refreshData } = useInventory();
    const { openModal } = useModals();
    const [saleSearch, setSaleSearch] = useState('');
    const [saleCategory, setSaleCategory] = useState('Todas');
    const [sortOrder, setSortOrder] = useState('desc');

    const formatDate = (dateStr) => {
        try {
            if (!dateStr) return { date: 'N/A', time: '' };
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return { date: dateStr, time: '' };
            const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            return { date, time };
        } catch (e) {
            return { date: dateStr || 'N/A', time: '' };
        }
    };

    const filteredSales = (sales || []).filter(s => {
        const search = saleSearch.toLowerCase();
        const matchesSearch = (s.product_name || '').toLowerCase().includes(search) || 
                              (s.product_category || '').toLowerCase().includes(search) ||
                              (s.batch || '').toLowerCase().includes(search);
        const matchesCategory = saleCategory === 'Todas' || s.product_category === saleCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedSales = [...filteredSales].sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0);
        const dateB = new Date(b.created_at || b.date || 0);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const handleRowClick = (sale) => {
        openModal('saleDetail', sale);
    };

    const handleDelete = async (e, sale) => {
        e.stopPropagation();
        if (!window.confirm('¿ELIMINAR REGISTRO DE VENTA? El stock se devolverá automáticamente al inventario físico.')) return;

        try {
            const { error: dErr } = await supabase.from('sales').delete().eq('id', sale.id);
            if (dErr) throw dErr;

            const prod = (products || []).find(p => p.id === sale.product_id);
            if (prod) {
                await supabase.from('products').update({ stock: (prod.stock || 0) + sale.quantity }).eq('id', prod.id);
            }
            refreshData(true);
        } catch (err) {
            alert("Error en liquidación: " + err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-1">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 pt-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart size={18} className="text-blue-600" />
                        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            Liquidación <span className="text-blue-600 font-black">de Ventas</span>
                        </h1>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Historial Ejecutivo de Operaciones y Rentabilidad Real</p>
                </div>
                
                <button 
                    onClick={() => openModal('sale')} 
                    className="h-10 px-6 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-blue-600/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-3 border border-white/10"
                >
                    <Plus size={16}/> <span>Nueva Venta</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-1">
                <div className="lg:col-span-3 relative group">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                        className="w-full h-11 bg-white dark:bg-zinc-950 px-14 text-[11px] font-bold uppercase rounded-md border border-slate-200 dark:border-white/10 focus:border-blue-600/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700 shadow-sm dark:shadow-none" 
                        placeholder="Buscar transacciones por producto, categoría o tanda maestra..." 
                        value={saleSearch} 
                        onChange={e=>setSaleSearch(e.target.value)} 
                    />
                </div>
                <div className="relative">
                    <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 pointer-events-none z-10" />
                    <CustomSelect 
                        value={saleCategory} 
                        onChange={saleCategory => setSaleCategory(saleCategory)}
                        options={['Todas', ...(categories || []).map(c=>c.name)].filter(Boolean)}
                        className="h-11 !rounded-md !pl-11"
                        placeholder="CATEGORÍA"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden overflow-x-auto no-scrollbar shadow-sm dark:shadow-none transition-all">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 dark:bg-black/50 border-b border-slate-200 dark:border-white/10">
                        <tr className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-600 tracking-widest">
                            <th className="px-8 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                                <div className="flex items-center gap-2 uppercase">
                                    Timeline {sortOrder === 'desc' ? <ArrowDown size={14} className="text-blue-600" /> : <ArrowUp size={14} className="text-blue-600" />}
                                </div>
                            </th>
                            <th className="px-8 py-5">Item despachado</th>
                            <th className="px-8 py-5 text-center">Volumen</th>
                            <th className="px-8 py-5 text-center">Tanda / Lote</th>
                            <th className="px-8 py-5 text-right">Recaudación Bruta</th>
                            <th className="px-8 py-5 text-right font-black">Ganancia Real</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {sortedSales.map(s => {
                            const { date, time } = formatDate(s.created_at || s.date);
                            return (
                                <tr key={s.id} onClick={() => handleRowClick(s)} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-emerald-500/50">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-blue-600 opacity-60" />
                                                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">{date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 tabular-nums">{time}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.product_name}</span>
                                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/5 rounded-md self-start">{s.product_category}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 rounded-md text-[11px] font-black tabular-nums text-slate-900 dark:text-white uppercase">
                                            {s.quantity} {s.quantity === 1 ? 'UNIDAD' : 'UNIDADES'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {s.batch ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-md">
                                                <Sparkles size={10} className="text-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">{s.batch}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-700 uppercase italic">Venta Directa</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">S/ {(s.sale_price_pen * s.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className={`flex flex-col items-end gap-1 px-4 py-2 border rounded-lg min-w-[120px] ${(s.profit_pen || 0) >= 0 ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10' : 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'}`}>
                                            <span className={`text-sm font-black tabular-nums tracking-tight whitespace-nowrap ${(s.profit_pen || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-white'}`}>
                                                {(s.profit_pen || 0) >= 0 ? '+' : ''} S/ {(s.profit_pen || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className={`text-[7px] font-bold uppercase tracking-[0.2em] leading-none ${(s.profit_pen || 0) >= 0 ? 'text-emerald-500/40' : 'text-white/60'}`}>Utilidad Neta</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                            <button 
                                                onClick={(e)=>{ e.stopPropagation(); openModal('editSale', s); }} 
                                                className="p-2.5 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm"
                                            >
                                                <Edit2 size={13}/>
                                            </button>
                                            <button 
                                                onClick={(e)=>{ e.stopPropagation(); handleDelete(e, s); }} 
                                                className="p-2.5 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
                                            >
                                                <Trash2 size={13}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesPage;
