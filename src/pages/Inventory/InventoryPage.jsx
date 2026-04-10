import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  Package, 
  Plus, 
  Edit2, 
  Trash2,
  AlertCircle
} from 'lucide-react';

const InventoryPage = () => {
  const { products, categories, settings, loading, refreshData } = useInventory();
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('Todas');

  const filteredInventory = products.filter(p => {
    const s = inventorySearch.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s);
    const matchesCategory = inventoryCategory === 'Todas' || p.category === inventoryCategory;
    return (p.stock > 0) && matchesSearch && matchesCategory;
  });

  if (loading) return <div className="h-[60vh] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-indigo-600 animate-pulse">Escaneando existencias físicas...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
           <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Registro de Existencias</h2>
           <p className="text-[10px] md:text-[11px] uppercase font-bold text-slate-400 tracking-widest mt-1">Control métrico de stock físico y valoración</p>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col items-stretch gap-4 shadow-sm">
         <div className="relative group">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-indigo-600 transition-all" />
            <input 
              className="w-full h-14 bg-slate-50 dark:bg-slate-950 px-16 text-xs font-bold rounded-2xl border border-transparent focus:border-indigo-500/30 outline-none focus:ring-4 ring-indigo-500/5 transition-all uppercase placeholder:text-slate-400" 
              placeholder="Filtro rápido de inventario..." 
              value={inventorySearch} 
              onChange={e=>setInventorySearch(e.target.value)} 
            />
         </div>
         
         <div className="h-14 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl flex gap-2 overflow-x-auto no-scrollbar shadow-inner border border-transparent">
            {['Todas', ...categories.map(c=>c.name)].map(c => (
               <button 
                 key={c} 
                 onClick={()=>setInventoryCategory(c)} 
                 className={`px-6 h-full whitespace-nowrap text-[9px] font-black rounded-xl transition-all ${inventoryCategory === c ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {c.toUpperCase()}
               </button>
            ))}
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
         <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            <table className="w-full text-left min-w-[800px]">
               <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                     <th className="px-10 py-6">Ítem en Almacén</th>
                     <th className="px-10 py-6 text-center">Nivel de Stock</th>
                     <th className="px-10 py-6 text-right">Valor Unitario</th>
                     <th className="px-10 py-6 text-right">Capital Total</th>
                     <th className="px-10 py-6"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredInventory.map(p => {
                    const rate = parseFloat(settings.exchange_rate) || 0.0039;
                    const costPEN = p.currency === 'PEN' ? (p.cost_pen || 0) : ((p.cost_clp || 0) * rate);
                    const isLowStock = p.stock < 5;

                    return (
                      <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-indigo-600/5 transition-all duration-300">
                         <td className="px-10 py-7">
                            <div className="flex items-center gap-5">
                               <div className={`p-3.5 rounded-2xl ${isLowStock ? 'bg-rose-500/10 text-rose-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                 <Package size={20}/>
                               </div>
                               <div>
                                  <p className="text-sm font-black dark:text-white uppercase tracking-tight">{p.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.brand} | {p.category}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-7 text-center">
                            <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-2xl text-[12px] font-black border tabular-nums transition-all ${isLowStock ? 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-600/20' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                               {isLowStock && <AlertCircle size={14}/>}
                               {p.stock} UNIDADES
                            </div>
                         </td>
                         <td className="px-10 py-7 text-right">
                            <p className="text-[13px] font-black text-slate-900 dark:text-white tabular-nums">S/ {costPEN.toFixed(2)}</p>
                            <span className="text-[9px] font-bold text-slate-400 opacity-40 italic">Ref. unitario</span>
                         </td>
                         <td className="px-10 py-7 text-right">
                             <p className="text-[14px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">S/ {(costPEN * p.stock).toLocaleString()}</p>
                             <span className="text-[9px] font-black text-indigo-500/30 uppercase tracking-tighter">Valorizado</span>
                         </td>
                         <td className="px-10 py-7 text-right">
                             <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                  <Edit2 size={16}/>
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

export default InventoryPage;
