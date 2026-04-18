import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useModals } from '../../context/ModalContext';
import { 
  TrendingUp, 
  Star, 
  Layers, 
  Package, 
  Plus, 
  ShoppingCart, 
  FileSpreadsheet, 
  Filter, 
  Cloud,
  ArrowUp,
  ArrowDown,
  Wallet
} from 'lucide-react';
import CustomSelect from '../../components/Common/CustomSelect';
import { exportToExcel } from '../../utils/excelExport';
import { supabase } from '../../lib/supabaseClient';
import { initGoogleContext, saveToGoogleDrive } from '../../utils/googleDrive';

const DashboardPage = () => {
  const { products, sales, purchases, categories, settings, loading } = useInventory();
  const { openModal } = useModals();
  const [filterMonth, setFilterMonth] = React.useState('all');
  const [filterYear, setFilterYear] = React.useState('2026');
  const [filterCategory, setFilterCategory] = React.useState('Todas');

  React.useEffect(() => {
    initGoogleContext();
  }, []);

  const MESES = [
    { id: 'all', label: 'Todos los meses' }, { id: '0', label: 'Enero' }, { id: '1', label: 'Febrero' }, { id: '2', label: 'Marzo' },
    { id: '3', label: 'Abril' }, { id: '4', label: 'Mayo' }, { id: '5', label: 'Junio' }, { id: '6', label: 'Julio' },
    { id: '7', label: 'Agosto' }, { id: '8', label: 'Septiembre' }, { id: '9', label: 'Octubre' }, { id: '10', label: 'Noviembre' }, { id: '11', label: 'Diciembre' }
  ];



  const parseDate = (dStr) => {
    if (!dStr) return new Date();
    if (dStr.includes('-')) {
        const parts = dStr.split(' ')[0].split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    if (dStr.includes('/')) {
        const parts = dStr.split('/');
        if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dStr);
  };

  const isPeriodMatch = (itemDate) => {
    const date = parseDate(itemDate);
    const matchesYear = date.getFullYear().toString() === filterYear;
    if (filterMonth === 'all') return matchesYear;
    return matchesYear && date.getMonth().toString() === filterMonth;
  };

  const dashboardSales = sales.filter(s => 
    isPeriodMatch(s.date) && 
    (filterCategory === 'Todas' || s.product_category === filterCategory)
  );
  
  const dashboardPurchases = purchases.filter(p => 
    isPeriodMatch(p.date) && 
    (filterCategory === 'Todas' || p.product_category === filterCategory)
  );

  const filteredProducts = products.filter(p => 
    filterCategory === 'Todas' || p.category === filterCategory
  );

  const tRev = dashboardSales.reduce((acc, s) => acc + (s.sale_price_pen * s.quantity || 0), 0);
  const tProf = dashboardSales.reduce((acc, s) => acc + (s.profit_pen || 0), 0);
  
  const tInvPeriod = dashboardPurchases.reduce((acc, p) => {
    const rate = parseFloat(settings.exchange_rate) || 0.0039;
    if (p.currency === 'PEN') return acc + ((p.quantity||0) * (p.cost_pen||0));
    return acc + ((p.quantity||0) * (p.cost_clp||0) * rate);
  }, 0);

  const tInvGlobal = filteredProducts.reduce((acc, p) => {
    const rate = parseFloat(settings.exchange_rate) || 0.0039;
    if (p.currency === 'PEN') return acc + ((p.stock||0) * (p.cost_pen||0));
    return acc + ((p.stock||0) * (p.cost_clp||0) * rate);
  }, 0);

  const productsWithPurchases = new Set(purchases.map(pu => pu.product_id));
  const lStock = filteredProducts.filter(p => productsWithPurchases.has(p.id) && (p.stock || 0) < 5).length;

  const handleExportExcel = () => {
    try {
      exportToExcel(sales, products, categories, purchases);
    } catch (error) {
      alert('Error al generar Excel localmente');
    }
  };

  const handleBackupDrive = async () => {
    try {
      const excelBlob = exportToExcel(sales, products, categories, purchases, false);
      const fileName = `Respaldo_Inventario_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

      await saveToGoogleDrive(excelBlob, fileName);
      
      alert('¡Sincronización con Google Drive exitosa!');
    } catch (error) {
      if (error.error === 'popup_closed_by_user') return;
      alert('Error al conectar con Google Drive. Verifica tu conexión o el Client ID.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
           <h2 className="text-3xl font-black tracking-tight uppercase">Análisis Operativo</h2>
           <p className="text-[11px] font-bold text-indigo-500/60 uppercase tracking-widest mt-1">Métricas inteligentes y control de flujo</p>
         </div>
         
         <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all focus-within:ring-4 ring-indigo-500/10">
             <span className="text-[9px] font-black uppercase opacity-30 ml-3 tracking-widest whitespace-nowrap">Reporte:</span>
             <CustomSelect 
               value={MESES.find(m => m.id === filterMonth)?.label} 
               onChange={val => {
                 const monthId = MESES.find(m => m.label === val)?.id;
                 setFilterMonth(monthId);
               }}
               options={MESES.map(m => m.label)}
               className="w-48 h-10"
             />
             <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
             <CustomSelect 
               value={filterYear} 
               onChange={val => setFilterYear(val)}
               options={['2026', '2027', '2028']}
               className="w-28 h-10"
             />
           </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex items-center gap-2 pr-4">
         <div className="bg-slate-50 dark:bg-slate-950 px-4 h-10 flex items-center gap-2 rounded-xl">
           <Filter size={14} className="text-indigo-600 opacity-40" />
           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Categoría</span>
         </div>
         <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {['Todas', ...categories.map(c => c.name)].map(c => (
               <button 
                 key={c} 
                 onClick={() => setFilterCategory(c)} 
                 className={`px-5 h-10 whitespace-nowrap text-[9px] font-black rounded-xl transition-all border ${filterCategory === c ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 {c.toUpperCase()}
               </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
         {[
           { l: 'Ingresos Brutos', v: `S/ ${tRev.toLocaleString()}`, c: 'bg-white', i: <TrendingUp size={24}/> },
           { 
               l: 'Ganancia Neta', 
               v: `S/ ${tProf.toLocaleString()}`, 
               c: 'bg-indigo-600 text-white', 
               i: <Star size={24}/>,
               accent: true
           },
           { 
               l: 'Capital de Inventario', 
               v: `S/ ${tInvGlobal.toLocaleString()}`, 
               sub: `Inversión Ciclo: S/ ${tInvPeriod.toLocaleString()}`,
               c: 'bg-white', 
               i: <Wallet size={24}/> 
           },
           { l: 'Items en Riesgo', v: lStock, c: 'bg-white', i: <Package size={24}/>, critical: lStock > 0 }
         ].map((d, i) => (
           <div key={i} className={`${d.accent ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'} p-8 rounded-3xl border relative group hover:scale-[1.03] transition-all duration-300`}>
              <div className={`p-3 w-fit rounded-2xl mb-8 ${d.accent ? 'bg-white/10 text-white' : 'bg-slate-50 dark:bg-slate-950 text-indigo-600'}`}>
                {d.i}
              </div>
              <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${d.accent ? 'opacity-70' : 'opacity-40'}`}>{d.l}</p>
              <p className="text-3xl font-black tabular-nums tracking-tighter">{d.v}</p>
              {d.sub && <p className="text-[9px] font-bold uppercase mt-2 opacity-40">{d.sub}</p>}
              {d.critical && (
                <div className="absolute top-6 right-6 w-3 h-3 bg-rose-500 rounded-full animate-ping opacity-75"></div>
              )}
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10">
            <div className="flex justify-between items-center text-slate-400">
              <h3 className="text-[11px] font-black uppercase tracking-widest opacity-60">Puntos de Entrada</h3>
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-bold uppercase italic">Acciones Rápidas</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <button onClick={() => openModal('purchase')} className="p-12 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex flex-col items-center gap-5 text-slate-400 hover:text-indigo-600 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-all"></div>
                  <Plus size={36} className="group-hover:rotate-90 transition-transform duration-500 relative z-10"/> 
                  <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Nueva Compra</span>
               </button>
               <button onClick={() => openModal('sale')} className="p-12 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex flex-col items-center gap-5 text-slate-400 hover:text-emerald-600 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/5 transition-all"></div>
                  <ShoppingCart size={36} className="group-hover:scale-110 transition-transform duration-500 relative z-10" /> 
                  <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Nueva Venta</span>
               </button>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-10 flex flex-col justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-widest opacity-30">Gestión Documental</h3>
            <div className="space-y-6">
               <div className="flex gap-4">
                  <button 
                    onClick={handleExportExcel}
                    className="flex-1 h-16 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-between px-8 group"
                   >
                     <span>Generar Excel Premium</span> 
                     <FileSpreadsheet size={22} className="group-hover:rotate-12 transition-transform"/>
                  </button>
                  <button className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all active:scale-90 border border-slate-200 dark:border-slate-700">
                    <Filter size={20}/>
                  </button>
               </div>
               <button 
                 onClick={handleBackupDrive}
                 className="w-full h-14 flex items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-indigo-600/10 hover:text-indigo-600 transition-all"
               >
                  <Cloud size={18}/> Respaldar en Google Drive
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardPage;
