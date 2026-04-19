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
    if (!saleForm.batch) return alert('Selecciona una tanda');
    
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
      {/* REST of the modals ... */}
      <Modal isOpen={modals.product} onClose={() => closeModal('product')} title="Nuevo Producto" icon={Plus}>
         {/* ...Product form content preserved... */}
         <form onSubmit={handleProductSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre Comercial</label>
              <input required className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-sm font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none uppercase shadow-inner" placeholder="Nombre..." value={productForm.name} onChange={e=>setProductForm({...productForm, name: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Categoría</label>
                 <CustomSelect value={productForm.category} onChange={val => setProductForm({...productForm, category: val})} options={(categories || []).map(c => c.name)} className="h-14" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Marca</label>
                 <input className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-[11px] font-black rounded-2xl border-2 border-transparent outline-none uppercase shadow-inner" placeholder="Marca" value={productForm.brand} onChange={e=>setProductForm({...productForm, brand: e.target.value})} />
              </div>
           </div>
           <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Costo Unitario</label>
                 <CustomSelect value={productForm.currency} onChange={val => setProductForm({...productForm, currency: val})} options={['CLP', 'PEN']} className="w-24 h-11" />
              </div>
              <div className="relative group">
                 <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within:text-indigo-500 transition-colors uppercase">{productForm.currency}</span>
                 <input type="number" step="0.01" required className="w-full h-16 bg-white dark:bg-slate-950 px-20 text-2xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none transition-all text-indigo-600 tabular-nums shadow-sm" value={productForm.currency === 'CLP' ? (productForm.cost_clp || '') : (productForm.cost_pen || '')} onChange={e => setProductForm({...productForm, [productForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value)})} />
              </div>
           </div>
           <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Venta Sugerido (S/)</label>
               <input type="number" step="0.01" required className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl border-2 border-transparent outline-none tabular-nums" value={productForm.suggested_price || ''} onChange={e => setProductForm({...productForm, suggested_price: parseFloat(e.target.value)})} />
           </div>
           <button type="submit" className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Registrar</button>
        </form>
      </Modal>

      <Modal isOpen={modals.sale} onClose={() => closeModal('sale')} title="Registrar Venta" icon={ShoppingCart}>
         <form onSubmit={handleSaleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Producto</label>
              <div className="relative">
                 <button type="button" onClick={() => setIsSelectOpen(!isSelectOpen)} className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-emerald-500/20 px-8 text-sm font-black rounded-2xl flex items-center justify-between transition-all">
                    <span className={selectedSaleProduct ? 'text-emerald-600' : 'text-slate-400'}>{selectedSaleProduct ? `${selectedSaleProduct.name} - ${selectedSaleProduct.brand}` : 'Seleccionar...'}</span>
                    <Search size={18} className="opacity-20" />
                 </button>
                 {isSelectOpen && (
                    <div className="absolute z-[1200] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                       <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                          <input autoFocus className="w-full h-10 bg-slate-50 dark:bg-slate-950 px-4 rounded-xl text-[11px] font-bold outline-none border border-transparent focus:border-emerald-500/30 uppercase" placeholder="Buscar..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
                       </div>
                       <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar text-left">
                          {filteredProducts.filter(p => (p.stock || 0) > 0).map(p => {
                            const pTandas = [...new Set((purchases || []).filter(pu => pu.product_id === p.id).map(pu => pu.batch))].filter(Boolean);
                            return (
                               <div key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 p-1 space-y-1">
                                  <div className="px-3 py-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg"><p className="text-[9px] font-black uppercase text-slate-400">{p.name}</p></div>
                                  {pTandas.map(t => (
                                    <button key={`${p.id}-${t}`} type="button" onClick={() => { setSaleForm({...saleForm, product_id: p.id, sale_price_pen: p.suggested_price || 0, batch: t}); setIsSelectOpen(false); }} className="w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 group text-left">
                                       <div className="flex items-center gap-2"><BookOpen size={12} className="text-indigo-500" /><p className="text-[10px] font-black uppercase">{t}</p></div>
                                       <p className="text-[10px] font-black text-emerald-600">S/ {p.suggested_price}</p>
                                    </button>
                                  ))}
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
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cant.</label>
                 <input type="number" required min="1" max={selectedSaleProduct?.stock || 999} className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none tabular-nums" value={saleForm.quantity} onChange={e => setSaleForm({...saleForm, quantity: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Precio (S/)</label>
                 <input type="number" step="0.01" required className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none tabular-nums" value={saleForm.sale_price_pen} onChange={e => setSaleForm({...saleForm, sale_price_pen: parseFloat(e.target.value)})} />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanda (Auto)</label>
              <div className="w-full h-14 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border-2 border-indigo-500/20 flex items-center px-8 gap-4 overflow-hidden"><BookOpen size={16} className="text-indigo-500" /><span className="text-[11px] font-black uppercase">{saleForm.batch || 'NINGUNA'}</span></div>
           </div>
           <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[2rem] border border-emerald-500/10 flex justify-between items-center text-emerald-600">
              <p className="text-[9px] font-black uppercase tracking-widest">Utilidad Estimada</p>
              <span className="text-xl font-black tabular-nums font-mono">S/ {estimatedProfit.toFixed(2)}</span>
           </div>
           <button type="submit" disabled={!selectedSaleProduct || !saleForm.batch} className="w-full h-16 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">Confirmar</button>
        </form>
      </Modal>

      <Modal isOpen={modals.purchase} onClose={() => closeModal('purchase')} title="Registrar Abastecimiento" icon={TrendingUp}>
        <form onSubmit={handlePurchaseSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Seleccionar Producto</label>
              <div className="relative">
                 <button type="button" onClick={() => setIsSelectOpen(!isSelectOpen)} className="w-full h-14 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 px-8 text-sm font-black rounded-2xl flex items-center justify-between transition-all">
                    <span className={selectedPurchaseProduct ? 'text-indigo-600' : 'text-slate-400'}>{selectedPurchaseProduct ? `${selectedPurchaseProduct.name} - ${selectedPurchaseProduct.brand}` : 'Buscar...'}</span>
                    <Search size={18} className="opacity-20" />
                 </button>
                 {isSelectOpen && (
                    <div className="absolute z-[1200] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                       <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {filteredProducts.map(p => (
                             <button key={p.id} type="button" onClick={() => { setPurchaseForm({ ...purchaseForm, product_id: p.id, currency: p.currency, cost_clp: p.cost_clp, cost_pen: p.cost_pen }); setIsSelectOpen(false); }} className="w-full px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left uppercase text-[11px] font-black">{p.name} · {p.brand}</button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cant.</label>
                 <input type="number" required min="1" className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl border-2 border-transparent outline-none shadow-inner" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanda de lote</label>
                 <CustomSelect value={purchaseForm.batch} onChange={val => setPurchaseForm({...purchaseForm, batch: val})} options={existingTandaNames} className="h-14 !rounded-2xl" />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha de Ingreso</label>
              <input type="date" required className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-[11px] font-black rounded-2xl border-2 border-transparent outline-none uppercase shadow-inner" value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} />
           </div>

           {/* RESTORED COST BLOCK */}
           <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Costo Unitario de Compra</label>
                  <CustomSelect 
                    value={purchaseForm.currency} 
                    onChange={val => setPurchaseForm({...purchaseForm, currency: val})}
                    options={['CLP', 'PEN']}
                    className="w-24 h-11"
                  />
              </div>
              <div className="relative group">
                 <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within:text-indigo-500 transition-colors uppercase">{purchaseForm.currency}</span>
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

           <button type="submit" className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Confirmar Abastecimiento</button>
        </form>
      </Modal>

      <Modal isOpen={modals.editPurchase} onClose={() => closeModal('editPurchase')} title="Editar Compra" icon={TrendingUp}>
        {editPurchaseForm && modalData && (
          <form onSubmit={handleEditPurchaseSubmit} className="space-y-6">
             <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Producto seleccionado</p>
                <p className="text-sm font-black uppercase mt-1">{modalData.product_name}</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cant.</label>
                   <input type="number" required min="1" className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-xl font-black rounded-2xl outline-none" value={editPurchaseForm.quantity} onChange={e => setEditPurchaseForm({...editPurchaseForm, quantity: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanda de lote</label>
                   <CustomSelect value={editPurchaseForm.batch} onChange={val => setEditPurchaseForm({...editPurchaseForm, batch: val})} options={existingTandaNames} className="h-14 !rounded-2xl" />
                 </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha</label>
                <input type="date" required className="w-full h-14 bg-slate-50 dark:bg-slate-900 px-8 text-[11px] font-black rounded-2xl outline-none uppercase shadow-inner" value={editPurchaseForm.date} onChange={e => setEditPurchaseForm({...editPurchaseForm, date: e.target.value})} />
             </div>

             {/* RESTORED COST BLOCK IN EDIT */}
             <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Costo Unitario</label>
                    <CustomSelect value={editPurchaseForm.currency} onChange={val => setEditPurchaseForm({...editPurchaseForm, currency: val})} options={['CLP', 'PEN']} className="w-24 h-11" />
                </div>
                <div className="relative group">
                   <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within:text-indigo-500 transition-colors uppercase">{editPurchaseForm.currency}</span>
                   <input type="number" step="0.01" required className="w-full h-16 bg-white dark:bg-slate-950 px-20 text-2xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none transition-all text-indigo-600 tabular-nums shadow-sm" value={editPurchaseForm.currency === 'CLP' ? (editPurchaseForm.cost_clp || '') : (editPurchaseForm.cost_pen || '')} onChange={e => setEditPurchaseForm({ ...editPurchaseForm, [editPurchaseForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value) })} />
                </div>
             </div>

             <button type="submit" className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Guardar</button>
          </form>
        )}
      </Modal>
    </>
  );
};

export default GlobalModals;
