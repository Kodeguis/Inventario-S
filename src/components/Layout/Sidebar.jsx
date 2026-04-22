import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3,
  BookOpen, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  Sun,
  Moon,
  LogOut,
  X,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useInventory } from '../../context/InventoryContext';
import PinoIcon from '../Common/PinoIcon';

const Sidebar = ({ darkMode, setDarkMode, isMobileOpen, setIsMobileOpen }) => {
  const { user } = useInventory();

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión del sistema maestro?')) {
      await supabase.auth.signOut();
    }
  };

  // Extract name from user object or email
  const getUserName = () => {
    if (!user) return 'Usuario';
    
    // Check if name is in metadata
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    
    // Otherwise extract from email
    const email = user.email || '';
    const namePart = email.split('@')[0];
    // Capitalize first letter and replace any dots/underscores with spaces
    return namePart
      .split(/[._]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ') || 'Usuario';
  };

  const sections = [
    {
      title: "Resumen y Análisis",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/>, path: '/' },
        { id: 'analytics', label: 'Estadísticas', icon: <BarChart3 size={18}/>, path: '/analytics' },
      ]
    },
    {
      title: "Gestión de Activos",
      items: [
        { id: 'catalog', label: 'Catálogo Maestro', icon: <BookOpen size={18}/>, path: '/catalogo' },
        { id: 'inventory', label: 'Control Stock', icon: <Package size={18}/>, path: '/inventario' },
      ]
    },
    {
      title: "Flujo Operativo",
      items: [
        { id: 'sales', label: 'Gestión Ventas', icon: <ShoppingCart size={18}/>, path: '/ventas' },
        { id: 'purchases', label: 'Abastecimiento', icon: <TrendingUp size={18}/>, path: '/compras' },
      ]
    },
    {
      title: "Configuración",
      items: [
        { id: 'config', label: 'Ajustes Sistema', icon: <Settings size={18}/>, path: '/configuracion' }
      ]
    }
  ];

  const sidebarClasses = `
    w-64 fixed h-full bg-white dark:bg-black border-r border-slate-200 dark:border-white/5 
    flex flex-col z-[1000] transition-all duration-500 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-[999] md:hidden transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Logo Section */}
        <div className="p-6 md:p-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center text-white dark:text-blue-600 p-1.5 rounded-xl bg-blue-600 dark:bg-blue-600/10 border border-blue-600 dark:border-blue-600/20 shadow-lg shadow-blue-600/20 dark:shadow-none">
               <PinoIcon size={24} />
             </div>
             <div className="flex flex-col leading-none">
               <span className="text-[17px] font-black text-slate-900 dark:text-white tracking-tighter">Inventario <span className="text-blue-600">PRO</span></span>
               <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-1 italic">Enterprise</span>
             </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-7 overflow-y-auto custom-scrollbar pt-2">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className="px-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 opacity-80">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map(item => (
                  <NavLink 
                    key={item.id} 
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) => `
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/5' 
                        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-white'}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-blue-600 dark:text-blue-600' : 'text-slate-400 dark:text-zinc-500'}>
                          {item.icon}
                        </span>
                        <span className="tracking-tight">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-slate-100 dark:border-white/5 space-y-2 bg-white dark:bg-black">
           <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-slate-100 dark:border-white/5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/5">
                <Layers size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-none capitalize">{getUserName()}</span>
                <span className="text-[9px] text-slate-500 dark:text-zinc-500 mt-0.5">Admin Central</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="h-10 flex items-center justify-center gap-2 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg text-[10px] font-bold text-slate-500 dark:text-zinc-400 transition-all border border-slate-200 dark:border-white/5"
              >
                  {darkMode ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-slate-600" />}
                  <span className="uppercase text-[9px]">Tema</span>
              </button>
              <button 
                onClick={handleLogout}
                className="h-10 flex items-center justify-center gap-2 bg-white dark:bg-black hover:bg-blue-600 dark:hover:bg-blue-600/10 hover:text-blue-600 rounded-lg text-[10px] font-bold text-slate-500 dark:text-zinc-400 transition-all border border-slate-200 dark:border-white/5"
              >
                  <LogOut size={14} /> 
                  <span className="uppercase text-[9px]">Salir</span>
              </button>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
