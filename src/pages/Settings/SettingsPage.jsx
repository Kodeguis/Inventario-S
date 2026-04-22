import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Settings, 
  Globe, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Tag,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Layers,
  Palette,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SettingsPage = () => {
    const { categories, batches, settings, refreshData, setSettings } = useInventory();
    const [newCatName, setNewCatName] = useState('');
    const [newBatchName, setNewBatchName] = useState('');
    const [batchCategory, setBatchCategory] = useState('');

    const updateSettings = async (s) => {
        try {
            for (const key in s) {
                const val = s[key];
                if (val !== undefined && val !== null) {
                    const { error } = await supabase.from('settings').upsert({ key, value: val.toString() });
                    if (error) throw error;
                }
            }
            // Sincronización inmediata
            setSettings(prev => ({ ...prev, ...s }));
            setTimeout(() => refreshData(true), 100);
        } catch (e) {
            alert(`Error de sincronización: ${e.message}`);
        }
    };

    const addCategory = async () => {
        if (!newCatName) return;
        const nameTrimmed = newCatName.trim().toUpperCase();
        const exists = (categories || []).some(c => c.name.toUpperCase() === nameTrimmed);
        if (exists) return alert('⚠️ Esta categoría ya existe.');

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
        if (window.confirm('¿Eliminar esta categoría? Esto no afectará a los productos existentes.')) {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (!error) refreshData(true);
        }
    };

    const addBatch = async () => {
        if (!newBatchName || !batchCategory) return alert('⚠️ Debes ingresar nombre y categoría.');
        const nameTrimmed = newBatchName.trim().toUpperCase();
        const exists = (batches || []).some(b => b.name.toUpperCase() === nameTrimmed && b.category === batchCategory);
        if (exists) return alert('⚠️ Esta tanda ya existe.');

        try {
            const { error } = await supabase.from('batches').insert([{ 
                name: newBatchName.trim(),
                category: batchCategory 
            }]);
            if (error) throw error;
            setNewBatchName('');
            refreshData(true);
        } catch (e) {
            alert(`Error al añadir tanda: ${e.message}`);
        }
    };

    const deleteBatch = async (id) => {
        if (window.confirm('¿Eliminar esta tanda? No afectará a los registros pasados.')) {
            const { error } = await supabase.from('batches').delete().eq('id', id);
            if (!error) refreshData(true);
        }
    };

    const resetSystem = async () => {
        if (window.confirm('⚠️ ATENCIÓN: Esta acción BORRARÁ TODO de forma irreversible.')) {
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

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Shadcn Style */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/10 rounded-lg">
                        <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Configuración</h1>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Administra las preferencias del sistema, categorías y ciclos de inventario.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Card: Divisas */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Mercado y Divisas</h3>
                                <p className="text-xs text-slate-500">Tasa de cambio para operaciones CLP/PEN.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">Tasa actual (1.00 CLP ⇔ PEN)</label>
                            <input 
                                type="number" 
                                step="0.0001" 
                                className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 text-xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-blue-600/20 transition-all" 
                                value={settings.exchange_rate} 
                                onChange={e=>setSettings({...settings, exchange_rate: e.target.value})} 
                            />
                        </div>
                        <button 
                            onClick={()=>updateSettings({ exchange_rate: settings.exchange_rate })} 
                            className="w-full h-10 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Actualizar Tasa
                        </button>
                    </div>
                </div>

                {/* Card: Categorías */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Categorías y Segmentos</h3>
                                <p className="text-xs text-slate-500">Administra la clasificación de tus productos.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-slate-50 dark:bg-white/5 px-4 h-10 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:ring-1 focus:ring-blue-600/50 transition-all" 
                                placeholder="Nueva categoría..." 
                                value={newCatName} 
                                onChange={e=>setNewCatName(e.target.value)} 
                            />
                            <button onClick={addCategory} className="px-4 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center">
                                <Plus size={18}/>
                            </button>
                        </div>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                            {(categories || []).map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-md border border-slate-100 dark:border-white/5 group">
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{c.name}</span>
                                    <button onClick={()=>deleteCategory(c.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-600/10 rounded-md transition-all">
                                        <Trash2 size={13}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card: Tandas */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-slate-400" />
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Ciclos Operativos (Tandas)</h3>
                                <p className="text-xs text-slate-500">Organiza tu stock por lotes o temporadas.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                            <input 
                                className="w-full bg-slate-50 dark:bg-white/5 px-4 h-10 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 outline-none" 
                                placeholder="Nombre de ciclo (ej: TANDA 1)..." 
                                value={newBatchName} 
                                onChange={e=>setNewBatchName(e.target.value)} 
                            />
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 bg-slate-50 dark:bg-zinc-900 px-4 h-10 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-white/10 outline-none text-slate-500 focus:ring-2 focus:ring-blue-600/20 transition-all appearance-none cursor-pointer"
                                    value={batchCategory}
                                    onChange={e => setBatchCategory(e.target.value)}
                                >
                                    <option value="" className="bg-white dark:bg-zinc-950">Seleccionar Categoría...</option>
                                    {(categories || []).map(c => (
                                        <option key={c.id} value={c.name} className="bg-white dark:bg-zinc-950">
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={addBatch} className="px-4 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold text-[10px] uppercase tracking-widest">
                                    Crear
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {(categories || []).map(cat => {
                                const catBatches = (batches || []).filter(b => b.category === cat.name);
                                if (catBatches.length === 0) return null;
                                return (
                                    <div key={cat.id} className="space-y-1.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{cat.name}</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {catBatches.map(b => (
                                                <div key={b.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/[0.02] rounded-md border border-slate-100 dark:border-white/5 group">
                                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{b.name}</span>
                                                    <button onClick={()=>deleteBatch(b.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={12}/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Card: Zona Peligro */}
                <div className="md:col-span-2 rounded-xl border-2 border-red-500/20 bg-red-500/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20">
                            <ShieldAlert size={28}/>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-500">Zona de Peligro</h3>
                            <p className="text-xs text-red-600/70 dark:text-red-500/60 max-w-md font-medium">La purga de datos eliminará toda la historia comercial de forma permanente e irreversible.</p>
                        </div>
                    </div>
                    <button 
                        onClick={resetSystem} 
                        className="px-8 h-12 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all relative z-10 shadow-lg shadow-red-600/20"
                    >
                        Resetear Sistema Total
                    </button>
                    {/* Decorativo fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-110" />
                </div>

            </div>
        </div>
    );
};

export default SettingsPage;
