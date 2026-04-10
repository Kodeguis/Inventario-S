import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { 
  Search, 
  Star, 
  Edit2, 
  Trash2, 
  Plus, 
  BookOpen,
  Filter,
  Package
} from 'lucide-react';
import Modal from '../../components/Common/Modal';
import CustomSelect from '../../components/Common/CustomSelect';

import { supabase } from '../../lib/supabaseClient';

const CatalogPage = () => {
  const { products, categories, settings, loading, refreshData } = useInventory();
  // ... rest of the states ...
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('Todas');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({ 
    name: '', category: '', brand: '', cost_clp: 0, cost_pen: 0, suggested_price: 0, currency: 'CLP' 
  });

  const filteredCatalog = products.filter(p => {
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

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingProduct;
    let error;

    if (isEdit) {
      ({ error } = await supabase.from('products').update(productForm).eq('id', editingProduct.id));
    } else {
      ({ error } = await supabase.from('products').insert([productForm]));
    }

    if (!error) {
      setShowProductModal(false);
      setEditingProduct(null);
      refreshData(true);
    } else {
      alert(`Error: ${error.message}`);
    }
  };

  const deleteProduct = async (id) => {
    if (confirm('¿Eliminar este producto permanentemente?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) refreshData(true);
      else alert(`No se pudo eliminar: ${error.message}`);
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-indigo-600 animate-pulse">Consultando catálogo maestro...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Catálogo Comercial</h2>
           <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mt-1">Gestión avanzada de activos y márgenes de ganancia</p>
         </div>
         <button 
           onClick={() => {
             setEditingProduct(null);
              setProductForm({ name: '', category: categories[0]?.name || '', brand: '', cost_clp: 0, cost_pen: 0, suggested_price: 0, currency: 'CLP' });
             setShowProductModal(true);
           }} 
           className="h-14 px-8 bg-indigo-600 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3"
         >
           <Plus size={18}/> Nuevo Producto
         </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 shadow-sm">
         <div className="flex-1 relative group">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-indigo-600 transition-all" />
            <input 
              className="w-full h-14 bg-slate-50 dark:bg-slate-950 px-16 text-xs font-bold rounded-2xl border border-transparent focus:border-indigo-500/30 outline-none focus:ring-4 ring-indigo-500/5 transition-all uppercase placeholder:text-slate-400" 
              placeholder="Buscar por marca o nombre..." 
              value={catalogSearch} 
              onChange={e=>setCatalogSearch(e.target.value)} 
            />
         </div>
         
         <div className="flex gap-4">
            <button 
              onClick={()=>setShowOnlyFavorites(!showOnlyFavorites)} 
              className={`h-14 px-6 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase transition-all border ${showOnlyFavorites ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-800'}`}
            >
               <Star size={18} className={showOnlyFavorites ? 'fill-current' : ''}/> {showOnlyFavorites ? 'Favoritos' : 'Todos'}
            </button>
            <div className="h-14 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl flex gap-2 overflow-x-auto no-scrollbar shadow-inner border border-transparent">
               {['Todas', ...categories.map(c=>c.name)].map(c => (
                  <button 
                    key={c} 
                    onClick={()=>setCatalogCategory(c)} 
                    className={`px-6 h-full whitespace-nowrap text-[9px] font-black rounded-xl transition-all ${catalogCategory === c ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {c.toUpperCase()}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
               <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                     <th className="px-10 py-6">Identificación</th>
                     <th className="px-10 py-6 text-right">Costo Operativo</th>
                     <th className="px-10 py-6 text-right">Venta Sugerida</th>
                     <th className="px-10 py-6 text-right">Margen</th>
                     <th className="px-10 py-6 text-center">Categoría</th>
                     <th className="px-10 py-6"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredCatalog.map(p => {
                     const rate = parseFloat(settings.exchange_rate) || 0.0039;
                     const costPEN = p.currency === 'PEN' ? (p.cost_pen || 0) : ((p.cost_clp || 0) * rate);
                     const pVenta = p.suggested_price || 0;
                     const ganancia = pVenta - costPEN;

                     return (
                       <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-indigo-600/5 transition-all duration-300">
                          <td className="px-10 py-7">
                             <div className="flex items-center gap-5">
                                <button onClick={()=>toggleFavorite(p)} className={`transition-all hover:scale-125 ${p.is_favorite ? 'text-amber-500' : 'text-slate-200 dark:text-slate-700'}`}>
                                  <Star size={18} className={p.is_favorite ? 'fill-current' : ''}/>
                                </button>
                                <div>
                                   <p className="text-sm font-black dark:text-white uppercase tracking-tight">{p.name}</p>
                                   <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.brand}</span>
                                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded-md">{p.category}</span>
                                   </div>
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-7 text-right">
                             <p className="text-[13px] font-black text-slate-900 dark:text-white tabular-nums">S/ {costPEN.toFixed(2)}</p>
                             {p.currency === 'CLP' && <p className="text-[9px] font-bold text-slate-400 italic mt-1">{p.cost_clp.toLocaleString()} CLP</p>}
                          </td>
                          <td className="px-10 py-7 text-right">
                             <p className="text-[13px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums font-mono">S/ {pVenta.toFixed(2)}</p>
                          </td>
                          <td className="px-10 py-7 text-right">
                             <div className={`inline-block px-4 py-2 rounded-xl text-[11px] font-black tabular-nums border ${ganancia >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {ganancia >= 0 ? '+' : ''} S/ {ganancia.toFixed(2)}
                             </div>
                          </td>
                          <td className="px-10 py-7 text-center">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{p.category}</span>
                          </td>
                          <td className="px-10 py-7 text-right">
                             <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button 
                                  onClick={()=>{
                                    setEditingProduct(p); 
                                    setProductForm(p); 
                                    setShowProductModal(true);
                                  }} 
                                  className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                >
                                  <Edit2 size={16}/>
                                </button>
                                <button 
                                  onClick={()=>deleteProduct(p.id)} 
                                  className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                                >
                                  <Trash2 size={16}/>
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

      {/* Modal de Producto */}
      <Modal 
        isOpen={showProductModal} 
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? "Editar Registro de Producto" : "Finalizar Identificación de Activo"}
        icon={BookOpen}
      >
        <form onSubmit={handleProductSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre Comercial del Ítem</label>
              <input 
                required 
                className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-sm font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none focus:ring-4 ring-indigo-500/5 uppercase shadow-inner transition-all" 
                placeholder="Nombre descriptivo..." 
                value={productForm.name} 
                onChange={e=>setProductForm({...productForm, name: e.target.value})} 
              />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Clasificación Maestro</label>
                  <CustomSelect 
                    value={productForm.category} 
                    onChange={val => setProductForm({...productForm, category: val})}
                    options={categories.map(c => ({ label: c.name, value: c.name }))}
                  />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Marca / Fabricante</label>
                 <input 
                   className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-[11px] font-black rounded-2xl border-2 border-transparent outline-none uppercase shadow-inner" 
                   placeholder="Marca" 
                   value={productForm.brand} 
                   onChange={e=>setProductForm({...productForm, brand: e.target.value})} 
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
              {/* Bloque Precio Venta */}
              <div className="space-y-3">
                 <div className="h-10 flex items-center">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">Precio Sugerido Venta</label>
                 </div>
                 <div className="relative group/field">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within/field:text-emerald-500 transition-colors">PEN</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      className="w-full h-14 bg-white dark:bg-slate-950 px-14 text-xl font-black rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none transition-all text-emerald-600 tabular-nums shadow-sm" 
                      value={productForm.suggested_price || ''} 
                      onChange={e=>setProductForm({...productForm, suggested_price: parseFloat(e.target.value)})} 
                      placeholder="0.00"
                    />
                 </div>
              </div>

              {/* Bloque Costo Compra */}
              <div className="space-y-3">
                 <div className="h-10 flex justify-between items-center">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Costo de Inversión</label>
                   <CustomSelect 
                     value={productForm.currency} 
                     onChange={val => setProductForm({...productForm, currency: val})}
                     options={['CLP', 'PEN']}
                     className="w-24"
                   />
                 </div>
                 
                 <div className="relative group/field">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within/field:text-indigo-500 transition-colors">{productForm.currency}</span>
                    <input 
                      type="number" 
                      step={productForm.currency === 'PEN' ? '0.01' : '1'} 
                      required 
                      className="w-full h-14 bg-white dark:bg-slate-950 px-14 text-xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none transition-all text-indigo-600 tabular-nums shadow-sm" 
                      value={productForm.currency === 'CLP' ? (productForm.cost_clp || '') : (productForm.cost_pen || '')} 
                      onChange={e=>setProductForm({
                        ...productForm, 
                        [productForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value)
                      })} 
                      placeholder="0.00"
                    />
                 </div>
              </div>

              {/* Proyección (Ocupa las dos columnas en móvil, se alinea con el grid en desktop) */}
              <div className="md:col-span-2 mt-2 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between px-8">
                 <div className="flex flex-col">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Margen Bruto Proyectado</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Utilidad neta estimada por unidad</p>
                 </div>
                 <p className="text-2xl font-black text-indigo-600 font-mono">
                    S/ {(
                      (productForm.suggested_price || 0) - 
                      (productForm.currency === 'PEN' ? (productForm.cost_pen || 0) : ((productForm.cost_clp || 0) * (parseFloat(settings.exchange_rate) || 0.0039)))
                    ).toFixed(2)}
                 </p>
              </div>
           </div>

           <button 
             type="submit" 
             className="w-full h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-2"
           >
             {editingProduct ? 'Actualizar Producto' : 'Publicar Registro'}
           </button>
        </form>
      </Modal>
    </div>
  );
};

export default CatalogPage;
