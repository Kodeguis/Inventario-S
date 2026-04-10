import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ exchange_rate: '0.0039' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData();
      else setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) fetchData();
      else {
        setProducts([]);
        setSales([]);
        setCategories([]);
        setPurchases([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (silent = false) => {
    // Solo mostramos el cargador si no tenemos ningún dato todavía
    const isFirstLoad = products.length === 0 && sales.length === 0;
    if (!silent && isFirstLoad) setLoading(true);
    try {
      const [
        { data: p },
        { data: s },
        { data: stRows },
        { data: c },
        { data: pu }
      ] = await Promise.all([
        supabase.from('products').select('*').order('name', { ascending: true }),
        supabase.from('sales').select('*, products(name, brand, category)').order('date', { ascending: false }),
        supabase.from('settings').select('*'),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('purchases').select('*, products(name, brand, category)').order('date', { ascending: false })
      ]);

      setProducts(p || []);
      setProducts(p || []);
      
      // Flatten sales data
      const flattenedSales = (s || []).map(item => ({
        ...item,
        product_name: item.products?.name || 'Producto Eliminado',
        product_category: item.products?.category || 'General'
      }));
      setSales(flattenedSales);

      setCategories(c || []);

      // Flatten purchases data
      const flattenedPurchases = (pu || []).map(item => ({
        ...item,
        product_name: item.products?.name || 'Producto Eliminado',
        product_category: item.products?.category || 'General'
      }));
      setPurchases(flattenedPurchases);

      if (stRows) {
        const stObj = {};
        stRows.forEach(r => stObj[r.key] = r.value);
        if (stObj.exchange_rate) setSettings(stObj);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = (silent = false) => fetchData(silent);

  const value = {
    user,
    products,
    sales,
    purchases,
    categories,
    settings,
    loading,
    refreshData,
    setSettings
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
