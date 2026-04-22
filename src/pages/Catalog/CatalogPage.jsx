import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  Star, 
  Edit2, 
  Trash2, 
  Plus, 
  BookOpen,
  Tag,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Sparkles
} from 'lucide-react';
import { useModals } from '../../context/ModalContext';
import CustomSelect from '../../components/Common/CustomSelect';
import { supabase } from '../../lib/supabaseClient';
import { exportCatalogToPDF } from '../../utils/pdfExport';
import { FileText as FilePdf } from 'lucide-react';

const CatalogPage = () => {
    const { products, categories, settings, refreshData } = useInventory();
    const { openModal } = useModals();
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogCategory, setCatalogCategory] = useState('Todas');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

    const filteredCatalog = (products || []).filter(p => {
        const s = catalogSearch.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s);
        const matchesCategory = catalogCategory === 'Todas' || p.category === catalogCategory;
        const matchesFavorite = !showOnlyFavorites || p.is_favorite;
        return matchesSearch && matchesCategory && matchesFavorite;
    });

    const toggleFavorite = async (product) => {
        const { error } = await supabase
            .from('products')
            .update({ is_favorite: !product.is_favorite })
            .eq('id', product.id);
        if (!error) refreshData(true);
    };

    const deleteProduct = async (id) => {
        if (window.confirm('¿Eliminar este producto permanentemente?')) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (!error) refreshData(true);
            else alert(`No se pudo eliminar: ${error.message}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-1">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 pt-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={18} className="text-blue-600" />
                        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            Catálogo <span className="text-blue-600">Maestro</span>
                        </h1>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Gestión Central de Referencia y Márgenes de Ganancia</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                       onClick={() => exportCatalogToPDF(filteredCatalog, categories)} 
                       className="h-10 px-6 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <FilePdf size={16} className="text-red-500" /> <span>Exportar Catálogo PDF</span>
                    </button>
                    <button 
                       onClick={() => openModal('product')} 
                       className="h-10 px-6 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-blue-600/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <Plus size={16}/> <span>Nuevo Registro</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-1">
                <div className="lg:col-span-3 relative group">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600" />
                    <input 
                        className="w-full h-11 bg-white dark:bg-zinc-950 px-14 text-[11px] font-bold uppercase rounded-md border border-slate-200 dark:border-white/10 focus:border-blue-600/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-700" 
                        placeholder="Buscar por marca o nombre de producto técnico..." 
                        value={catalogSearch} 
                        onChange={e=>setCatalogSearch(e.target.value)} 
                    />
                </div>
                <button 
                    onClick={()=>setShowOnlyFavorites(!showOnlyFavorites)} 
                    className={`h-11 px-6 rounded-md flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all border ${showOnlyFavorites ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/10' : 'bg-white dark:bg-zinc-950 text-slate-400 dark:text-zinc-600 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    <Star size={16} className={showOnlyFavorites ? 'fill-current' : ''}/> {showOnlyFavorites ? 'Favoritos' : 'Todo el Sistema'}
                </button>
            </div>

            <nav className="flex items-center gap-2 p-1 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg overflow-x-auto no-scrollbar mx-1 shadow-sm dark:shadow-none">
                {['Todas', ...(categories || []).map(c=>c.name)].map(c => (
                    <button 
                        key={c} 
                        onClick={()=>setCatalogCategory(c)} 
                        className={`px-6 h-8 whitespace-nowrap text-[10px] font-bold uppercase rounded-md transition-all ${catalogCategory === c ? 'bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        {c}
                    </button>
                ))}
            </nav>

            <div className="mx-1 bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden overflow-x-auto no-scrollbar shadow-sm dark:shadow-none">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 dark:bg-black/50 border-b border-slate-200 dark:border-white/10">
                        <tr className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-600 tracking-widest">
                            <th className="px-8 py-5">Identificación del Ítem</th>
                            <th className="px-8 py-5 text-right">Inversión Unit.</th>
                            <th className="px-8 py-5 text-right">PVP Sugerido</th>
                            <th className="px-8 py-5 text-right">Margen Neto</th>
                            <th className="px-8 py-5 text-center">Clasificación</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredCatalog.map(p => {
                            const rate = parseFloat(settings?.exchange_rate) || 0.0039;
                            const costPEN = p.currency === 'PEN' ? (p.cost_pen || 0) : ((p.cost_clp || 0) * rate);
                            const pVenta = p.suggested_price || 0;
                            const ganancia = pVenta - costPEN;

                            return (
                                <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all border-l-4 border-l-transparent hover:border-l-blue-600/50">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-5">
                                            <button onClick={()=>toggleFavorite(p)} className={`transition-all hover:scale-125 ${p.is_favorite ? 'text-amber-500' : 'text-slate-200 dark:text-zinc-800'}`}>
                                                <Star size={16} className={p.is_favorite ? 'fill-current' : ''}/>
                                            </button>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-wider">{p.brand || 'Genérico'}</span>
                                                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">ID {p.id.slice(-4)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">S/ {costPEN.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            {p.currency === 'CLP' && <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mt-0.5">{p.cost_clp.toLocaleString()} CLP</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="text-xs font-black text-emerald-500 tabular-nums">S/ {pVenta.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold">
                                        <div className={`px-3 py-1 text-[10px] tabular-nums rounded-md inline-block border ${ganancia >= 0 ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'}`}>
                                            {ganancia >= 0 ? '+' : ''} S/ {ganancia.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-600 uppercase tracking-widest px-3 py-1.5 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/5 rounded-md self-center inline-block">{p.category}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={()=>openModal('editProduct', p)} 
                                                className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-md hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm"
                                            >
                                                <Edit2 size={13}/>
                                            </button>
                                            <button 
                                                onClick={()=>deleteProduct(p.id)} 
                                                className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-md hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
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

export default CatalogPage;
