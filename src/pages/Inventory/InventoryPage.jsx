import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Trash2,
  PieChart,
  Layers,
  ArrowUpRight,
  Target,
  Sparkles,
  Edit2,
  Tag
} from 'lucide-react';
import { useModals } from '../../context/ModalContext';
import CustomSelect from '../../components/Common/CustomSelect';
import KPICard from '../../components/Common/KPICard';
import { supabase } from '../../lib/supabaseClient';

const InventoryPage = () => {
    const { products, categories, settings, loading, refreshData, purchases, batches } = useInventory();
    const { openModal } = useModals();
    const [inventorySearch, setInventorySearch] = useState('');
    const [inventoryCategory, setInventoryCategory] = useState('Todas');
    const [inventoryBatch, setInventoryBatch] = useState('Todas');

    // Filter validation: Reset batch if category changes or if category is "Todas"
    React.useEffect(() => {
        const validBatches = ['Todas', ...Array.from(new Set((batches || []).filter(b => inventoryCategory === 'Todas' || b.category === inventoryCategory).map(b => b.name)))];
        if (inventoryCategory === 'Todas' || !validBatches.includes(inventoryBatch)) {
            setInventoryBatch('Todas');
        }
    }, [inventoryCategory, batches, inventoryBatch]);

    const filteredInventory = (products || []).filter(p => {
        const s = inventorySearch.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s);
        const matchesCategory = inventoryCategory === 'Todas' || p.category === inventoryCategory;
        
        // Batch filtering logic
        let matchesBatch = inventoryBatch === 'Todas';
        if (!matchesBatch) {
            const pTandas = [...new Set((purchases || []).filter(pu => pu.product_id === p.id).map(pu => pu.batch))].filter(Boolean);
            matchesBatch = pTandas.includes(inventoryBatch);
        }

        return (p.stock > 0) && matchesSearch && matchesCategory && matchesBatch;
    });

    const stats = filteredInventory.reduce((acc, p) => {
        const rate = parseFloat(settings?.exchange_rate) || 0.0039;
        const costPEN = p.currency === 'PEN' ? (p.cost_pen || 0) : ((p.cost_clp || 0) * rate);
        const profitPerUnit = (p.suggested_price || 0) - costPEN;
        
        acc.totalInvestment += costPEN * p.stock;
        acc.totalProjectedProfit += profitPerUnit * p.stock;
        acc.totalUnits += p.stock;
        return acc;
    }, { totalInvestment: 0, totalProjectedProfit: 0, totalUnits: 0 });

    const resetProductStock = async (id) => {
        if (window.confirm('¿Retirar este producto del inventario activo? El stock físico se reseteará a 0.')) {
            try {
                const { error } = await supabase.from('products').update({ stock: 0 }).eq('id', id);
                if (error) throw error;
                await refreshData(true);
            } catch (err) {
                alert(`Error al resetear stock: ${err.message}`);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-1">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 pt-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Package size={18} className="text-emerald-500" />
                        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            Monitor de <span className="text-emerald-500">Stock Real</span>
                        </h1>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Auditoría de Existencias Físicas y Patrimonio en Almacén</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard 
                    label="Utilidad Latente" 
                    value={`S/ ${stats.totalProjectedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                    color="emerald" 
                    icon={<TrendingUp size={15}/>}
                    sub="Margen bruto en estantería" 
                />
                <KPICard 
                    label="Capital Inmóvil" 
                    value={`S/ ${stats.totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                    color="zinc" 
                    icon={<PieChart size={15}/>}
                    sub="Valorización de activos" 
                />
                <KPICard 
                    label="Volumen Físico" 
                    value={`${stats.totalUnits} Unidades`} 
                    color="blue" 
                    icon={<Layers size={15}/>}
                    sub="Total piezas físicas" 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="md:col-span-2 lg:col-span-3 relative group">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600" />
                    <input 
                        className="w-full h-11 bg-white dark:bg-zinc-950 px-14 text-[11px] font-bold uppercase rounded-md border border-slate-200 dark:border-white/10 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700 shadow-sm dark:shadow-none" 
                        placeholder="Filtrar por nombre o marca en stock..." 
                        value={inventorySearch} 
                        onChange={e=>setInventorySearch(e.target.value)} 
                    />
                </div>
                <div className="relative">
                    <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 pointer-events-none z-10" />
                    <CustomSelect 
                        value={inventoryCategory} 
                        onChange={setInventoryCategory} 
                        options={['Todas', ...(categories || []).map(c=>c.name)].filter(Boolean)} 
                        className="h-11 !rounded-md !pl-11"
                        placeholder="CATEGORÍA"
                    />
                </div>
                <div className={`relative transition-all duration-300 ${inventoryCategory === 'Todas' ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                    <Sparkles size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 pointer-events-none z-10" />
                    <CustomSelect 
                        value={inventoryBatch} 
                        onChange={setInventoryBatch} 
                        options={inventoryCategory === 'Todas' ? [] : ['Todas', ...Array.from(new Set((batches || []).filter(b => b.category === inventoryCategory).map(b => b.name)))]} 
                        className="h-11 !rounded-md !pl-11"
                        placeholder="TANDA / LOTE"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden overflow-x-auto no-scrollbar shadow-sm dark:shadow-none">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-50 dark:bg-black/50 border-b border-slate-200 dark:border-white/10">
                        <tr className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-600 tracking-widest">
                            <th className="px-8 py-5 text-left">Ítem en Almacén</th>
                            <th className="px-8 py-5 text-center">Identidad de Lote</th>
                            <th className="px-8 py-5 text-center">Nivel de Stock</th>
                            <th className="px-8 py-5 text-right">Inversión Ref.</th>
                            <th className="px-8 py-5 text-right">Patrimonio Total</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredInventory.map(p => {
                            const rate = parseFloat(settings?.exchange_rate) || 0.0039;
                            const costPEN = p.currency === 'PEN' ? (p.cost_pen || 0) : ((p.cost_clp || 0) * rate);
                            const isLowStock = p.stock < 5;

                            return (
                                <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all border-l-4 border-l-transparent hover:border-l-emerald-500/50">
                                    <td className="px-8 py-5 text-left">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-2.5 rounded-lg border ${isLowStock ? 'bg-blue-600/5 text-blue-600 border-blue-600/20' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20'}`}>
                                                <Target size={16}/>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{p.brand || 'GENÉRICO'} · {p.category}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {(() => {
                                            const pTandas = [...new Set((purchases || []).filter(pu => pu.product_id === p.id).map(pu => pu.batch))].filter(Boolean);
                                            return (
                                                <div className="flex flex-wrap justify-center gap-1.5">
                                                    {pTandas.length > 0 ? pTandas.map(t => (
                                                        <span key={`${p.id}-${t}`} className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-600 uppercase">
                                                            {t}
                                                        </span>
                                                    )) : (
                                                        <span className="text-[9px] font-bold text-slate-300 dark:text-zinc-800 uppercase tracking-tighter italic">Sin Tanda</span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black border tabular-nums ${isLowStock ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-slate-100 dark:bg-black border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-500'}`}>
                                            {isLowStock && <AlertCircle size={12}/>}
                                            {p.stock} {p.stock === 1 ? 'UNIDAD' : 'UNIDADES'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">S/ {costPEN.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-700 uppercase tracking-tighter mt-0.5">COSTO UNITARIO</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-500 tabular-nums">S/ {(costPEN * p.stock).toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                                            <span className="text-[8px] font-black text-emerald-500/30 uppercase tracking-[0.2em] mt-0.5">ESTADO ACTIVO</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                            <button 
                                                onClick={() => openModal('editProduct', p)}
                                                className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-md hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm"
                                                title="Editar Producto"
                                            >
                                                <Edit2 size={13}/>
                                            </button>
                                            <button 
                                                onClick={() => resetProductStock(p.id)}
                                                className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-md hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
                                                title="Resetear Stock"
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

            <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-start gap-4">
               <Sparkles className="text-emerald-500 shrink-0 mt-1" size={18} />
               <div>
                  <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1">Nota de Inteligencia en Stock</p>
                  <p className="text-[10px] text-emerald-600/70 font-bold leading-relaxed uppercase">
                     El valor patrimonial total se calcula en base al costo de adquisición referencial. El stock bajo (menos de 5 unidades) se resalta automáticamente para priorizar el reabastecimiento técnico.
                  </p>
               </div>
            </div>
        </div>
    );
};



export default InventoryPage;
