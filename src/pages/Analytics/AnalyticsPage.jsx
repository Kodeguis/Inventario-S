import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import Modal from '../../components/Common/Modal';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  PieChart, 
  ArrowUpRight,
  Layers,
  Target,
  Globe,
  Sparkles
} from 'lucide-react';
import CustomSelect from '../../components/Common/CustomSelect';
import KPICard from '../../components/Common/KPICard';

const AnalyticsPage = () => {
    const { products, sales, purchases, batches, categories, settings } = useInventory();
    
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [selectedBatch, setSelectedBatch] = useState('Todas');
    const [detailBatch, setDetailBatch] = useState(null);
    const [hoverData, setHoverData] = useState(null);

    const exchangeRate = parseFloat(settings?.exchange_rate) || 0.0039;

    const availableBatches = useMemo(() => {
        if (selectedCategory === 'Todas') return ['Todas'];
        const filtered = (batches || []).filter(b => b.category === selectedCategory).map(b => b.name);
        return ['Todas', ...filtered];
    }, [selectedCategory, batches]);

    const stats = useMemo(() => {
        const now = new Date();
        const last6Months = Array.from({length: 6}, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return {
                month: d.getMonth(),
                year: d.getFullYear(),
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('es-ES', { month: 'long' })
            };
        }).reverse();

        const filteredSales = (sales || []).filter(s => {
            const prod = (products || []).find(p => p.id === s.product_id);
            const matchesCat = selectedCategory === 'Todas' || prod?.category === selectedCategory;
            const matchesBatch = selectedBatch === 'Todas' || s.batch === selectedBatch;
            return matchesCat && matchesBatch;
        });

        const filteredPurchases = (purchases || []).filter(p => {
            const prod = (products || []).find(pr => pr.id === p.product_id);
            const matchesCat = selectedCategory === 'Todas' || prod?.category === selectedCategory;
            const matchesBatch = selectedBatch === 'Todas' || p.batch === selectedBatch;
            return matchesCat && matchesBatch;
        });

        const totalSalesPEN = filteredSales.reduce((acc, s) => acc + (s.total_sale_pen || 0), 0);
        const totalProfitPEN = filteredSales.reduce((acc, s) => acc + (s.profit_pen || 0), 0);
        const totalInvestmentPEN = filteredPurchases.reduce((acc, p) => acc + ((p.currency === 'PEN' ? p.cost_pen : p.cost_clp * exchangeRate) * (p.quantity || 0)), 0);

        const monthlyData = last6Months.map(m => {
            const mSales = filteredSales.filter(s => s.date?.startsWith(m.key));
            const mPurchases = filteredPurchases.filter(p => p.date?.startsWith(m.key));
            const revenue = mSales.reduce((sum, s) => sum + (s.total_sale_pen || 0), 0);
            const profit = mSales.reduce((sum, s) => sum + (s.profit_pen || 0), 0);
            const investment = mPurchases.reduce((sum, p) => sum + ((p.currency === 'PEN' ? p.cost_pen : p.cost_clp * (exchangeRate || 0)) * (p.quantity || 0)), 0);
            return { ...m, revenue, profit, investment };
        });

        const maxVal = Math.max(...monthlyData.map(d => Math.max(d.revenue, d.investment)), 1000);

        const categoryData = (categories || []).map(cat => {
            const catSales = (sales || []).filter(s => {
                const prod = products.find(p => p.id === s.product_id);
                return prod?.category === cat.name;
            });
            const profit = catSales.reduce((acc, s) => acc + (s.profit_pen || 0), 0);
            return { name: cat.name, profit };
        }).sort((a,b) => b.profit - a.profit).slice(0, 4);

        const totalGlobalProfit = categoryData.reduce((acc, c) => acc + c.profit, 0) || 1;

        const productMap = {};
        filteredSales.forEach(s => {
            if (!productMap[s.product_id]) {
                const prod = products.find(p => p.id === s.product_id);
                productMap[s.product_id] = { name: prod?.name || 'Desconocido', qty: 0, rev: 0, profit: 0 };
            }
            productMap[s.product_id].qty += s.quantity;
            productMap[s.product_id].rev += s.total_sale_pen;
            productMap[s.product_id].profit += s.profit_pen;
        });
        const topProducts = Object.values(productMap).sort((a, b) => b.rev - a.rev).slice(0, 5);

        const batchProgress = [];
        if (selectedCategory !== 'Todas') {
            const targetBatches = selectedBatch !== 'Todas' ? [selectedBatch] : availableBatches.filter(b => b !== 'Todas');
            targetBatches.forEach(bName => {
                const bPurchases = (purchases || []).filter(p => products.find(pr => pr.id === p.product_id)?.category === selectedCategory && p.batch === bName);
                const bSales = (sales || []).filter(s => products.find(pr => pr.id === s.product_id)?.category === selectedCategory && s.batch === bName);
                const bQty = bPurchases.reduce((acc, p) => acc + p.quantity, 0);
                const sQty = bSales.reduce((acc, s) => acc + s.quantity, 0);
                
                const investmentCLP = bPurchases.filter(p => p.currency === 'CLP').reduce((acc, p) => acc + (p.cost_clp * p.quantity), 0);
                const investmentPEN_original = bPurchases.filter(p => p.currency === 'PEN').reduce((acc, p) => acc + (p.cost_pen * p.quantity), 0);

                if (bQty > 0) {
                    batchProgress.push({
                        name: bName, progress: (sQty / bQty) * 100, sold: sQty, total: bQty, remaining: bQty - sQty,
                        investment: bPurchases.reduce((acc, p) => acc + ((p.currency === 'PEN' ? p.cost_pen : p.cost_clp * exchangeRate) * p.quantity), 0),
                        investmentCLP, investmentPEN_original,
                        recovered: bSales.reduce((acc, s) => acc + s.total_sale_pen, 0), profit: bSales.reduce((acc, s) => acc + s.profit_pen, 0),
                        projectedVal: bPurchases.reduce((acc, p) => acc + (Math.max(0, p.quantity - bSales.filter(s => s.product_id === p.product_id).reduce((sum, s) => sum + (s.quantity || 0), 0)) * ((products || []).find(pr => pr.id === p.product_id)?.suggested_price || 0)), 0),
                        category: selectedCategory
                    });
                }
            });
        }

        return { totalSalesPEN, totalProfitPEN, totalInvestmentPEN, topProducts, batchProgress: batchProgress.sort((a, b) => b.progress - a.progress), monthlyData, maxVal, categoryData, totalGlobalProfit };
    }, [selectedCategory, selectedBatch, sales, purchases, products, settings, batches, availableBatches, exchangeRate, categories]);

    const getPoints = (data, key, height, width, maxVal) => {
        const padding = 40;
        const availableHeight = height - padding * 2;
        const availableWidth = width - padding * 2;
        return data.map((d, i) => {
            const x = padding + (i * (availableWidth / (data.length - 1)));
            const y = height - padding - ((d[key] / maxVal) * availableHeight);
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-1">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10 pt-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} className="text-emerald-500" />
                        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            Análisis <span className="text-emerald-500">Operativo</span>
                        </h1>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Inteligencia de Datos y Monitor de Rendimiento Maestro</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Categoría Maestra</label>
                        <CustomSelect 
                            value={selectedCategory} 
                            onChange={(val) => { setSelectedCategory(val); setSelectedBatch('Todas'); }} 
                            options={['Todas', ...(categories || []).map(c => c.name)]} 
                            className="h-9 w-44" 
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Monitor Lote</label>
                        <CustomSelect 
                            value={selectedBatch} 
                            onChange={setSelectedBatch} 
                            options={availableBatches} 
                            className="h-9 w-44" 
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Ingreso Total" value={`S/ ${stats.totalSalesPEN.toLocaleString()}`} icon={<ShoppingCart size={15}/>} color="emerald" sub="Flujo bruto registrado" />
                <KPICard label="Utilidad Neta" value={`S/ ${stats.totalProfitPEN.toLocaleString()}`} icon={<TrendingUp size={15}/>} color="emerald" sub="Margen real acumulado" />
                <KPICard label="Inversión" value={`S/ ${stats.totalInvestmentPEN.toLocaleString()}`} icon={<Package size={15}/>} color="red" sub="Capital en activos" />
                <KPICard label="Tasa Beneficio" value={`${stats.totalSalesPEN > 0 ? ((stats.totalProfitPEN / stats.totalSalesPEN) * 100).toFixed(1) : 0}%`} icon={<PieChart size={15}/>} color="blue" sub="Rendimiento neto" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-950/30 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Evolución Histórica</h2>
                            <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-tighter">Facturación vs Inversión en tiempo real</p>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Ventas</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-zinc-800"></div><span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Costos</span></div>
                        </div>
                    </div>

                    <div className="relative h-64 w-full mb-6">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            
                            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                                <line key={i} x1="40" y1={40 + p * 220} x2="760" y2={40 + p * 220} stroke="currentColor" className="text-slate-100 dark:text-zinc-900" strokeWidth="1" />
                            ))}

                            <polyline fill="none" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1.5" strokeDasharray="4 4" points={getPoints(stats.monthlyData, 'investment', 300, 800, stats.maxVal)} />
                            
                            <path d={`M 40 260 ${getPoints(stats.monthlyData, 'revenue', 300, 800, stats.maxVal)} L 760 260 Z`} fill="url(#areaGradient)" />
                            
                            <polyline fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={getPoints(stats.monthlyData, 'revenue', 300, 800, stats.maxVal)} />

                            {stats.monthlyData.map((d, i) => {
                                const x = 40 + (i * (720 / (stats.monthlyData.length - 1)));
                                const yRev = 300 - 40 - ((d.revenue / stats.maxVal) * 220);
                                return (
                                    <circle key={i} cx={x} cy={yRev} r="4" fill="#10b981" className="cursor-pointer transition-all hover:r-6 ring-4 ring-white dark:ring-zinc-950 shadow-lg" onMouseEnter={() => setHoverData({ ...d, index: i })} onMouseLeave={() => setHoverData(null)} />
                                );
                            })}
                        </svg>

                        {hoverData && (
                            <div className="absolute bg-white dark:bg-black border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-2xl z-20 space-y-3 pointer-events-none min-w-[200px]"
                                 style={{ left: `${(hoverData.index * (100 / (stats.monthlyData.length - 1)))}%`, top: '10px', transform: hoverData.index === 0 ? 'translateX(0%)' : hoverData.index === stats.monthlyData.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">{hoverData.label} {hoverData.year}</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Ventas</span><span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">S/ {hoverData.revenue.toLocaleString()}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Utilidad</span><span className="text-xs font-bold text-emerald-500 whitespace-nowrap">S/ {hoverData.profit.toLocaleString()}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between px-10 text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                        {stats.monthlyData.map((d, i) => <span key={i}>{d.label.substring(0,3)}</span>)}
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex flex-col rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-10">
                        <PieChart size={16} className="text-emerald-500 opacity-60"/>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Rentabilidad Bruta</h2>
                    </div>
                    <div className="flex-1 space-y-8">
                        {stats.categoryData.map((c, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-tight">{c.name}</span><span className="text-xs font-bold text-slate-900 dark:text-white">S/ {c.profit.toLocaleString()}</span></div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${(c.profit / stats.totalGlobalProfit) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-8 border-t border-slate-100 dark:border-white/5 mt-auto">
                        <div className="flex items-center justify-between p-5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                           <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.1em]">Total Neto Acumulado</span>
                           <span className="text-xl font-bold text-emerald-500 tabular-nums">S/ {stats.totalProfitPEN.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                <div className="p-8 bg-white dark:bg-zinc-950/30 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <h2 className="text-sm font-bold mb-10 flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-widest">
                        <Layers size={16} className="text-emerald-500"/> Monitor de Ciclo Lotes
                    </h2>
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.batchProgress.length > 0 ? stats.batchProgress.map((b, i) => (
                            <button key={i} onClick={() => setDetailBatch(b)} className="w-full text-left p-5 rounded-xl bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-white/5 hover:border-emerald-500/40 hover:bg-white dark:hover:bg-zinc-900 transition-all flex items-center justify-between group">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{b.name}</span>
                                        <span className={`text-[10px] font-bold tabular-nums ${b.progress >= 100 ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-600'}`}>{b.progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${b.progress >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-600'}`} style={{ width: `${Math.min(100, b.progress)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                                        <span className={b.progress >= 100 ? 'text-emerald-500' : 'text-red-500'}>{b.progress >= 100 ? '✓ RETORNO COMPLETADO' : `FALTAN ${b.remaining} UNIDADES`}</span>
                                        <ArrowUpRight size={14} className={b.progress >= 100 ? 'text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity' : 'text-red-500 opacity-0 group-hover:opacity-100 transition-opacity'} />
                                    </div>
                                </div>
                            </button>
                        )) : <div className="py-20 text-center text-slate-300 dark:text-zinc-800 text-[10px] uppercase font-bold tracking-[0.3em]">Seleccionar categoría para auditar lotes</div>}
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
                    <h2 className="text-sm font-bold mb-10 flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-widest">
                        <Target size={16} className="text-blue-600"/> Artículos Maestro Top
                    </h2>
                    <div className="space-y-3">
                        {stats.topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-white/5 rounded-xl hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                                <div className="flex items-center gap-5">
                                    <div className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold text-slate-400 dark:text-zinc-600 border border-slate-100 dark:border-white/5 group-hover:text-emerald-500 group-hover:border-emerald-500/20 transition-all">{i + 1}</div>
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</p>
                                        <p className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase font-bold mt-1.5 tracking-widest">{p.qty} UNIDADES VENDIDAS</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col gap-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">S/ {p.rev.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter italic">S/ {p.profit.toFixed(0)} NETO</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal isOpen={!!detailBatch} onClose={() => setDetailBatch(null)} title={`ANÁLISIS FINANCIERO: ${detailBatch?.name}`} icon={Globe}>
                {detailBatch && (
                    <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-xl border border-slate-200 dark:border-white/10">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase block mb-3 tracking-widest text-center">Recuperado Bruto</span>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tighter block text-center">S/ {detailBatch.recovered.toFixed(0)}</span>
                            </div>
                            <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-3 tracking-widest text-center">Utilidad Real</span>
                                <span className="text-2xl font-bold text-emerald-600 tabular-nums tracking-tighter block text-center">S/ {detailBatch.profit.toFixed(0)}</span>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-100/50 dark:bg-black/50 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-500 dark:text-zinc-500">Ciclo de Break-Even</span>
                                <span className={`px-4 py-1 rounded-md border text-[9px] ${detailBatch.recovered >= detailBatch.investment ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'}`}>
                                    {detailBatch.recovered >= detailBatch.investment 
                                        ? `SUPERÁVIT: +S/ ${(detailBatch.recovered - detailBatch.investment).toFixed(0)}` 
                                        : `RECUPERACIÓN: ${((detailBatch.recovered / detailBatch.investment) * 100).toFixed(0)}%`}
                                </span>
                            </div>
                            
                            <div className="h-2 w-full bg-white dark:bg-zinc-900 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
                                <div className={`h-full transition-all duration-1000 ease-out ${detailBatch.recovered >= detailBatch.investment ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-600'}`} style={{ width: `${Math.min(100, (detailBatch.recovered / (detailBatch.investment || 1)) * 100)}%` }}></div>
                            </div>
                            
                            <p className={`text-[10px] font-bold uppercase text-center ${detailBatch.recovered >= detailBatch.investment ? 'text-emerald-500 px-1' : 'text-red-500'}`}>
                                {detailBatch.recovered >= detailBatch.investment ? '✓ CAPITAL RECUPERADO AL 100%' : `RESTA S/ ${(detailBatch.investment - detailBatch.recovered).toFixed(0)} PARA EL BREAK-EVEN`}
                            </p>

                            {detailBatch.investmentCLP > 0 && (
                                <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe size={14} className="text-emerald-500 opacity-60" />
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Inversión Procedencia Chile</p>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                        $ {detailBatch.investmentCLP.toLocaleString()} CLP
                                        {detailBatch.investmentPEN_original > 0 && <span className="text-zinc-500 font-medium ml-2">+ S/ {detailBatch.investmentPEN_original.toLocaleString()} PEN</span>}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'Inversión Consolidada', value: `S/ ${detailBatch.investment.toLocaleString()}`, icon: <Package size={14} className="text-zinc-500"/> },
                                { label: 'Plusvalía en Stock', value: `S/ ${detailBatch.projectedVal.toLocaleString()}`, icon: <DollarSign size={14} className="text-emerald-500"/> },
                                { label: 'Items Restantes', value: `${detailBatch.remaining} unidades`, icon: <Target size={14} className="text-red-600"/> }
                            ].map((row, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/10 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-50 dark:bg-zinc-900 rounded-lg">{row.icon}</div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{row.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setDetailBatch(null)} className="w-full h-12 bg-slate-950 dark:bg-white text-white dark:text-black rounded-xl text-[11px] font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all mt-4 border border-white/10 shadow-lg">CONTINUAR</button>
                    </div>
                )}
            </Modal>
        </div>
    );
};



export default AnalyticsPage;
