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

const AppContent = () => {
  const { user, loading } = useInventory();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 animate-pulse">Iniciando Protocolos...</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <Router>
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300 antialiased overflow-x-hidden">
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="ml-64 flex-1 flex flex-col items-center">
          <div className="w-full max-w-7xl p-8 md:p-12">
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
