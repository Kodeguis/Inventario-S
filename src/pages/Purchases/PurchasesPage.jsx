import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  Calendar,
  Plus, 
  Trash2,
  ArrowDown,
  ArrowUp,
  Tag,
  History,
  Sparkles,
  ArrowDownLeft,
  Edit2
} from 'lucide-react';
import { useModals } from '../../context/ModalContext';
import { supabase } from '../../lib/supabaseClient';
import CustomSelect from '../../components/Common/CustomSelect';

const PurchasesPage = () => {
    const { purchases, products, categories, settings, refreshData } = useInventory();
    const { openModal } = useModals();
    const [purchaseSearch, setPurchaseSearch] = useState('');
    const [purchaseCategory, setPurchaseCategory] = useState('Todas');
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

    const filteredPurchases = (purchases || []).filter(p => {
        const s = purchaseSearch.toLowerCase();
        const matchesSearch = (p?.product_name || '').toLowerCase().includes(s) || 
                              (p?.product_category || '').toLowerCase().includes(s) ||
                              (p?.batch || '').toLowerCase().includes(s);
        const matchesCategory = purchaseCategory === 'Todas' || p?.product_category === purchaseCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedPurchases = [...filteredPurchases].sort((a, b) => {
        const dateA = new Date(a?.created_at || a?.date || 0);
        const dateB = new Date(b?.created_at || b?.date || 0);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const handleDelete = async (e, purchase) => {
        e.stopPropagation();
        if (!window.confirm('¿ELIMINAR REGISTRO DE ABASTECIMIENTO? El stock físico se ajustará automáticamente.')) return;

        try {
            const { error: dErr } = await supabase.from('purchases').delete().eq('id', purchase.id);
            if (dErr) throw dErr;

            const prod = (products || []).find(p => p.id === purchase.product_id);
            if (prod) {
                const newStock = (prod.stock || 0) - (purchase.quantity || 0);
                await supabase.from('products').update({ stock: Math.max(0, newStock) }).eq('id', prod.id);
            }
            refreshData(true);
        } catch (err) {
            alert("Error en eliminación técnica: " + err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-1">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 pt-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <History size={18} className="text-blue-600" />
                        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-none uppercase">
                            Libro de <span className="text-blue-600">Abastecimiento</span>
                        </h1>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Auditoría Temporal de Ingreso de Activos y Lotes</p>
                </div>
                
                <button 
                    onClick={() => openModal('purchase')} 
                    className="h-10 px-6 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-blue-600/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-3 border border-white/10"
                >
                    <Plus size={16}/> <span>Nueva Adquisición</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-1">
                <div className="lg:col-span-3 relative group">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                        className="w-full h-11 bg-white dark:bg-zinc-950 px-14 text-[11px] font-bold uppercase rounded-md border border-slate-200 dark:border-white/10 focus:border-blue-600/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700 shadow-sm dark:shadow-none" 
                        placeholder="Filtrar por producto, lote o categoría técnica..." 
                        value={purchaseSearch} 
                        onChange={e=>setPurchaseSearch(e.target.value)} 
                    />
                </div>
                <div className="relative">
                    <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 pointer-events-none z-10" />
                    <CustomSelect 
                        value={purchaseCategory} 
                        onChange={setPurchaseCategory} 
                        options={['Todas', ...(categories || []).map(c=>c?.name)].filter(Boolean)} 
                        className="h-11 !rounded-md !pl-11"
                        placeholder="CATEGORÍA"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden overflow-x-auto no-scrollbar shadow-sm dark:shadow-none">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 dark:bg-black/50 border-b border-slate-200 dark:border-white/10">
                        <tr className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-600 tracking-widest">
                            <th className="px-8 py-5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                                <div className="flex items-center gap-2 uppercase">
                                    Timeline {sortOrder === 'desc' ? <ArrowDown size={14} className="text-blue-600" /> : <ArrowUp size={14} className="text-blue-600" />}
                                </div>
                            </th>
                            <th className="px-8 py-5">Articulo Recibido</th>
                            <th className="px-8 py-5 text-center">Volumen</th>
                            <th className="px-8 py-5 text-center">Lote / Tanda</th>
                            <th className="px-8 py-5 text-right">Valor Inversión</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {sortedPurchases.map(p => {
                            const { date, time } = formatDate(p?.created_at || p?.date);
                            const rate = parseFloat(settings?.exchange_rate) || 0.0039;
                            const totalCostPEN = p?.currency === 'PEN' ? ((p?.cost_pen || 0) * (p?.quantity || 0)) : ((p?.cost_clp || 0) * (p?.quantity || 0) * rate);

                            return (
                                <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all border-l-4 border-l-transparent hover:border-l-blue-600/50">
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
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{p?.product_name}</span>
                                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/5 rounded-md self-start">{p?.product_category || 'GENERAL'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 rounded-md text-[10px] font-black tabular-nums">
                                            <ArrowDownLeft size={12} />
                                            {p?.quantity || 0} { (p?.quantity || 0) === 1 ? 'UNIDAD' : 'UNIDADES' }
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {p?.batch ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 rounded-md">
                                                <Tag size={12} className="text-blue-600" />
                                                <span className="text-[10px] font-black uppercase text-slate-700 dark:text-zinc-400 tabular-nums">{p.batch}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase italic">Stock Directo</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-blue-600 dark:text-blue-600 tabular-nums">S/ {totalCostPEN.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            {p?.currency === 'CLP' && <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-600 uppercase mt-0.5 tracking-tighter">Orig. {((p?.cost_clp || 0) * (p?.quantity || 0)).toLocaleString()} CLP</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                            <button 
                                                onClick={(e)=>{ e.stopPropagation(); openModal('editPurchase', p); }} 
                                                className="p-2.5 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm"
                                                title="Editar registro"
                                            >
                                                <Edit2 size={13}/>
                                            </button>
                                            <button 
                                                onClick={(e)=>handleDelete(e, p)} 
                                                className="p-2.5 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg hover:border-blue-600/50 hover:text-blue-600 transition-all shadow-sm"
                                                title="Eliminar registro"
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

export default PurchasesPage;
