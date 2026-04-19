import React from 'react';
import { useModals } from '../../context/ModalContext';
import { useInventory } from '../../context/InventoryContext';
import Modal from '../Common/Modal';
import { ShoppingCart, TrendingUp, BookOpen, Package, User, Hash, DollarSign, Calendar as CalendarIcon, Search, Check, ChevronDown, Plus, Info } from 'lucide-react';
import CustomSelect from '../Common/CustomSelect';
import { supabase } from '../../lib/supabaseClient';

const GlobalModals = () => {
  const { modals, openModal, closeModal, modalData } = useModals();
  const { refreshData, products, categories, batches, settings, purchases } = useInventory();
  
  const [purchaseForm, setPurchaseForm] = React.useState({
    product_id: '',
    quantity: 1,
    cost_clp: 0,
    cost_pen: 0,
    currency: 'CLP',
    batch: '',
    date: new Date().toISOString()
  });

  const [searchProduct, setSearchProduct] = React.useState('');
  const [searchCategory, setSearchCategory] = React.useState('Todas');
  const [searchTanda, setSearchTanda] = React.useState('Todas');
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [productForm, setProductForm] = React.useState({ 
    name: '', category: '', brand: '', cost_clp: 0, cost_pen: 0, suggested_price: 0, currency: 'CLP', stock: 0 
  });
  
  const existingTandaNames = (batches || []).map(b => b.name);

  React.useEffect(() => {
    if (existingTandaNames.length > 0) {
      if (!purchaseForm.batch) setPurchaseForm(prev => ({ ...prev, batch: existingTandaNames[0] }));
    }
  }, [batches]);
  
  const filteredProducts = (products || []).filter(p => {
    const matchesText = (p.name || '').toLowerCase().includes(searchProduct.toLowerCase()) || 
                       (p.brand || '').toLowerCase().includes(searchProduct.toLowerCase());
    const matchesCat = searchCategory === 'Todas' || p.category === searchCategory;
    
    if (searchTanda !== 'Todas') {
      const hasPurchaseInTanda = (purchases || []).some(pu => pu.product_id === p.id && pu.batch === searchTanda);
      return matchesText && matchesCat && hasPurchaseInTanda;
    }
    
    return matchesText && matchesCat;
  });

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseForm.product_id) return alert('Selecciona un producto');
    if (!purchaseForm.batch) return alert('Selecciona una tanda');
    
    try {
      const { error: pErr } = await supabase.from('purchases').insert([purchaseForm]);
      if (pErr) throw pErr;

      const costKey = purchaseForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen';
      const prod = products.find(p => p.id === purchaseForm.product_id);
      const newStock = (prod?.stock || 0) + purchaseForm.quantity;

      const { error: uErr } = await supabase.from('products').update({
        stock: newStock,
        [costKey]: purchaseForm[costKey]
      }).eq('id', purchaseForm.product_id);
      
      if (uErr) throw uErr;

      await refreshData(true);
      setPurchaseForm({ product_id: '', quantity: 1, cost_clp: 0, cost_pen: 0, currency: 'CLP', batch: existingTandaNames[0] || '', date: new Date().toISOString() });
      closeModal('purchase');
    } catch (e) {
      alert(`Error en abastecimiento: ${e.message}`);
    }
  };

  const [saleForm, setSaleForm] = React.useState({
    product_id: '',
    quantity: 1,
    sale_price_pen: 0,
    batch: ''
  });

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleForm.product_id) return alert('Selecciona un producto');
    if (!saleForm.batch) return alert('Selecciona una tanda (Usa el buscador para elegir)');
    
    try {
      const prod = products.find(p => p.id === saleForm.product_id);
      if (!prod || prod.stock < saleForm.quantity) throw new Error('Stock insuficiente');

      const rate = parseFloat(settings.exchange_rate) || 0.0039;
      const total_sale_pen = saleForm.quantity * saleForm.sale_price_pen;
      const cost_pen_at_time = prod.currency === 'PEN' ? prod.cost_pen : (prod.cost_clp * rate);
      const profit_pen = total_sale_pen - (saleForm.quantity * cost_pen_at_time);

      const { error: sErr } = await supabase.from('sales').insert([{
        ...saleForm,
        total_sale_pen,
        profit_pen,
        date: new Date().toISOString()
      }]);
      if (sErr) throw sErr;

      const { error: uErr } = await supabase.from('products').update({
        stock: prod.stock - saleForm.quantity
      }).eq('id', prod.id);
      if (uErr) throw uErr;

      await refreshData(true);
      setSaleForm({ product_id: '', quantity: 1, sale_price_pen: 0, batch: '' });
      closeModal('sale');
    } catch (e) {
      alert(`Error en venta: ${e.message}`);
    }
  };

  const selectedSaleProduct = (products || []).find(p => p.id === saleForm.product_id);
  const costAtTime = selectedSaleProduct ? (selectedSaleProduct.currency === 'PEN' ? selectedSaleProduct.cost_pen : selectedSaleProduct.cost_clp * (parseFloat(settings.exchange_rate) || 0.0039)) : 0;
  const estimatedProfit = (saleForm.sale_price_pen - costAtTime) * saleForm.quantity;

  const selectedPurchaseProduct = (products || []).find(p => p.id === purchaseForm.product_id);

  const [editPurchaseForm, setEditPurchaseForm] = React.useState(null);

  React.useEffect(() => {
    if (modals.editPurchase && modalData) {
      setEditPurchaseForm({
        quantity: modalData.quantity,
        cost_clp: modalData.cost_clp,
        cost_pen: modalData.cost_pen,
        currency: modalData.currency,
        batch: modalData.batch || (existingTandaNames[0] || ''),
        date: modalData.date ? modalData.date.split('T')[0] : ''
      });
    }
  }, [modals.editPurchase, modalData, existingTandaNames]);

  const handleEditPurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      const original = modalData;
      const { error: pErr } = await supabase.from('purchases').update(editPurchaseForm).eq('id', original.id);
      if (pErr) throw pErr;

      const prod = (products || []).find(p => p.id === original.product_id);
      if (prod) {
        const diff = editPurchaseForm.quantity - original.quantity;
        const newStock = (prod.stock || 0) + diff;
        const updateData = { stock: newStock };
        if (editPurchaseForm.currency === 'CLP') updateData.cost_clp = editPurchaseForm.cost_clp;
        else updateData.cost_pen = editPurchaseForm.cost_pen;

        await supabase.from('products').update(updateData).eq('id', prod.id);
      }

      await refreshData(true);
      closeModal('editPurchase');
    } catch (e) {
      alert(`Error al editar abastecimiento: ${e.message}`);
    }
  };

  const [editSaleForm, setEditSaleForm] = React.useState(null);

  React.useEffect(() => {
    if (modals.editSale && modalData) {
      setEditSaleForm({
        quantity: modalData.quantity,
        sale_price_pen: modalData.sale_price_pen,
        batch: modalData.batch || (existingTandaNames[0] || '')
      });
    }
  }, [modals.editSale, modalData, existingTandaNames]);

  const handleEditSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      const original = modalData;
      const prod = (products || []).find(p => p.id === original.product_id);
      if (!prod) throw new Error("Producto no encontrado");

      const rate = parseFloat(settings.exchange_rate) || 0.0039;
      const total_sale_pen = editSaleForm.quantity * editSaleForm.sale_price_pen;
      const cost_pen_at_time = prod.currency === 'PEN' ? prod.cost_pen : (prod.cost_clp * rate);
      const profit_pen = total_sale_pen - (editSaleForm.quantity * cost_pen_at_time);
      
      const { error: sErr } = await supabase.from('sales').update({
        ...editSaleForm,
        total_sale_pen,
        profit_pen
      }).eq('id', original.id);
      if (sErr) throw sErr;

      const diff = original.quantity - editSaleForm.quantity;
      const newStock = (prod.stock || 0) + diff;
      await supabase.from('products').update({ stock: newStock }).eq('id', prod.id);

      await refreshData(true);
      closeModal('editSale');
    } catch (e) {
      alert(`Error al editar venta: ${e.message}`);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('products').insert([productForm]);
      
      await refreshData(true);
      closeModal('product');
      setProductForm({ name: '', category: categories?.[0]?.name || '', brand: '', cost_clp: 0, cost_pen: 0, suggested_price: 0, currency: 'CLP', stock: 0 });
    } catch (e) {
      alert(`Error al registrar producto: ${e.message}`);
    }
  };

  return (
    <>
      <Modal 
        isOpen={modals.product} 
        onClose={() => closeModal('product')} 
        title="Registrar Nuevo Producto"
        icon={Plus}
      >
        <form onSubmit={handleProductSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre Comercial</label>
              <input 
                required 
                className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-sm font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none uppercase shadow-inner transition-all" 
                placeholder="Nombre del producto..." 
                value={productForm.name} 
                onChange={e=>setProductForm({...productForm, name: e.target.value})} 
              />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Categoría</label>
                  <CustomSelect 
                    value={productForm.category} 
                    onChange={val => setProductForm({...productForm, category: val})}
                    options={(categories || []).map(c => c.name)}
                    className="h-14"
                  />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Marca</label>
                 <input 
                   className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-[11px] font-black rounded-2xl border-2 border-transparent outline-none uppercase shadow-inner" 
                   placeholder="Marca" 
                   value={productForm.brand} 
                   onChange={e=>setProductForm({...productForm, brand: e.target.value})} 
                 />
              </div>
           </div>

           <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Costo Unitario</label>
                  <CustomSelect 
                    value={productForm.currency} 
                    onChange={val => setProductForm({...productForm, currency: val})}
                    options={['CLP', 'PEN']}
                    className="w-24 h-11"
                  />
              </div>

              <div className="relative group">
                 <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within:text-indigo-500 transition-colors uppercase">{productForm.currency}</span>
                 <input 
                   type="number" 
                   step="0.01"
                   required 
                   className="w-full h-16 bg-white dark:bg-slate-950 px-20 text-2xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none transition-all text-indigo-600 tabular-nums shadow-sm" 
                   value={productForm.currency === 'CLP' ? (productForm.cost_clp || '') : (productForm.cost_pen || '')} 
                   onChange={e => setProductForm({
                     ...productForm, 
                     [productForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value)
                   })} 
                 />
              </div>
           </div>

           <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Precio de Venta Sugerido (S/)</label>
               <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within:text-emerald-500 transition-colors uppercase font-mono">PEN</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 pl-16 pr-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none tabular-nums shadow-inner transition-all"
                    value={productForm.suggested_price || ''}
                    onChange={e => setProductForm({...productForm, suggested_price: parseFloat(e.target.value)})}
                  />
               </div>
            </div>

             <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight italic">
                   * Este registro es referencial. El stock físico se registra mediante Compras.
                </p>
             </div>

           <button 
             type="submit" 
             className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
           >
             Registrar Producto
           </button>
        </form>
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

                       <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
                          <div className="flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
                             <span className="text-[8px] font-black uppercase text-slate-400 self-center mr-1">Cat:</span>
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
                       </div>

                       <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar text-left">
                          {(filteredProducts || [])
                            .filter(p => (p.stock || 0) > 0)
                            .map(p => {
                               const productTandas = [...new Set((purchases || []).filter(pu => pu.product_id === p.id).map(pu => pu.batch))].filter(Boolean);
                               return (
                                  <div key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                                     <div className="px-4 py-2 bg-slate-50/30 dark:bg-slate-900/30">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{p.name}</p>
                                     </div>
                                     <div className="p-1 space-y-1">
                                        {productTandas.length > 0 ? productTandas.map(tandaName => (
                                           <button
                                              key={`${p.id}-${tandaName}`}
                                              type="button"
                                              onClick={() => {
                                                 setSaleForm({ 
                                                    ...saleForm, 
                                                    product_id: p.id,
                                                    sale_price_pen: p.suggested_price || 0,
                                                    batch: tandaName
                                                 });
                                                 setIsSelectOpen(false);
                                                 setSearchProduct('');
                                                 setSearchCategory('Todas');
                                                 setSearchTanda('Todas');
                                              }}
                                              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-white dark:hover:bg-slate-800 group"
                                           >
                                              <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    <BookOpen size={14} />
                                                 </div>
                                                 <div>
                                                    <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">{tandaName}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Seleccionar esta tanda</p>
                                                 </div>
                                              </div>
                                              <div className="text-right">
                                                 <p className="text-[11px] font-black text-emerald-600">S/ {p.suggested_price}</p>
                                                 <p className="text-[8px] font-black text-slate-400 uppercase">Stock total: {p.stock} U.</p>
                                              </div>
                                           </button>
                                        )) : (
                                           <p className="px-4 py-2 text-[9px] font-bold text-rose-500 italic">Sin tandas vinculadas</p>
                                        )}
                                     </div>
                                  </div>
                               );
                            })}
                       </div>
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Unidades Vendidas</label>
                 <div className="relative group">
                    <Hash size={16} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:text-emerald-600 transition-all" />
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
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within:text-emerald-600 transition-colors uppercase font-mono">PEN</span>
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

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanda Vinculada (Automática)</label>
              <div className="w-full h-14 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border-2 border-indigo-500/20 flex items-center px-8 gap-4 overflow-hidden relative group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                    <BookOpen size={40} />
                 </div>
                 <BookOpen size={16} className="text-indigo-500" />
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 tracking-widest">
                       {saleForm.batch || 'NINGUNA SELECCIONADA'}
                    </span>
                    <span className="text-[8px] font-black text-indigo-500 uppercase">Seleccionada desde el buscador</span>
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
              <div className="flex justify-between items-center opacity-40">
                 <p className="text-[8px] font-bold uppercase tracking-tight">Total Transacción</p>
                 <p className="text-[10px] font-black tabular-nums font-mono">S/ {(saleForm.sale_price_pen * saleForm.quantity).toFixed(2)}</p>
              </div>
           </div>

           <button 
             type="submit" 
             disabled={!selectedSaleProduct || selectedSaleProduct.stock < saleForm.quantity || !saleForm.batch}
             className="w-full h-16 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
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
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Seleccionar Producto</label>
              <div className="relative">
                 <button
                    type="button"
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 px-8 text-sm font-black rounded-2xl flex items-center justify-between transition-all"
                 >
                    <span className={selectedPurchaseProduct ? 'text-indigo-600' : 'text-slate-400'}>
                       {selectedPurchaseProduct ? `${selectedPurchaseProduct.name} - ${selectedPurchaseProduct.brand}` : 'Buscar...'}
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
                       <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {(filteredProducts || []).map(p => (
                             <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                   setPurchaseForm({ ...purchaseForm, product_id: p.id, currency: p.currency, cost_clp: p.cost_clp, cost_pen: p.cost_pen });
                                   setIsSelectOpen(false);
                                   setSearchProduct('');
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                             >
                                <div>
                                   <p className="text-[11px] font-black uppercase">{p.name}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase">{p.brand} · {p.category}</p>
                                </div>
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cant.</label>
                 <input 
                   type="number" 
                   required 
                   className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl border-2 border-transparent outline-none shadow-inner" 
                   value={purchaseForm.quantity} 
                   onChange={e => setPurchaseForm({...purchaseForm, quantity: parseInt(e.target.value)})} 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanda de lote</label>
                  <CustomSelect 
                    value={purchaseForm.batch} 
                    onChange={val => setPurchaseForm({...purchaseForm, batch: val})}
                    options={existingTandaNames}
                    className="h-14 !rounded-2xl"
                  />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha de Ingreso</label>
              <input 
                type="date" 
                required 
                className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-[11px] font-black rounded-2xl border-2 border-transparent outline-none uppercase shadow-inner" 
                value={purchaseForm.date} 
                onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} 
              />
           </div>

           <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 space-y-4">
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

      <Modal 
        isOpen={modals.editPurchase} 
        onClose={() => closeModal('editPurchase')} 
        title="Editar Registro de Compra"
        icon={TrendingUp}
      >
        {editPurchaseForm && modalData && (
          <form onSubmit={handleEditPurchaseSubmit} className="space-y-6">
             <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Producto seleccionado</p>
                <p className="text-sm font-black uppercase mt-1">{modalData.product_name}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Unidades</label>
                   <input 
                     type="number" 
                     required 
                     className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl border-2 border-transparent outline-none shadow-inner" 
                     value={editPurchaseForm.quantity} 
                     onChange={e => setEditPurchaseForm({...editPurchaseForm, quantity: parseInt(e.target.value)})} 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanda de lote</label>
                    <CustomSelect 
                      value={editPurchaseForm.batch} 
                      onChange={val => setEditPurchaseForm({...editPurchaseForm, batch: val})}
                      options={existingTandaNames}
                      className="h-14 !rounded-2xl"
                    />
                 </div>
             </div>

             <button 
               type="submit" 
               className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
             >
               Guardar Cambios
             </button>
          </form>
        )}
      </Modal>

      <Modal 
        isOpen={modals.saleDetail} 
        onClose={() => closeModal('saleDetail')} 
        title="Detalle de Transacción"
        icon={ShoppingCart}
      >
        {modals.saleDetail && modalData && (
          <div className="space-y-8 py-4">
             <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-600">
                   <Check size={40} />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight">{modalData.product_name}</h3>
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/5 px-3 py-1 rounded-lg inline-block mt-2">
                     {modalData.product_category}
                   </p>
                </div>
             </div>
             <div className="p-8 bg-emerald-600 text-white rounded-[2.5rem] shadow-2xl">
                <p className="text-[10px] font-black uppercase opacity-70">Utilidad Neta</p>
                <p className="text-4xl font-black tabular-nums mt-2">S/ {modalData.profit_pen.toFixed(2)}</p>
             </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={modals.editSale} 
        onClose={() => closeModal('editSale')} 
        title="Editar Registro de Venta"
        icon={ShoppingCart}
      >
        {editSaleForm && modalData && (
          <form onSubmit={handleEditSaleSubmit} className="space-y-6">
             <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Producto en transacción</p>
                <p className="text-sm font-black uppercase mt-1">{modalData.product_name}</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cant.</label>
                   <input type="number" required className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl outline-none" value={editSaleForm.quantity} onChange={e=>setEditSaleForm({...editSaleForm, quantity: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Precio (S/)</label>
                   <input type="number" step="0.01" required className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl outline-none" value={editSaleForm.sale_price_pen} onChange={e=>setEditSaleForm({...editSaleForm, sale_price_pen: parseFloat(e.target.value)})} />
                </div>
             </div>
             <div className="p-4 bg-emerald-100/10 rounded-2xl space-y-2 border-2 border-dashed border-emerald-500/20">
                <p className="text-[9px] font-black uppercase text-emerald-600">Lote Asignado:</p>
                <p className="text-[11px] font-black uppercase">{editSaleForm.batch}</p>
             </div>
             <button type="submit" className="w-full h-16 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase shadow-2xl">Guardar Cambios</button>
          </form>
        )}
      </Modal>
    </>
  );
};

export default GlobalModals;
