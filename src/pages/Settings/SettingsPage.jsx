import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Settings, 
  Globe, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Tag,
  ShieldAlert
} from 'lucide-react';

import { supabase } from '../../lib/supabaseClient';

const SettingsPage = () => {
  const { categories, settings, refreshData, setSettings, loading } = useInventory();
  const [newCatName, setNewCatName] = useState('');

  const updateSettings = async (s) => {
    try {
      for (const key in s) {
        await supabase.from('settings').upsert({ key, value: s[key].toString() });
      }
      alert('✅ Parámetros sincronizados correctamente');
      refreshData(true);
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  const addCategory = async () => {
    if (!newCatName) return;
    try {
      const { error } = await supabase.from('categories').insert([{ name: newCatName.trim() }]);
      if (error) throw error;
      setNewCatName('');
      refreshData(true);
    } catch (e) {
      alert(`Error al añadir: ${e.message}`);
    }
  };

  const deleteCategory = async (id) => {
    if (confirm('¿Eliminar esta categoría? Esto no afectará a los productos existentes.')) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) refreshData(true);
    }
  };

  const resetSystem = async () => {
    if (confirm('⚠️ ATENCIÓN: Esta acción BORRARÁ TODO (Productos, Ventas, Compras) de forma irreversible.')) {
      try {
        await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        alert('Sistema reseteado correctamente');
        refreshData(true);
      } catch (e) {
        alert(`Error: ${e.message}`);
      }
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-indigo-600 animate-pulse">Cargando configuración del núcleo...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
      <div className="flex items-center gap-5">
         <div className="p-3.5 bg-indigo-600 rounded-[1.25rem] text-white shadow-xl shadow-indigo-600/20">
            <Settings size={28}/>
         </div>
         <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Maquinaria de Ajustes</h2>
           <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mt-1">Configuración global del motor de inventario</p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
         {/* TIPO DE CAMBIO */}
         <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 transition-transform group-hover:rotate-0 duration-1000">
              <Globe size={180}/>
            </div>
            <div className="flex items-center gap-4 opacity-40">
               <Globe size={20}/>
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Conversión Divisaria</h3>
            </div>
            
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-slate-400 mb-8 tracking-[0.5em] uppercase">1.00 CLP ⇔ PEN</p>
               <div className="flex items-center gap-8 bg-slate-50 dark:bg-slate-950 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner w-full">
                  <input 
                    type="number" 
                    step="0.0001" 
                    className="bg-transparent text-7xl font-black text-indigo-600 outline-none w-full tabular-nums text-center focus:scale-105 transition-transform" 
                    value={settings.exchange_rate} 
                    onChange={e=>setSettings({...settings, exchange_rate: e.target.value})} 
                  />
                  <span className="text-3xl font-black opacity-20 pr-4">PEN</span>
               </div>
            </div>
            <button 
              onClick={()=>updateSettings(settings)} 
              className="w-full h-20 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-95"
            >
              Sincronizar Parámetros Maestros
            </button>
         </div>

         {/* CATEGORÍAS */}
         <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
            <div className="flex items-center gap-4 opacity-40">
               <Tag size={20}/>
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Categorías Dinámicas</h3>
            </div>
            
            <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-950 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-inner">
               <input 
                 className="flex-1 bg-transparent px-8 py-5 text-sm font-black outline-none uppercase placeholder:text-slate-400" 
                 placeholder="Definir nueva categoría..." 
                 value={newCatName} 
                 onChange={e=>setNewCatName(e.target.value)} 
               />
               <button 
                 onClick={addCategory} 
                 className="h-16 w-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-slate-900 transition-all shadow-xl active:scale-75"
               >
                 <Plus size={32}/>
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
               {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-6 bg-white dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:scale-[1.02] transition-all group shadow-sm">
                      <div className="flex items-center gap-5">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"></div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{c.name}</span>
                      </div>
                      <button 
                        onClick={()=>deleteCategory(c.id)} 
                        className="opacity-0 group-hover:opacity-100 h-12 w-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-lg shadow-rose-500/20"
                      >
                        <Trash2 size={18}/>
                      </button>
                  </div>
               ))}
            </div>
         </div>

         {/* ZONA DE PELIGRO */}
         <div className="bg-rose-50/50 dark:bg-rose-950/10 p-12 rounded-[3.5rem] border border-rose-100 dark:border-rose-900/40 space-y-8 relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-[0.05] -rotate-12 transition-transform group-hover:scale-110 duration-700">
               <ShieldAlert size={200} />
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="p-4 bg-rose-600 rounded-2xl text-white shadow-xl shadow-rose-600/20">
                  <AlertCircle size={32}/>
               </div>
               <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-rose-600">Protocolo de Emergencia</h3>
               <p className="text-[11px] font-bold text-rose-500/70 uppercase leading-relaxed max-w-md">
                 Esta acción ejecutará una purga total de la base de datos. Todos los registros comerciales serán eliminados permanentemente del sistema.
               </p>
            </div>
            <button 
              onClick={resetSystem} 
              className="w-full h-20 bg-rose-600 text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 relative z-10"
            >
               Reiniciar Sistema (Factory Reset)
            </button>
         </div>
      </div>
    </div>
  );
};

export default SettingsPage;
