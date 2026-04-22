import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useModals } from '../../context/ModalContext';
import { 
  TrendingUp, 
  Package, 
  Plus, 
  ShoppingCart, 
  FileText, 
  Cloud,
  ArrowUp,
  Zap,
  ArrowRight
} from 'lucide-react';
import CustomSelect from '../../components/Common/CustomSelect';
import KPICard from '../../components/Common/KPICard';
import { exportToExcel } from '../../utils/excelExport';
import { saveToGoogleDrive, initGoogleContext } from '../../utils/googleDrive';

const DashboardPage = () => {
    const context = useInventory();
    const { openModal } = useModals();

    const products = context?.products || [];
    const sales = context?.sales || [];
    const purchases = context?.purchases || [];
    const categories = context?.categories || [];
    const batches = context?.batches || [];
    const settings = context?.settings || {};

    const [filterMonth, setFilterMonth] = React.useState('all');
    const [filterYear, setFilterYear] = React.useState('2026');
    const [filterCategory, setFilterCategory] = React.useState('Todas');
    const [isSyncing, setIsSyncing] = React.useState(false);

    React.useEffect(() => {
        initGoogleContext();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos días";
        if (hour < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    const MESES = [
        { id: 'all', label: 'Todo el año' }, { id: '0', label: 'Enero' }, { id: '1', label: 'Febrero' }, { id: '2', label: 'Marzo' },
        { id: '3', label: 'Abril' }, { id: '4', label: 'Mayo' }, { id: '5', label: 'Junio' }, { id: '6', label: 'Julio' },
        { id: '7', label: 'Agosto' }, { id: '8', label: 'Septiembre' }, { id: '9', label: 'Octubre' }, { id: '10', label: 'Noviembre' }, { id: '11', label: 'Diciembre' }
    ];

    const parseDate = (dStr) => {
        if (!dStr) return new Date();
        try {
            if (dStr.includes('-')) {
                const parts = dStr.split(' ')[0].split('-');
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return new Date(dStr);
        } catch (e) { return new Date(); }
    };

    const isPeriodMatch = (itemDate) => {
        const date = parseDate(itemDate);
        return date.getFullYear().toString() === filterYear && (filterMonth === 'all' || date.getMonth().toString() === filterMonth);
    };

    const dashboardSales = sales.filter(s => isPeriodMatch(s?.date) && (filterCategory === 'Todas' || s?.product_category === filterCategory));
    const dashboardPurchases = purchases.filter(p => isPeriodMatch(p?.date) && (filterCategory === 'Todas' || p?.product_category === filterCategory));
    
    const tRev = dashboardSales.reduce((acc, s) => acc + ((s?.sale_price_pen || 0) * (s?.quantity || 0)), 0);
    const tProf = dashboardSales.reduce((acc, s) => acc + (s?.profit_pen || 0), 0);
    const rate = parseFloat(settings?.exchange_rate) || 0.0039;

    const filteredProducts = products.filter(p => filterCategory === 'Todas' || p?.category === filterCategory);
    
    const tInvPeriodPEN = dashboardPurchases.reduce((acc, p) => p?.currency === 'PEN' ? acc + ((p?.quantity||0) * (p?.cost_pen||0)) : acc + ((p?.quantity||0) * (p?.cost_clp||0) * rate), 0);
    const tInvGlobalPEN = filteredProducts.reduce((acc, p) => p?.currency === 'PEN' ? acc + ((p?.stock||0) * (p?.cost_pen||0)) : acc + ((p?.stock||0) * (p?.cost_clp||0) * rate), 0);
    const tInvGlobalCLP = filteredProducts.reduce((acc, p) => p?.currency === 'CLP' ? acc + ((p?.stock||0) * (p?.cost_clp||0)) : acc, 0);
    const tInvPeriodCLP = dashboardPurchases.reduce((acc, p) => p?.currency === 'CLP' ? acc + ((p?.quantity||0) * (p?.cost_clp||0)) : acc, 0);
    // Solo contar artículos que tienen stock mayor a 0 pero menor al límite (Artículos que se están agotando)
    const lStock = filteredProducts.filter(p => (p?.stock || 0) > 0 && (p?.stock || 0) < 5).length;

    const { user } = context;

    const handleCloudSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const buffer = await exportToExcel(sales, products, categories, purchases, batches, false);
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fileName = `RESPALDO_CLOUD_${new Date().toISOString().split('T')[0]}.xlsx`;
            await saveToGoogleDrive(blob, fileName);
            alert("¡Sincronización exitosa! El archivo está en tu Google Drive.");
        } catch (err) {
            console.error(err);
            alert("Error en la sincronización: " + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const getUserName = () => {
        if (!user) return 'Usuario';
        if (user.user_metadata?.full_name) return user.user_metadata.full_name;
        if (user.user_metadata?.name) return user.user_metadata.name;
        const email = user.email || '';
        const namePart = email.split('@')[0];
        return namePart
          .split(/[._]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ') || 'Usuario';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-1">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 pt-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                    <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
                        {getGreeting()}, <span className="text-blue-600 font-black">{getUserName()}</span>
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">SISTEMA MAESTRO DE OPERACIONES · CONTROL CENTRAL</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Periodo</label>
                        <CustomSelect 
                            value={MESES.find(m => m.id === filterMonth)?.label || 'Todo el año'} 
                            onChange={val => setFilterMonth(MESES.find(m => m.label === val)?.id || 'all')} 
                            options={MESES.map(m => m.label)} 
                            className="h-9 w-44 shadow-sm dark:shadow-none" 
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Año</label>
                        <CustomSelect 
                            value={filterYear} 
                            onChange={(v) => setFilterYear(v || '2026')} 
                            options={['2026', '2027', '2028']} 
                            className="h-9 w-24 shadow-sm dark:shadow-none" 
                        />
                    </div>
                </div>
            </header>

            <nav className="flex items-center gap-2 p-1 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-lg overflow-x-auto no-scrollbar shadow-sm dark:shadow-none">
                {['Todas', ...(categories || []).map(c => c?.name || '')].filter(Boolean).map(c => (
                    <button 
                        key={c} 
                        onClick={() => setFilterCategory(c)} 
                        className={`px-6 h-8 whitespace-nowrap text-[10px] font-bold uppercase rounded-md transition-all ${filterCategory === c ? 'bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        {c}
                    </button>
                ))}
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Ingreso Bruto" value={`S/ ${(tRev || 0).toLocaleString()}`} icon={<ShoppingCart size={15}/>} color="emerald" sub="Flujo bruto recibido" />
                <KPICard label="Ganancia Proyectada" value={`S/ ${(tProf || 0).toLocaleString()}`} icon={<TrendingUp size={15}/>} color="emerald" sub="Margen real de ahorro" />
                <KPICard 
                    label="Capital en Stock" 
                    value={`S/ ${(tInvGlobalPEN || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                    icon={<Package size={15}/>} 
                    color="blue" 
                    sub={(tInvGlobalCLP || 0) > 0 ? `$ ${tInvGlobalCLP.toLocaleString()} CLP` : 'Capital pendiente'}
                    footer={(
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 space-y-1">
                            <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-tighter">Inversión Ciclo: S/ {(tInvPeriodPEN || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            {(tInvPeriodCLP || 0) > 0 && <p className="text-[8px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-tighter italic">Inc. {tInvPeriodCLP.toLocaleString()} CLP</p>}
                        </div>
                    )}
                />
                <KPICard label="Artículos en Riesgo" value={lStock || 0} icon={<Zap size={15}/>} color="red" sub="Bajo el límite de stock" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-950/30 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
                    <h2 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-10 opacity-70">Panel de Operación Directa</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <QuickAction 
                            onClick={() => openModal('purchase')} 
                            icon={<Plus size={20} />} 
                            title="Abastecimiento" 
                            desc="Incrementar stock de productos." 
                            color="blue" 
                        />
                        <QuickAction 
                            onClick={() => openModal('sale')} 
                            icon={<ShoppingCart size={20} />} 
                            title="Nueva Venta" 
                            desc="Registrar despacho y utilidad." 
                            color="emerald" 
                        />
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex flex-col justify-between relative overflow-hidden group rounded-2xl shadow-xl dark:shadow-2xl">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <FileText size={16} className="text-slate-400 dark:text-zinc-500" />
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Canales de Reporte</h3>
                        </div>
                        <div className="space-y-4">
                            <button onClick={() => exportToExcel(sales, products, categories, purchases, batches)} className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-all flex items-center justify-between px-6 shadow-lg">
                                <span>Exportar Excel</span>
                                <ArrowUp size={14} />
                            </button>
                            <button onClick={handleCloudSync} disabled={isSyncing} className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center justify-between px-6">
                                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Cloud'}</span>
                                <Cloud size={14} className="text-blue-600" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Última Sincro</p>
                            <p className="text-[11px] font-bold text-blue-600">Sesión Activa</p>
                        </div>
                        <Zap size={20} className="text-yellow-400 opacity-20" />
                    </div>
                </div>
            </div>
        </div>
    );
};



const QuickAction = ({ onClick, icon, title, desc, color }) => {
    const iconColors = color === 'emerald' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-600 bg-blue-600/10 border-blue-600/20';
    const hoverBorder = color === 'emerald' ? 'hover:border-emerald-500/50' : 'hover:border-blue-600/50';

    return (
        <button onClick={onClick} className={`group p-6 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 ${hoverBorder} transition-all text-left shadow-sm dark:shadow-xl`}>
            <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-md border ${iconColors} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-zinc-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-1">{title}</h4>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium leading-relaxed">{desc}</p>
        </button>
    );
}

export default DashboardPage;
