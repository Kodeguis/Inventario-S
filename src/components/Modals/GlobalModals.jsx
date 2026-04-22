import React from 'react';
import { useModals } from '../../context/ModalContext';
import { useInventory } from '../../context/InventoryContext';
import Modal from '../Common/Modal';
import { 
    ShoppingCart, 
    TrendingUp, 
    Plus, 
    Search, 
    BookOpen, 
    Package, 
    Calendar as CalendarIcon, 
    Tag, 
    ChevronRight,
    ArrowDownLeft,
    DollarSign,
    Layers,
    Info,
    Sparkles,
    Globe,
    History
} from 'lucide-react';
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
    const [searchBatch, setSearchBatch] = React.useState('Todas');
    const [isSelectOpen, setIsSelectOpen] = React.useState(false);

    // Reset batch filter if it's no longer valid for the selected category
    React.useEffect(() => {
        const validBatches = ['Todas', ...Array.from(new Set((batches || []).filter(b => searchCategory === 'Todas' || b.category === searchCategory).map(b => b.name)))];
        if (!validBatches.includes(searchBatch)) {
            setSearchBatch('Todas');
        }
    }, [searchCategory, batches, searchBatch]);

    const getFilteredTandasByProduct = (productId) => {
        if (!productId) return [];
        const product = products.find(p => p.id === productId);
        if (!product) return [];
        return (batches || [])
            .filter(b => !b.category || b.category === product.category)
            .map(b => b.name);
    };

    const currentPurchaseTandas = getFilteredTandasByProduct(purchaseForm.product_id);

    React.useEffect(() => {
        if (currentPurchaseTandas.length > 0) {
            if (!purchaseForm.batch || !currentPurchaseTandas.includes(purchaseForm.batch)) {
                setPurchaseForm(prev => ({ ...prev, batch: currentPurchaseTandas[0] }));
            }
        } else if (purchaseForm.product_id) {
            setPurchaseForm(prev => ({ ...prev, batch: '' }));
        }
    }, [purchaseForm.product_id, batches]);

    const filteredProducts = (products || []).filter(p => {
        const matchesText = (p.name || '').toLowerCase().includes(searchProduct.toLowerCase()) || 
                           (p.brand || '').toLowerCase().includes(searchProduct.toLowerCase());
        return matchesText;
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
            setPurchaseForm({ product_id: '', quantity: 1, cost_clp: 0, cost_pen: 0, currency: 'CLP', batch: '', date: new Date().toISOString() });
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

            const rate = parseFloat(settings?.exchange_rate) || 0.0039;
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
    const selectedPurchaseProduct = (products || []).find(p => p.id === purchaseForm.product_id);
    const costAtTime = selectedSaleProduct ? (selectedSaleProduct.currency === 'PEN' ? selectedSaleProduct.cost_pen : selectedSaleProduct.cost_clp * (parseFloat(settings?.exchange_rate) || 0.0039)) : 0;
    const estimatedProfit = (saleForm.sale_price_pen - costAtTime) * saleForm.quantity;

    const [editPurchaseForm, setEditPurchaseForm] = React.useState(null);
    React.useEffect(() => {
        if (modals.editPurchase && modalData) {
            setEditPurchaseForm({
                quantity: modalData.quantity,
                batch: modalData.batch || '',
                cost_clp: modalData.cost_clp || 0,
                cost_pen: modalData.cost_pen || 0,
                currency: modalData.currency || 'CLP'
            });
        }
    }, [modals.editPurchase, modalData]);

    const handleEditPurchaseSubmit = async (e) => {
        e.preventDefault();
        try {
            const original = modalData;
            const prod = (products || []).find(p => p.id === original.product_id);
            if (!prod) throw new Error("Producto no encontrado");

            const { error: pErr } = await supabase.from('purchases').update(editPurchaseForm).eq('id', original.id);
            if (pErr) throw pErr;

            const diff = editPurchaseForm.quantity - original.quantity;
            const newStock = (prod.stock || 0) + diff;
            
            const costKey = editPurchaseForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen';
            await supabase.from('products').update({ 
                stock: Math.max(0, newStock),
                [costKey]: editPurchaseForm[costKey]
            }).eq('id', prod.id);

            await refreshData(true);
            closeModal('editPurchase');
        } catch (e) {
            alert("Error editando abastecimiento: " + e.message);
        }
    };

    const [editSaleForm, setEditSaleForm] = React.useState(null);
    React.useEffect(() => {
        if (modals.editSale && modalData) {
            setEditSaleForm({
                quantity: modalData.quantity,
                sale_price_pen: modalData.sale_price_pen,
                batch: modalData.batch || ''
            });
        }
    }, [modals.editSale, modalData]);

    const handleEditSaleSubmit = async (e) => {
        e.preventDefault();
        try {
            const original = modalData;
            const prod = (products || []).find(p => p.id === original.product_id);
            if (!prod) throw new Error("Producto no encontrado");

            const rate = parseFloat(settings?.exchange_rate) || 0.0039;
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

    const currentEditSaleTandas = modalData ? [...new Set((purchases || []).filter(pu => pu.product_id === modalData.product_id).map(pu => pu.batch))].filter(Boolean) : [];

    const [productForm, setProductForm] = React.useState({
        name: '',
        brand: '',
        category: '',
        cost_clp: 0,
        cost_pen: 0,
        suggested_price: 0,
        currency: 'CLP',
        min_stock: 5
    });

    React.useEffect(() => {
        if ((modals.editProduct || modals.product) && modalData) {
            setProductForm({
                name: modalData.name || '',
                brand: modalData.brand || '',
                category: modalData.category || (categories[0]?.name || ''),
                cost_clp: modalData.cost_clp || 0,
                cost_pen: modalData.cost_pen || 0,
                suggested_price: modalData.suggested_price || 0,
                currency: modalData.currency || 'CLP',
                min_stock: modalData.min_stock || 5
            });
        } else if (modals.product) {
            setProductForm({
                name: '',
                brand: '',
                category: categories[0]?.name || '',
                cost_clp: 0,
                cost_pen: 0,
                suggested_price: 0,
                currency: 'CLP',
                min_stock: 5
            });
        }
    }, [modals.editProduct, modals.product, modalData, categories]);

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modals.editProduct) {
                const { error } = await supabase.from('products').update(productForm).eq('id', modalData.id);
                if (error) throw error;
                closeModal('editProduct');
            } else {
                const { error } = await supabase.from('products').insert([productForm]);
                if (error) throw error;
                closeModal('product');
            }
            await refreshData(true);
        } catch (err) {
            alert("Error técnico: " + err.message);
        }
    };

    return (
        <>
            <Modal isOpen={modals.sale} onClose={() => { closeModal('sale'); setIsSelectOpen(false); }} title="REGISTRO DE GESTIÓN DE VENTA" icon={ShoppingCart}>
                <form onSubmit={handleSaleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Seleccionar Referencia de Articulo</label>
                        <div className="relative">
                            <button 
                                type="button" 
                                onClick={() => setIsSelectOpen(!isSelectOpen)} 
                                className={`w-full h-12 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 px-6 text-sm font-black rounded-md flex items-center justify-between transition-all ${isSelectOpen ? 'border-blue-600/50 shadow-lg shadow-blue-600/5' : ''}`}
                            >
                                <span className={`${selectedSaleProduct ? 'text-blue-600' : 'text-slate-400 dark:text-zinc-700 uppercase'}`}>
                                    {selectedSaleProduct ? `${selectedSaleProduct.name} · ${selectedSaleProduct.brand}` : 'Buscar producto para despacho...'}
                                </span>
                                <Search size={16} className="text-slate-500" />
                            </button>
                            {isSelectOpen && (
                                <div className="absolute z-[1200] w-full mt-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black space-y-4">
                                        <input 
                                            autoFocus 
                                            className="w-full h-10 bg-white dark:bg-zinc-900 px-4 rounded-md text-[11px] font-black outline-none border border-slate-200 dark:border-white/10 focus:border-blue-600/50 uppercase placeholder:text-zinc-700" 
                                            placeholder="FILTRAR LISTADO..." 
                                            value={searchProduct} 
                                            onChange={e => setSearchProduct(e.target.value)} 
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar pb-1">
                                                {['Todas', ...(categories || []).map(c => c.name)].map(c => (
                                                    <button 
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setSearchCategory(c)}
                                                        className={`px-4 h-7 rounded-md text-[9px] font-black uppercase transition-all whitespace-nowrap border ${searchCategory === c ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 border-slate-200 dark:border-white/5 hover:text-white'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="w-32 flex flex-col gap-1">
                                                <CustomSelect 
                                                    value={searchBatch} 
                                                    onChange={setSearchBatch} 
                                                    options={searchCategory === 'Todas' ? [] : ['Todas', ...Array.from(new Set((batches || []).filter(b => b.category === searchCategory).map(b => b.name)))]} 
                                                    className={`h-7 !px-2 ${searchCategory === 'Todas' ? 'opacity-30 pointer-events-none' : ''}`}
                                                    placeholder="TANDA"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar text-left">
                                        {filteredProducts
                                            .filter(p => searchCategory === 'Todas' || p.category === searchCategory)
                                            .filter(p => (p.stock || 0) > 0)
                                            .filter(p => {
                                                if (searchBatch === 'Todas') return true;
                                                const pTandas = [...new Set((purchases || []).filter(pu => pu.product_id === p.id).map(pu => pu.batch))];
                                                return pTandas.includes(searchBatch);
                                            }).length === 0 ? (
                                            <div className="py-12 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic opacity-50">Sin stock disponible con estos filtros</div>
                                        ) : (
                                            filteredProducts
                                                .filter(p => searchCategory === 'Todas' || p.category === searchCategory)
                                                .filter(p => (p.stock || 0) > 0)
                                                .filter(p => {
                                                    if (searchBatch === 'Todas') return true;
                                                    const pTandas = [...new Set((purchases || []).filter(pu => pu.product_id === p.id).map(pu => pu.batch))];
                                                    return pTandas.includes(searchBatch);
                                                }).map(p => {
                                                const pTandas = [...new Set((purchases || []).filter(pu => pu.product_id === p.id).map(pu => pu.batch))].filter(Boolean);
                                                const isFilteredBatch = searchBatch !== 'Todas';
                                                
                                                return (
                                                    <div key={p.id} className={`border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/30 rounded-md p-1.5 transition-all ${isFilteredBatch ? 'hover:border-blue-600/50 cursor-pointer' : 'space-y-1.5'}`}
                                                         onClick={isFilteredBatch ? () => { setSaleForm({...saleForm, product_id: p.id, sale_price_pen: p.suggested_price || 0, batch: searchBatch}); setIsSelectOpen(false); } : undefined}>
                                                        <div className="px-2 py-0.5 flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{p.name}</p>
                                                                {isFilteredBatch && <p className="text-[8px] font-bold text-blue-600/60 uppercase">Selección automática: {searchBatch}</p>}
                                                            </div>
                                                            <span className="text-[10px] font-black text-blue-600 tabular-nums">STOCK: {p.stock}</span>
                                                        </div>
                                                        
                                                        {!isFilteredBatch && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {pTandas.length > 0 ? pTandas.map(t => (
                                                                    <button 
                                                                        key={`${p.id}-${t}`} 
                                                                        type="button" 
                                                                        onClick={(e) => { e.stopPropagation(); setSaleForm({...saleForm, product_id: p.id, sale_price_pen: p.suggested_price || 0, batch: t}); setIsSelectOpen(false); }} 
                                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-blue-600/10 border border-slate-200 dark:border-white/10 hover:border-blue-600/50 rounded-md transition-all group"
                                                                    >
                                                                        <BookOpen size={10} className="text-blue-600 opacity-60" />
                                                                        <span className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400 group-hover:text-blue-600">{t}</span>
                                                                    </button>
                                                                )) : (
                                                                    <button 
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); setSaleForm({...saleForm, product_id: p.id, sale_price_pen: p.suggested_price || 0, batch: 'Directo'}); setIsSelectOpen(false); }}
                                                                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-md text-[9px] font-black text-zinc-500 uppercase hover:border-blue-600/50"
                                                                    >
                                                                        Venta Directa Sin Tanda
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 px-1 h-6 flex items-center">Unidades a despachar</label>
                            <input 
                                type="number" 
                                required 
                                min="1" 
                                max={selectedSaleProduct?.stock || 999} 
                                className="w-full h-12 bg-white dark:bg-zinc-950 px-6 text-lg font-black rounded-md border border-slate-200 dark:border-white/10 outline-none tabular-nums focus:border-blue-600/50 transition-all shadow-inner" 
                                value={saleForm.quantity} 
                                onChange={e => setSaleForm({...saleForm, quantity: parseInt(e.target.value)})} 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 px-1 h-6 flex items-center">Precio Unitario de Venta</label>
                            <div className="relative group/field">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">PEN</span>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    className="w-full h-12 bg-white dark:bg-zinc-950 px-14 text-lg font-black rounded-md border border-slate-200 dark:border-white/10 outline-none tabular-nums focus:border-emerald-500/50 transition-all text-emerald-500 shadow-inner" 
                                    value={saleForm.sale_price_pen} 
                                    onChange={e => setSaleForm({...saleForm, sale_price_pen: parseFloat(e.target.value)})} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 px-1">Tanda Identificada para Despacho</label>
                        <div className="w-full h-12 bg-slate-100/50 dark:bg-zinc-900/30 rounded-md border border-slate-200 dark:border-white/10 flex items-center px-6 gap-3">
                            <Sparkles size={16} className="text-blue-600 opacity-60" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                {saleForm.batch || 'ESPERANDO SELECCIÓN DE PRODUCTO'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner flex items-center justify-between px-8">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.15em] leading-none">Utilidad Maestra Proyectada</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest mt-1.5 italic ${estimatedProfit >= 0 ? 'text-emerald-500' : 'text-blue-600'}`}>
                                {estimatedProfit >= 0 ? '✓ Margen comercial neto positivo' : '⚠ ALERTA DE PÉRDIDA EN OPERACIÓN'}
                            </p>
                        </div>
                        <span className={`text-2xl font-black tabular-nums tracking-tighter ${estimatedProfit >= 0 ? 'text-emerald-500' : 'text-blue-600'}`}>
                            S/ {estimatedProfit.toFixed(2)}
                        </span>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!selectedSaleProduct || !saleForm.batch} 
                        className="w-full h-12 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-blue-600/10 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale border border-white/10"
                    >
                        CONFIRMAR DESPACHO
                    </button>
                </form>
            </Modal>

            {/* MODAL DE EDICIÓN DE VENTA */}
            <Modal isOpen={modals.editSale} onClose={() => closeModal('editSale')} title="CORRECCIÓN DE TRANSACCIÓN DE SALIDA" icon={ShoppingCart}>
                {editSaleForm && modalData && (
                    <form onSubmit={handleEditSaleSubmit} className="space-y-6 pt-4">
                        <div className="p-5 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/20 rounded-xl space-y-1.5 text-center">
                            <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Identificador de Registro</p>
                            <p className="text-sm font-black uppercase text-slate-900 dark:text-white leading-tight">{modalData.product_name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 h-6 flex items-center">Ajustar Unidades</label>
                                <input type="number" required className="w-full h-12 bg-white dark:bg-zinc-950 px-6 text-lg font-black rounded-md border border-slate-200 dark:border-white/10 outline-none tabular-nums focus:border-blue-600/50" value={editSaleForm.quantity} onChange={e => setEditSaleForm({...editSaleForm, quantity: parseInt(e.target.value)})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 h-6 flex items-center">Validar Tanda</label>
                                <CustomSelect value={editSaleForm.batch} onChange={val => setEditSaleForm({...editSaleForm, batch: val})} options={currentEditSaleTandas} className="h-12 !rounded-md" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Precio Recaudado por Unidad (S/)</label>
                            <input type="number" step="0.01" required className="w-full h-12 bg-white dark:bg-zinc-950 px-6 text-lg font-black rounded-md border border-slate-200 dark:border-white/10 outline-none tabular-nums text-emerald-500 focus:border-emerald-500/50 shadow-inner" value={editSaleForm.sale_price_pen} onChange={e => setEditSaleForm({...editSaleForm, sale_price_pen: parseFloat(e.target.value)})} />
                        </div>
                        <button type="submit" className="w-full h-12 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all active:scale-95 border border-white/10 shadow-lg">GUARDAR CORRECCIÓN</button>
                    </form>
                )}
            </Modal>

            {/* MODAL DE EDICIÓN DE COMPRA */}
            <Modal isOpen={modals.editPurchase} onClose={() => closeModal('editPurchase')} title="RECTIFICACIÓN DE ABASTECIMIENTO" icon={History}>
                {editPurchaseForm && modalData && (
                    <form onSubmit={handleEditPurchaseSubmit} className="space-y-6 pt-4">
                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1.5 text-center">
                            <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Identificador de Stock</p>
                            <p className="text-sm font-black uppercase text-slate-900 dark:text-white leading-tight">{modalData.product_name}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 h-6 flex items-center">Ajustar Cantidad</label>
                                <input type="number" required className="w-full h-12 bg-white dark:bg-zinc-950 px-6 text-lg font-black rounded-md border border-slate-200 dark:border-white/10 outline-none tabular-nums focus:border-blue-600/50" value={editPurchaseForm.quantity} onChange={e => setEditPurchaseForm({...editPurchaseForm, quantity: parseInt(e.target.value)})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 h-6 flex items-center">Lote / Tanda</label>
                                <CustomSelect 
                                    value={editPurchaseForm.batch} 
                                    onChange={val => setEditPurchaseForm({...editPurchaseForm, batch: val})} 
                                    options={[...new Set((batches || []).filter(b => {
                                        const product = (products || []).find(p => p.id === modalData.product_id);
                                        return !b.category || b.category === product?.category;
                                    }).map(b => b.name))]} 
                                    className="h-12 !rounded-md" 
                                />
                            </div>
                        </div>

                        <div className="space-y-4 p-6 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-white/5">
                            <div className="flex justify-between items-center h-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Validar Costo de Adquisición</label>
                                <CustomSelect value={editPurchaseForm.currency} onChange={val => setEditPurchaseForm({...editPurchaseForm, currency: val})} options={['CLP', 'PEN']} className="w-20 h-6" />
                            </div>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-zinc-700 uppercase tracking-tighter">{editPurchaseForm.currency}</span>
                                <input type="number" step="0.01" required className="w-full h-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-16 text-xl font-black rounded-md outline-none text-slate-900 dark:text-white tabular-nums shadow-inner focus:border-emerald-500/50" value={editPurchaseForm.currency === 'CLP' ? (editPurchaseForm.cost_clp || '') : (editPurchaseForm.cost_pen || '')} onChange={e => setEditPurchaseForm({...editPurchaseForm, [editPurchaseForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value)})} />
                            </div>
                        </div>

                        <button type="submit" className="w-full h-12 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all border border-white/10 shadow-lg shadow-blue-600/10">CONFIRMAR CORRECCIÓN</button>
                    </form>
                )}
            </Modal>

            {/* MODAL DE COMPRA / ABASTECIMIENTO */}
            <Modal isOpen={modals.purchase} onClose={() => { closeModal('purchase'); setIsSelectOpen(false); }} title="REGISTRO DE ABASTECIMIENTO TÉCNICO" icon={Plus}>
                <form onSubmit={handlePurchaseSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Referencia del Catálogo Maestro</label>
                        <div className="relative">
                            <button 
                                type="button" 
                                onClick={() => setIsSelectOpen(!isSelectOpen)} 
                                className={`w-full h-12 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 px-6 text-sm font-black rounded-md flex items-center justify-between transition-all ${isSelectOpen ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5' : ''}`}
                            >
                                <span className={`${selectedPurchaseProduct ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-700 uppercase'}`}>
                                    {selectedPurchaseProduct ? `${selectedPurchaseProduct.name} · ${selectedPurchaseProduct.brand}` : 'Buscar producto técnico...'}
                                </span>
                                <Search size={16} className="text-slate-500" />
                            </button>
                            {isSelectOpen && (
                                <div className="absolute z-[1200] w-full mt-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black space-y-4">
                                        <input 
                                            autoFocus 
                                            className="w-full h-10 bg-white dark:bg-zinc-900 px-4 rounded-md text-[11px] font-black outline-none border border-slate-200 dark:border-white/10 focus:border-emerald-500/50 uppercase placeholder:text-zinc-700" 
                                            placeholder="FILTRAR CATÁLOGO..." 
                                            value={searchProduct} 
                                            onChange={e => setSearchProduct(e.target.value)} 
                                        />
                                        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                                            {['Todas', ...(categories || []).map(c => c.name)].map(c => (
                                                <button 
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setSearchCategory(c)}
                                                    className={`px-4 h-7 rounded-md text-[9px] font-black uppercase transition-all whitespace-nowrap border ${searchCategory === c ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 border-slate-200 dark:border-white/5 hover:border-emerald-500/50 hover:text-emerald-500'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                        {filteredProducts
                                            .filter(p => searchCategory === 'Todas' || p.category === searchCategory)
                                            .length === 0 ? (
                                            <div className="py-12 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic opacity-50">No hay productos en esta categoría</div>
                                        ) : (
                                            filteredProducts
                                                .filter(p => searchCategory === 'Todas' || p.category === searchCategory)
                                                .map(p => (
                                                    <button 
                                                        key={p.id} 
                                                        type="button" 
                                                        onClick={() => { setPurchaseForm({ ...purchaseForm, product_id: p.id, currency: p.currency, cost_clp: p.cost_clp, cost_pen: p.cost_pen }); setIsSelectOpen(false); }} 
                                                        className="w-full px-4 py-3 rounded-md bg-white dark:bg-zinc-900 hover:bg-emerald-500/5 hover:border-emerald-500/30 border border-transparent transition-all text-left uppercase text-[10px] font-black flex items-center justify-between group"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-900 dark:text-white">{p.name}</span>
                                                            <span className="text-[8px] text-zinc-500 mt-1">{p.brand} · {p.category}</span>
                                                        </div>
                                                        <ChevronRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100" />
                                                    </button>
                                                ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 h-6 flex items-center">Cantidad Recibida</label>
                            <input 
                                type="number" 
                                required 
                                min="1" 
                                className="w-full h-12 bg-white dark:bg-zinc-950 px-6 text-lg font-black rounded-md border border-slate-200 dark:border-white/10 outline-none tabular-nums focus:border-emerald-500/50 shadow-inner" 
                                value={purchaseForm.quantity} 
                                onChange={e => setPurchaseForm({...purchaseForm, quantity: parseInt(e.target.value)})} 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 h-6 flex items-center">Asignar Tanda (Lote)</label>
                            <CustomSelect 
                                value={purchaseForm.batch} 
                                onChange={val => setPurchaseForm({...purchaseForm, batch: val})} 
                                options={currentPurchaseTandas} 
                                className="h-12 !rounded-md" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-white/5">
                        <div className="space-y-3 md:col-span-2">
                            <div className="flex justify-between items-center px-1 h-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600">Costo Unitario de Adquisición</label>
                                <CustomSelect 
                                    value={purchaseForm.currency} 
                                    onChange={val => setPurchaseForm({...purchaseForm, currency: val})}
                                    options={['CLP', 'PEN']}
                                    className="w-20 h-6"
                                />
                            </div>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-zinc-700 uppercase tracking-tighter">{purchaseForm.currency}</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required 
                                    className="w-full h-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-16 text-xl font-black rounded-md outline-none transition-all text-slate-900 dark:text-white tabular-nums shadow-inner focus:border-emerald-500/50" 
                                    value={purchaseForm.currency === 'CLP' ? (purchaseForm.cost_clp || '') : (purchaseForm.cost_pen || '')} 
                                    onChange={e => setPurchaseForm({
                                        ...purchaseForm, 
                                        [purchaseForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value)
                                    })} 
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between px-2 pt-2">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Inversión Total de Operación</p>
                                <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1 italic tracking-widest leading-none">Valuación patrimonial en moneda local</p>
                            </div>
                            <span className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">
                                S/ {(
                                    (purchaseForm.quantity || 0) * 
                                    (purchaseForm.currency === 'PEN' ? (purchaseForm.cost_pen || 0) : ((purchaseForm.cost_clp || 0) * (parseFloat(settings?.exchange_rate) || 0.0039)))
                                ).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full h-12 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-[0.4em] shadow-lg shadow-emerald-600/10 hover:bg-emerald-500 active:scale-95 transition-all border border-white/10"
                    >
                        CONFIRMAR INGRESO
                    </button>
                </form>
            </Modal>

            {/* MODAL DE PRODUCTO MAESTRO (CREACIÓN Y EDICIÓN) */}
            <Modal 
                isOpen={modals.product || modals.editProduct} 
                onClose={() => { closeModal('product'); closeModal('editProduct'); }} 
                title={modals.editProduct ? "CONFIGURACIÓN TÉCNICA DE ITEM" : "REGISTRO DE NUEVO ACTIVO MAESTRO"} 
                icon={modals.editProduct ? Package : Plus}
            >
                <form onSubmit={handleProductSubmit} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Nombre / Identificador</label>
                            <input className="w-full h-11 bg-white dark:bg-zinc-950 px-5 text-xs font-black uppercase rounded-md border border-slate-200 dark:border-white/10 outline-none focus:border-blue-600/50 transition-all shadow-inner" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="Nombre técnico..." required />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Marca / Fabricante</label>
                            <input className="w-full h-11 bg-white dark:bg-zinc-950 px-5 text-xs font-black uppercase rounded-md border border-slate-200 dark:border-white/10 outline-none focus:border-blue-600/50 transition-all shadow-inner" value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} placeholder="Marca comercial..." required />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Categoría Técnica</label>
                             <CustomSelect value={productForm.category} onChange={val => setProductForm({...productForm, category: val})} options={(categories || []).map(c => c.name)} className="h-11 !rounded-md" />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 ml-1">Config. Alerta Stock</label>
                             <div className="relative">
                                <input type="number" className="w-full h-11 bg-white dark:bg-zinc-950 px-5 text-xs font-black rounded-md border border-slate-200 dark:border-white/10 outline-none focus:border-red-500/50 transition-all tabular-nums" value={productForm.min_stock} onChange={e => setProductForm({...productForm, min_stock: parseInt(e.target.value)})} placeholder="Stock mínimo..." required />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 uppercase">Unidades</span>
                             </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-black rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 px-1">Precio Compra Base</label>
                                <div className="flex gap-2">
                                    <CustomSelect value={productForm.currency} onChange={val => setProductForm({...productForm, currency: val})} options={['CLP', 'PEN']} className="w-20 h-11 !rounded-md" />
                                    <input type="number" step="0.01" className="flex-1 h-11 bg-white dark:bg-zinc-950 px-5 text-lg font-black tabular-nums rounded-md border border-slate-200 dark:border-white/10 outline-none focus:border-emerald-500/50" value={productForm.currency === 'CLP' ? productForm.cost_clp : productForm.cost_pen} onChange={e => setProductForm({...productForm, [productForm.currency === 'CLP' ? 'cost_clp' : 'cost_pen']: parseFloat(e.target.value)})} required />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 px-1">PVP Sugerido (PEN)</label>
                                <div className="relative group/field">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-600/40 uppercase tracking-widest">S/</span>
                                    <input type="number" step="0.01" className="w-full h-11 bg-white dark:bg-zinc-950 px-12 text-lg font-black tabular-nums rounded-md border border-slate-200 dark:border-white/10 outline-none focus:border-blue-600/50" value={productForm.suggested_price} onChange={e => setProductForm({...productForm, suggested_price: parseFloat(e.target.value)})} required />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner flex items-center justify-between px-8">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest leading-none">Neto Proyectado</p>
                                <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1 italic tracking-widest">Utilidad estimada por unidad</p>
                            </div>
                            <span className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">
                                S/ {((productForm.suggested_price || 0) - (productForm.currency === 'PEN' ? (productForm.cost_pen || 0) : ((productForm.cost_clp || 0) * (parseFloat(settings?.exchange_rate) || 0.0039)))).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="w-full h-12 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-600 transition-all active:scale-95 border border-white/10 shadow-xl shadow-blue-600/10">
                        {modals.editProduct ? 'ACTUALIZAR REGISTRO MAESTRO' : 'PUBLICAR ACTIVO EN CATÁLOGO'}
                    </button>
                </form>
            </Modal>
        </>
    );
};

export default GlobalModals;
