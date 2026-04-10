import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { ModalProvider } from './context/ModalContext';
import Sidebar from './components/Layout/Sidebar';
import GlobalModals from './components/Modals/GlobalModals';
import LoginPage from './pages/LoginPage';

// Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import CatalogPage from './pages/Catalog/CatalogPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import SalesPage from './pages/Sales/SalesPage';
import PurchasesPage from './pages/Purchases/PurchasesPage';
import SettingsPage from './pages/Settings/SettingsPage';

import { Menu } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useInventory();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsFirstLoad(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (!user) return <LoginPage />;

  return (
    <Router>
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans antialiased overflow-x-hidden">
        <Sidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          isMobileOpen={isMobileOpen} 
          setIsMobileOpen={setIsMobileOpen}
        />
        
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-[500] w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Menu size={18} onClick={() => setIsMobileOpen(true)} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Control Maestro</span>
            </div>
            <div className="flex items-center gap-3">
               {/* Small status or user info could go here */}
            </div>
        </div>

        <main className="flex-1 flex flex-col items-center md:ml-64">
          <div className="w-full max-w-7xl p-4 md:p-12">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/inventario" element={<InventoryPage />} />
              <Route path="/ventas" element={<SalesPage />} />
              <Route path="/compras" element={<PurchasesPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
        
        <GlobalModals />
      </div>
    </Router>
  );
};

function App() {
  return (
    <InventoryProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </InventoryProvider>
  );
}

export default App;
