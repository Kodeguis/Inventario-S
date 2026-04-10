import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  TrendingUp, 
  Calendar,
  Box,
  ArrowDownLeft,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useModals } from '../../context/ModalContext';
import { supabase } from '../../lib/supabaseClient';

const PurchasesPage = () => {
  const { purchases, products, settings, loading, refreshData } = useInventory();
  const { openModal } = useModals();
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' o 'asc'

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const date = d.toISOString().split('T')[0];
      const time = d.toTimeString().split(' ')[0].substring(0, 5);
      return `${date} · ${time}`;
    } catch (e) {
      return dateStr || 'N/A';
    }
  };

  const filteredPurchases = (purchases || []).filter(p => 
    (p.product_name || '').toLowerCase().includes(purchaseSearch.toLowerCase()) ||
    (p.product_category || '').toLowerCase().includes(purchaseSearch.toLowerCase())
  );

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleDelete = async (e, purchase) => {
    e.stopPropagation();
    if (!window.confirm('¿ELIMINAR COMPRA? El stock se restará automáticamente.')) return;

    try {
      const { error: dErr } = await supabase.from('purchases').delete().eq('id', purchase.id);
      if (dErr) throw dErr;

      const prod = (products || []).find(p => p.id === purchase.product_id);
      if (prod) {
        const newStock = (prod.stock || 0) - purchase.quantity;
        await supabase.from('products').update({ stock: Math.max(0, newStock) }).eq('id', prod.id);
      }
      refreshData(true);
    } catch (err) {
      alert("Error eliminando: " + err.message);
    }
  };

  const handleEdit = (e, purchase) => {
    e.stopPropagation();
    openModal('editPurchase', purchase);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Historial de Abastecimiento</h2>
           <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mt-1">Registro de adquisiciones y reposición de inventario</p>
         </div>
          <button 
            onClick={() => openModal('purchase')} 
            className="h-14 px-8 bg-indigo-600 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={18}/> Nueva Compra
          </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 shadow-sm">
         <div className="flex-1 relative group">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-indigo-600 transition-all" />
            <input 
              className="w-full h-14 bg-slate-50 dark:bg-slate-950 px-16 text-xs font-bold rounded-2xl border border-transparent focus:border-indigo-500/30 outline-none focus:ring-4 ring-indigo-500/5 transition-all uppercase placeholder:text-slate-400" 
              placeholder="Buscar compra por producto..." 
              value={purchaseSearch} 
              onChange={e=>setPurchaseSearch(e.target.value)} 
            />
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
               <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                     <th 
                        className="px-10 py-6 cursor-pointer hover:text-indigo-600 transition-colors group"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                     >
                        <div className="flex items-center gap-2">
                           Timeline
                           {sortOrder === 'desc' ? <ArrowDown size={14}/> : <ArrowUp size={14}/>}
                        </div>
                     </th>
                     <th className="px-10 py-6">Ítem Adquirido</th>
                     <th className="px-10 py-6 text-center">Cantidad</th>
                     <th className="px-10 py-6 text-right">Inversión (PEN)</th>
                     <th className="px-10 py-6"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {sortedPurchases.map(p => {
                    const rate = parseFloat(settings.exchange_rate) || 0.0039;
                    const totalCostPEN = p.currency === 'PEN' ? (p.cost_pen * p.quantity) : (p.cost_clp * p.quantity * rate);

                    return (
                      <tr 
                        key={p.id} 
                        className="group hover:bg-slate-50 dark:hover:bg-indigo-600/5 transition-all duration-300"
                      >
                         <td className="px-10 py-7">
                            <div className="flex items-center gap-4">
                               <Calendar size={16} className="text-slate-300" />
                               <span className="text-[11px] font-bold text-slate-500 tabular-nums uppercase whitespace-nowrap">
                                  {formatDate(p.created_at || p.date)}
                               </span>
                            </div>
                         </td>
                         <td className="px-10 py-7">
                            <div>
                               <p className="text-sm font-black dark:text-white uppercase tracking-tight">{p.product_name}</p>
                               <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded-md mt-1 inline-block">{p.product_category || 'General'}</span>
                            </div>
                         </td>
                         <td className="px-10 py-7 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-black tabular-nums border border-slate-100 dark:border-slate-800">
                               <ArrowDownLeft size={14} className="text-emerald-500" />
                               {p.quantity} U.
                            </div>
                         </td>
                         <td className="px-10 py-7 text-right">
                            <div className="inline-block px-5 py-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-[14px] font-black tabular-nums border border-rose-100 dark:border-rose-900/50">
                               S/ {totalCostPEN.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                         </td>
                         <td className="px-10 py-7 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                               <button 
                                 onClick={(e)=>handleEdit(e, p)} 
                                 className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                               >
                                 <Edit2 size={14}/>
                               </button>
                               <button 
                                 onClick={(e)=>handleDelete(e, p)} 
                                 className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                               >
                                 <Trash2 size={14}/>
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
    </div>
  );
};

export default PurchasesPage;
