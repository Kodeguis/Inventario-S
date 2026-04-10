import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  Star,
  Sun,
  Moon,
  LogOut,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Sidebar = ({ darkMode, setDarkMode, isMobileOpen, setIsMobileOpen }) => {
  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión del sistema maestro?')) {
      await supabase.auth.signOut();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/>, path: '/' },
    { id: 'catalog', label: 'Catálogo', icon: <BookOpen size={18}/>, path: '/catalogo' },
    { id: 'inventory', label: 'Inventario', icon: <Package size={18}/>, path: '/inventario' },
    { id: 'sales', label: 'Ventas', icon: <ShoppingCart size={18}/>, path: '/ventas' },
    { id: 'purchases', label: 'Compras', icon: <TrendingUp size={18}/>, path: '/compras' },
    { id: 'config', label: 'Ajustes', icon: <Settings size={18}/>, path: '/configuracion' }
  ];

  const sidebarClasses = `
    w-64 fixed h-full bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 
    flex flex-col z-[1000] shadow-2xl md:shadow-sm transition-all duration-500 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] md:hidden transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-8 pb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
               <Star size={22} fill="currentColor"/>
             </div>
             <div>
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white leading-tight">Inventario</p>
               <p className="text-[14px] font-black uppercase tracking-tighter text-indigo-600 leading-none">Sergio</p>
             </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 hover:text-indigo-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <NavLink 
              key={item.id} 
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all uppercase
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/25 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}
              `}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50 dark:border-slate-900 space-y-3">
           <button 
             onClick={() => setDarkMode(!darkMode)} 
             className="w-full h-12 flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
           >
              {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
              {darkMode ? (isMobileOpen ? 'MODO CLARO' : '') || 'MODO CLARO' : (isMobileOpen ? 'MODO OSCURO' : '') || 'MODO OSCURO'}
           </button>
           
           <button 
             onClick={handleLogout}
             className="w-full h-12 flex items-center justify-center gap-3 bg-rose-500/10 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-transparent"
           >
              <LogOut size={16} /> <span className="md:inline">{isMobileOpen ? 'SALIR DEL SISTEMA' : 'SALIR'}</span>
           </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
