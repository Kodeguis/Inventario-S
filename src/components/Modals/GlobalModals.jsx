import React from 'react';
import { useModals } from '../../context/ModalContext';
import { useInventory } from '../../context/InventoryContext';
import Modal from '../Common/Modal';
import { ShoppingCart, TrendingUp, BookOpen, Package, User, Hash, DollarSign, Calendar as CalendarIcon, Search, Check, ChevronDown } from 'lucide-react';
import CustomSelect from '../Common/CustomSelect';
import { supabase } from '../../lib/supabaseClient';

const GlobalModals = () => {
  const { modals, closeModal, modalData } = useModals();
  const { refreshData, products, categories, settings } = useInventory();
  
  const [purchaseForm, setPurchaseForm] = React.useState({
    product_id: '',
    quantity: 1,
    cost_clp: 0,
    cost_pen: 0,
    currency: 'CLP',
    date: new Date().toISOString().split('T')[0]
  });

  const [searchProduct, setSearchProduct] = React.useState('');
  const [searchCategory, setSearchCategory] = React.useState('Todas');
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [isAddingNew, setIsAddingNew] = React.useState(false);

  const filteredProducts = products.filter(p => {
    const matchesText = (p.name || '').toLowerCase().includes(searchProduct.toLowerCase()) || 
                       (p.brand || '').toLowerCase().includes(searchProduct.toLowerCase());
    const matchesCat = searchCategory === 'Todas' || p.category === searchCategory;
    return matchesText && matchesCat;
  });

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseForm.product_id) return alert('Selecciona un producto');
    
    try {
      // 1. Insert Purchase
      const { error: pErr } = await supabase.from('purchases').insert([purchaseForm]);
      if (pErr) throw pErr;

      // 2. Update Product Stock and Cost
      const costKey = purchaseForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen';
      const prod = products.find(p => p.id === purchaseForm.product_id);
      const newStock = (prod?.stock || 0) + purchaseForm.quantity;

      const { error: uErr } = await supabase.from('products').update({
        stock: newStock,
        [costKey]: purchaseForm[costKey]
      }).eq('id', purchaseForm.product_id);
      
      if (uErr) throw uErr;

      closeModal('purchase');
      refreshData(true);
      setPurchaseForm({ product_id: '', quantity: 1, cost_clp: 0, cost_pen: 0, currency: 'CLP', date: new Date().toISOString().split('T')[0] });
    } catch (e) {
      alert(`Error en abastecimiento: ${e.message}`);
    }
  };

  const [saleForm, setSaleForm] = React.useState({
    product_id: '',
    quantity: 1,
    sale_price_pen: 0
  });

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleForm.product_id) return alert('Selecciona un producto');
    
    try {
      const prod = products.find(p => p.id === saleForm.product_id);
      if (!prod || prod.stock < saleForm.quantity) throw new Error('Stock insuficiente');

      const rate = parseFloat(settings.exchange_rate) || 0.0039;
      const total_sale_pen = saleForm.quantity * saleForm.sale_price_pen;
      const cost_pen_at_time = prod.currency === 'PEN' ? prod.cost_pen : (prod.cost_clp * rate);
      const profit_pen = total_sale_pen - (saleForm.quantity * cost_pen_at_time);

      // 1. Insert Sale
      const { error: sErr } = await supabase.from('sales').insert([{
        ...saleForm,
        total_sale_pen,
        profit_pen
      }]);
      if (sErr) throw sErr;

      // 2. Update Stock
      const { error: uErr } = await supabase.from('products').update({
        stock: prod.stock - saleForm.quantity
      }).eq('id', prod.id);
      if (uErr) throw uErr;

      closeModal('sale');
      refreshData(true);
      setSaleForm({ product_id: '', quantity: 1, sale_price_pen: 0 });
    } catch (e) {
      alert(`Error en venta: ${e.message}`);
    }
  };

  const selectedSaleProduct = products.find(p => p.id === saleForm.product_id);
  const costAtTime = selectedSaleProduct ? (selectedSaleProduct.currency === 'PEN' ? selectedSaleProduct.cost_pen : selectedSaleProduct.cost_clp * (parseFloat(settings.exchange_rate) || 0.0039)) : 0;
  const estimatedProfit = (saleForm.sale_price_pen - costAtTime) * saleForm.quantity;

  const selectedPurchaseProduct = products.find(p => p.id === purchaseForm.product_id);

  return (
    <>
      <Modal 
        isOpen={modals.product} 
        onClose={() => closeModal('product')} 
        title="Gestión de Producto"
        icon={BookOpen}
      >
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
           <Package size={48} className="text-slate-200" />
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Formulario Maestro de Productos</p>
             <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">El registro se gestiona directamente desde la pestaña de Catálogo</p>
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={modals.sale} 
        onClose={() => closeModal('sale')} 
        title="Registrar Venta"
        icon={ShoppingCart}
      >
        <form onSubmit={handleSaleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Producto a Liquidar</label>
              <div className="relative">
                 <button
                    type="button"
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500/20 px-8 text-sm font-black rounded-2xl flex items-center justify-between transition-all"
                 >
                    <span className={selectedSaleProduct ? 'text-emerald-600' : 'text-slate-400'}>
                       {selectedSaleProduct ? `${selectedSaleProduct.name} - ${selectedSaleProduct.brand}` : 'Seleccionar ítem...'}
                    </span>
                    <Search size={18} className="opacity-20" />
                 </button>

                 {isSelectOpen && (
                    <div className="absolute z-[1200] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                       <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                          <input 
                            autoFocus
                            className="w-full h-10 bg-slate-50 dark:bg-slate-950 px-4 rounded-xl text-[11px] font-bold outline-none border border-transparent focus:border-emerald-500/30 uppercase" 
                            placeholder="Buscar en inventario..."
                            value={searchProduct}
                            onChange={e => setSearchProduct(e.target.value)}
                          />
                       </div>

                       {/* Filtro de Categorías rápido */}
                       <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
                          {['Todas', ...(categories || []).map(c => c.name)].map(cat => (
                             <button
                                key={cat}
                                type="button"
                                onClick={() => setSearchCategory(cat)}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all border ${
                                   searchCategory === cat 
                                   ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                                   : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                }`}
                             >
                                {cat}
                             </button>
                          ))}
                       </div>

                       <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {filteredProducts
                            .filter(p => (p.stock || 0) > 0)
                            .map(p => (
                             <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                   setSaleForm({ 
                                      ...saleForm, 
                                      product_id: p.id,
                                      sale_price_pen: p.suggested_price || 0
                                   });
                                   setIsSelectOpen(false);
                                   setSearchProduct('');
                                   setSearchCategory('Todas');
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                             >
                                <div>
                                   <p className="text-[11px] font-black uppercase">{p.name}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.brand} · Stock: {p.stock} U.</p>
                                </div>
                                {saleForm.product_id === p.id && <Check size={14} className="text-emerald-600" />}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Unidades Vendidas</label>
                 <div className="relative group">
                    <Hash size={16} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-emerald-600 transition-all" />
                    <input 
                      type="number" 
                      required 
                      min="1"
                      max={selectedSaleProduct?.stock || 999}
                      className="w-full h-14 bg-slate-50 dark:bg-slate-900 pl-16 pr-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none tabular-nums shadow-inner transition-all" 
                      value={saleForm.quantity} 
                      onChange={e => setSaleForm({...saleForm, quantity: parseInt(e.target.value)})} 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Precio Final (S/)</label>
                 <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within/field:text-emerald-600 transition-colors uppercase font-mono">PEN</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      className="w-full h-14 bg-slate-50 dark:bg-slate-900 pl-16 pr-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none tabular-nums shadow-inner transition-all" 
                      value={saleForm.sale_price_pen} 
                      onChange={e => setSaleForm({...saleForm, sale_price_pen: parseFloat(e.target.value)})} 
                    />
                 </div>
              </div>
           </div>

           <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[2rem] border border-emerald-500/10 space-y-3">
              <div className="flex justify-between items-center text-emerald-600">
                 <p className="text-[9px] font-black uppercase tracking-widest">Utilidad Proyectada de Venta</p>
                 <div className="flex items-center gap-2">
                    <TrendingUp size={14} />
                    <span className="text-xl font-black tabular-nums font-mono">
                        S/ {estimatedProfit.toFixed(2)}
                    </span>
                 </div>
              </div>
              <div className="h-px bg-emerald-500/10"></div>
              <div className="flex justify-between items-center opacity-40">
                 <p className="text-[8px] font-bold uppercase tracking-tight">Total Transacción</p>
                 <p className="text-[10px] font-black tabular-nums font-mono">S/ {(saleForm.sale_price_pen * saleForm.quantity).toFixed(2)}</p>
              </div>
           </div>

           <button 
             type="submit" 
             disabled={!selectedSaleProduct || selectedSaleProduct.stock < saleForm.quantity}
             className="w-full h-16 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
           >
             Confirmar Liquidación
           </button>
        </form>
      </Modal>

      <Modal 
        isOpen={modals.purchase} 
        onClose={() => closeModal('purchase')} 
        title="Registrar Abastecimiento"
        icon={TrendingUp}
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Seleccionar Producto del Catálogo</label>
              <div className="relative">
                 <button
                    type="button"
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 px-8 text-sm font-black rounded-2xl flex items-center justify-between transition-all"
                 >
                    <span className={selectedPurchaseProduct ? 'text-indigo-600' : 'text-slate-400'}>
                       {selectedPurchaseProduct ? `${selectedPurchaseProduct.name} - ${selectedPurchaseProduct.brand}` : 'Buscar producto...'}
                    </span>
                    <Search size={18} className="opacity-20" />
                 </button>

                 {isSelectOpen && (
                    <div className="absolute z-[1200] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                       <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                          <input 
                            autoFocus
                            className="w-full h-10 bg-slate-50 dark:bg-slate-950 px-4 rounded-xl text-[11px] font-bold outline-none border border-transparent focus:border-indigo-500/30 uppercase" 
                            placeholder="Marca o Nombre..."
                            value={searchProduct}
                            onChange={e => setSearchProduct(e.target.value)}
                          />
                       </div>

                       {/* Filtro de Categorías rápido */}
                       <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
                          {['Todas', ...categories.map(c => c.name)].map(cat => (
                             <button
                                key={cat}
                                type="button"
                                onClick={() => setSearchCategory(cat)}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all border ${
                                   searchCategory === cat 
                                   ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                   : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                }`}
                             >
                                {cat}
                             </button>
                          ))}
                       </div>

                       <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {filteredProducts.map(p => (
                             <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                   setPurchaseForm({ 
                                      ...purchaseForm, 
                                      product_id: p.id,
                                      currency: p.currency,
                                      cost_clp: p.cost_clp,
                                      cost_pen: p.cost_pen
                                   });
                                   setIsSelectOpen(false);
                                   setSearchProduct('');
                                   setSearchCategory('Todas');
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                             >
                                <div>
                                   <p className="text-[11px] font-black uppercase">{p.name}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.brand} · {p.category}</p>
                                </div>
                                {purchaseForm.product_id === p.id && <Check size={14} className="text-indigo-600" />}
                             </button>
                          ))}
                          
                           {/* Acceso Rápido a Catálogo */}
                           <button
                              type="button"
                              onClick={() => {
                                setIsSelectOpen(false);
                                closeModal('purchase');
                                openModal('product');
                              }}
                              className="w-full mt-2 py-4 border-2 border-dashed border-indigo-500/30 rounded-2xl text-[10px] font-black text-indigo-600 uppercase hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2"
                           >
                              <Plus size={14} /> Registrar nuevo en catálogo
                           </button>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cantidad comprada</label>
                 <div className="relative group">
                    <Hash size={16} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-indigo-600 transition-all" />
                    <input 
                      type="number" 
                      required 
                      min="1"
                      className="w-full h-14 bg-slate-50 dark:bg-slate-900 pl-16 pr-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none tabular-nums shadow-inner transition-all" 
                      value={purchaseForm.quantity} 
                      onChange={e => setPurchaseForm({...purchaseForm, quantity: parseInt(e.target.value)})} 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha de Ingreso</label>
                 <div className="relative group">
                    <CalendarIcon size={16} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 group-focus-within:text-indigo-600 transition-all" />
                    <input 
                      type="date" 
                      required 
                      className="w-full h-14 bg-slate-50 dark:bg-slate-900 pl-16 pr-8 text-[11px] font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none uppercase shadow-inner transition-all" 
                      value={purchaseForm.date} 
                      onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} 
                    />
                 </div>
              </div>
           </div>

           <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Costo Unitario de Compra</label>
                 <CustomSelect 
                   value={purchaseForm.currency} 
                   onChange={val => setPurchaseForm({...purchaseForm, currency: val})}
                   options={['CLP', 'PEN']}
                   className="w-24"
                 />
              </div>

              <div className="relative group">
                 <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within/field:text-indigo-500 transition-colors uppercase">{purchaseForm.currency}</span>
                 <input 
                   type="number" 
                   step="0.01"
                   required 
                   className="w-full h-16 bg-white dark:bg-slate-950 px-20 text-2xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none transition-all text-indigo-600 tabular-nums shadow-sm" 
                   value={purchaseForm.currency === 'CLP' ? (purchaseForm.cost_clp || '') : (purchaseForm.cost_pen || '')} 
                   onChange={e => setPurchaseForm({
                     ...purchaseForm, 
                     [purchaseForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value)
                   })} 
                 />
              </div>

              <div className="flex justify-between items-center px-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inversión Total Estimada</p>
                 <p className="text-sm font-black text-indigo-500 tabular-nums">
                    S/ {(
                      (purchaseForm.quantity || 0) * 
                      (purchaseForm.currency === 'PEN' ? (purchaseForm.cost_pen || 0) : ((purchaseForm.cost_clp || 0) * (parseFloat(settings.exchange_rate) || 0.0039)))
                    ).toFixed(2)}
                 </p>
              </div>
           </div>

           <button 
             type="submit" 
             className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
           >
             Confirmar Abastecimiento
           </button>
        </form>
      </Modal>
    </>
  );
};

export default GlobalModals;
