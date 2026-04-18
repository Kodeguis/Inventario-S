import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  ShoppingCart, 
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useModals } from '../../context/ModalContext';
import { exportToExcel } from '../../utils/excelExport';
import { supabase } from '../../lib/supabaseClient';

const SalesPage = () => {
  const { sales, products, categories, purchases, loading, refreshData } = useInventory();
  const { openModal } = useModals();
  const [saleSearch, setSaleSearch] = useState('');
  const [saleCategory, setSaleCategory] = useState('Todas');
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

  const filteredSales = (sales || []).filter(s => {
    const search = saleSearch.toLowerCase();
    const matchesSearch = (s.product_name || '').toLowerCase().includes(search) || (s.product_category || '').toLowerCase().includes(search);
    const matchesCategory = saleCategory === 'Todas' || s.product_category === saleCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedSales = [...filteredSales].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleExport = () => {
    try {
      exportToExcel(sales, products, categories, purchases);
    } catch (error) {
       alert("Error al exportar: " + error.message);
    }
  };

  const handleRowClick = (sale) => {
    openModal('saleDetail', sale);
  };

  const handleDelete = async (e, sale) => {
    e.stopPropagation();
    if (!window.confirm('¿ELIMINAR VENTA? El stock se devolverá automáticamente.')) return;

    try {
      const { error: dErr } = await supabase.from('sales').delete().eq('id', sale.id);
      if (dErr) throw dErr;

      const prod = (products || []).find(p => p.id === sale.product_id);
      if (prod) {
        await supabase.from('products').update({ stock: (prod.stock || 0) + sale.quantity }).eq('id', prod.id);
      }
      refreshData(true);
    } catch (err) {
      alert("Error eliminando: " + err.message);
    }
  };

  const handleEdit = (e, sale) => {
    e.stopPropagation();
    openModal('editSale', sale);
  };



  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Liquidación de Ventas</h2>
           <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mt-1">Historial cronológico de transacciones y rentabilidad</p>
         </div>
          <button 
            onClick={() => openModal('sale')} 
            className="h-14 px-8 bg-emerald-600 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={18}/> Nueva Venta
          </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col items-stretch gap-4 shadow-sm">
         <div className="relative group">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-emerald-600 transition-all" />
            <input 
              className="w-full h-14 bg-slate-50 dark:bg-slate-950 px-16 text-xs font-bold rounded-2xl border border-transparent focus:border-emerald-500/30 outline-none focus:ring-4 ring-emerald-500/5 transition-all uppercase placeholder:text-slate-400" 
              placeholder="Buscar liquidación por producto..." 
              value={saleSearch} 
              onChange={e=>setSaleSearch(e.target.value)} 
            />
         </div>

         <div className="h-14 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl flex gap-2 overflow-x-auto no-scrollbar shadow-inner border border-transparent">
            {['Todas', ...(categories || []).map(c=>c.name)].map(idx => (
               <button 
                 key={idx} 
                 onClick={()=>setSaleCategory(idx)} 
                 className={`px-6 h-full whitespace-nowrap text-[9px] font-black rounded-xl transition-all ${saleCategory === idx ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {idx.toUpperCase()}
               </button>
            ))}
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
                     <th className="px-10 py-6">Producto Operado</th>
                     <th className="px-10 py-6 text-center">Volumen</th>
                     <th className="px-10 py-6 text-right">Ticket Total</th>
                     <th className="px-10 py-6 text-right">Utilidad</th>
                     <th className="px-10 py-6"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {sortedSales.map(s => (
                    <tr 
                      key={s.id} 
                      onClick={() => handleRowClick(s)}
                      className="group hover:bg-slate-50 dark:hover:bg-indigo-600/5 transition-all duration-300 cursor-pointer"
                    >
                       <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                             <Calendar size={16} className="text-slate-300 dark:text-slate-700" />
                             <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums uppercase whitespace-nowrap">
                                {formatDate(s.created_at || s.date)}
                             </span>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          <div>
                             <p className="text-sm font-black dark:text-white uppercase tracking-tight">{s.product_name}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded-md">{s.product_category}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-7 text-center">
                          <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums font-mono">{s.quantity} U.</span>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <div className="inline-block px-5 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[14px] font-black tabular-nums border border-emerald-500/5 transition-all">
                             S/ {(s.sale_price_pen * s.quantity).toFixed(2)}
                          </div>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-2 text-indigo-600 dark:text-indigo-400 font-black">
                             <TrendingUp size={14}/>
                             <span className="text-[13px] tabular-nums">S/ {(s.profit_pen || 0).toFixed(2)}</span>
                          </div>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                               <button 
                                 onClick={(e)=>handleEdit(e, s)} 
                                 className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                               >
                                 <Edit2 size={14}/>
                               </button>
                               <button 
                                 onClick={(e)=>handleDelete(e, s)} 
                                 className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                               >
                                 <Trash2 size={14}/>
                               </button>
                           </div>
                        </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default SalesPage;
