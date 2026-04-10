import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (sales = [], products = [], categories = [], purchases = [], autoSave = true) => {
  const workbook = XLSX.utils.book_new();

  // 1. RESUMEN EJECUTIVO
  const totalRev = sales.reduce((acc, s) => acc + (s.total_sale_pen || 0), 0);
  const totalProf = sales.reduce((acc, s) => acc + (s.profit_pen || 0), 0);
  const totalInvValue = products.reduce((acc, p) => acc + (p.stock * p.cost_pen || 0), 0);
  
  const summaryData = [
    { 'REPORTE MAESTRO': 'ESTADO FINANCIERO DEL SISTEMA', 'VALOR': '' },
    { 'REPORTE MAESTRO': '---------------------------', 'VALOR': '' },
    { 'REPORTE MAESTRO': 'Total Ingresos Brutos', 'VALOR': `S/ ${totalRev.toLocaleString()}` },
    { 'REPORTE MAESTRO': 'Utilidad Neta Total', 'VALOR': `S/ ${totalProf.toLocaleString()}` },
    { 'REPORTE MAESTRO': 'Inversión Total en Stock', 'VALOR': `S/ ${totalInvValue.toLocaleString()}` },
    { 'REPORTE MAESTRO': 'Rendimiento sobre Ventas', 'VALOR': totalRev > 0 ? ((totalProf/totalRev)*100).toFixed(2) + '%' : '0%' },
    { 'REPORTE MAESTRO': 'Items con Stock Crítico', 'VALOR': products.filter(p => p.stock < 5).length },
    { 'REPORTE MAESTRO': 'Fecha de Generación', 'VALOR': new Date().toLocaleString() }
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'RESUMEN');

  // 2. VENTAS GENERALES (DETALLE MAESTRO)
  const salesData = sales.map(s => ({
    'ID': s.id?.slice(0,8),
    'FECHA': new Date(s.date).toLocaleDateString(),
    'HORA': new Date(s.date).toLocaleTimeString(),
    'PRODUCTO': s.products?.name || 'N/A',
    'MARCA': s.products?.brand || 'N/A',
    'CATEGORÍA': s.products?.category || 'Otros',
    'UNIDADES': s.quantity,
    'P. VENTA (S/)': s.sale_price_pen,
    'TOTAL VENTA (S/)': s.total_sale_pen,
    'COSTO REF (S/)': (s.cost_pen_at_time * s.quantity).toFixed(2),
    'GANANCIA (S/)': s.profit_pen.toFixed(2),
    '% MARGEN': s.total_sale_pen > 0 ? ((s.profit_pen / s.total_sale_pen) * 100).toFixed(1) + '%' : '0%'
  }));
  const salesSheet = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'VENTAS DETALLADAS');

  // 3. ANÁLISIS DE CATÁLOGO E INVENTARIO
  const invData = products.map(p => {
    const margin = p.suggested_price - p.cost_pen;
    return {
      'NOMBRE DEL ITEM': p.name,
      'PROVEEDOR/MARCA': p.brand,
      'CATEGORÍA': p.category,
      'EXISTENCIAS': p.stock,
      'ESTADO CRÍTICO': p.stock < 5 ? 'SI (BAJO)' : 'ÓPTIMO',
      'COSTO UNIT. (S/)': p.cost_pen.toFixed(2),
      'P. VENTA SUGERIDO': p.suggested_price.toFixed(2),
      'UTILIDAD ESPERADA': margin.toFixed(2),
      '% RENTABILIDAD': p.suggested_price > 0 ? ((margin / p.suggested_price) * 100).toFixed(1) + '%' : '0%',
      'VALOR TOTAL EN ALMACÉN': (p.stock * p.cost_pen).toFixed(2)
    };
  });
  const invSheet = XLSX.utils.json_to_sheet(invData);
  XLSX.utils.book_append_sheet(workbook, invSheet, 'CATALOGO E INVENTARIO');

  // 4. HISTORIAL DE ABASTECIMIENTO (COMPRAS)
  const purchasesData = purchases.map(p => ({
    'FECHA DE COMPRA': new Date(p.date).toLocaleDateString(),
    'PRODUCTO': p.products?.name || 'N/A',
    'CANTIDAD ENTRANTE': p.quantity,
    'COSTO UNIT. (S/)': p.cost_pen,
    'INVERSIÓN TOTAL': (p.quantity * p.cost_pen).toFixed(2),
    'MONEDA ORIGEN': p.currency,
    'PAGO EN ORIGEN': p.currency === 'CLP' ? p.cost_clp.toLocaleString() : p.cost_pen.toLocaleString()
  }));
  const purchasesSheet = XLSX.utils.json_to_sheet(purchasesData);
  XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'HISTORIAL COMPRAS');

  // 5. VENTAS POR CATEGORÍA
  categories.forEach(cat => {
    const catSales = sales.filter(s => s.products?.category === cat.name);
    if (catSales.length > 0) {
      const catData = catSales.map(s => ({
        'FECHA': new Date(s.date).toLocaleDateString(),
        'ITEM': s.products?.name,
        'CANT': s.quantity,
        'TOTAL S/': s.total_sale_pen,
        'UTILIDAD S/': s.profit_pen
      }));
      const catSheet = XLSX.utils.json_to_sheet(catData);
      XLSX.utils.book_append_sheet(workbook, catSheet, cat.name.slice(0, 31));
    }
  });

  // Generación final
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  if (autoSave) {
    saveAs(data, `REPORTE_INVENTARIO_MAESTRO_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  }

  return data;
};
