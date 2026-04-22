import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = { env: {} };
}

export const exportToExcel = async (sales = [], products = [], categories = [], purchases = [], batches = [], autoSave = true) => {
  try {
    const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Inventario Pro';
  workbook.lastModifiedBy = 'Usuario Sistema';
  workbook.created = new Date();

  // Helper for safe numbers
  const safeNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : Math.round((n + Number.EPSILON) * 100) / 100;
  };

  // Helper for safe dates
  const safeDate = (val) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d;
  };

  // Define Common Styles
  const headerStyle = {
    font: { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }, // Slate 800
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: { bottom: { style: 'thin', color: { argb: 'FF334155' } } }
  };

  const titleStyle = {
    font: { name: 'Segoe UI', bold: true, size: 16, color: { argb: 'FF0F172A' } },
    alignment: { vertical: 'middle', horizontal: 'left' }
  };

  const zebraStyle = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } } // Slate 50
  };

  // 1. DATA PROCESSING
  const totalRev = sales.reduce((acc, s) => acc + safeNum(s.total_sale_pen), 0);
  const totalProf = sales.reduce((acc, s) => acc + safeNum(s.profit_pen), 0);
  const currentInvValue = products.reduce((acc, p) => acc + (safeNum(p.stock) * safeNum(p.cost_pen)), 0);
  const totalPurchasedValue = purchases.reduce((acc, p) => acc + (safeNum(p.quantity) * safeNum(p.cost_pen)), 0);

  // Financial Milestones
  const firstInvestmentDate = purchases.length > 0 ? new Date(Math.min(...purchases.map(p => new Date(p.date)))) : null;
  const daysOfOperation = firstInvestmentDate ? Math.max(1, Math.ceil((new Date() - firstInvestmentDate) / (1000 * 60 * 60 * 24))) : 0;

  // --- SHEET 1: DASHBOARD EJECUTIVO ---
  const dash = workbook.addWorksheet('RESUMEN EJECUTIVO', { views: [{ showGridLines: false }] });
  
  dash.addRow(['']).height = 20;
  const titleRow = dash.addRow(['  INFORME DE RENDIMIENTO EMPRESARIAL']);
  titleRow.height = 40;
  dash.mergeCells('A2:F2');
  dash.getCell('A2').style = titleStyle;

  dash.addRow(['  Análisis consolidado de crecimiento, inversión y flujo de caja operativo.']).height = 25;
  dash.mergeCells('A3:F3');
  dash.getCell('A3').font = { italic: true, color: { argb: 'FF64748B' } };

  dash.addRow([]); // Spacer

  // KPI Boxes (Simulated)
  const kpiRow = dash.addRow(['', 'INGRESOS TOTALES', 'UTILIDAD REAL', 'VALOR ACTIVO', 'CAPITAL MOVILIZADO']);
  kpiRow.height = 30;
  ['B', 'C', 'D', 'E'].forEach(cell => {
    kpiRow.getCell(cell).style = headerStyle;
    kpiRow.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
  });

  const valRow = dash.addRow(['', totalRev, totalProf, currentInvValue, totalPurchasedValue]);
  valRow.height = 40;
  ['B', 'C', 'D', 'E'].forEach(cell => {
    valRow.getCell(cell).font = { bold: true, size: 14, name: 'Segoe UI' };
    valRow.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  valRow.getCell('B').numFmt = '"S/ "#,##0.00';
  valRow.getCell('C').numFmt = '"S/ "#,##0.00';
  valRow.getCell('D').numFmt = '"S/ "#,##0.00';
  valRow.getCell('E').numFmt = '"S/ "#,##0.00';

  dash.addRow([]); 

  // MODIFICACIÓN: LÍNEA DE TIEMPO Y HITOS
  const milestoneHeader = dash.addRow(['', 'HITOS Y TIEMPO DE OPERACIÓN']);
  milestoneHeader.getCell('B').font = { bold: true, size: 12, color: { argb: 'FF3B82F6' } };
  
  const m1 = dash.addRow(['', 'PRIMERA INVERSIÓN REGISTRADA', firstInvestmentDate ? firstInvestmentDate.toLocaleDateString('es-ES') : 'Sin registros']);
  const m2 = dash.addRow(['', 'TIEMPO TOTAL DE OPERACIÓN', daysOfOperation + ' días']);
  const m3 = dash.addRow(['', 'VENTA PROMEDIO DIARIA', safeNum(totalRev / (daysOfOperation || 1))]);
  [m1, m2, m3].forEach(r => {
    r.getCell('B').font = { bold: true, color: { argb: 'FF64748B' }, size: 9 };
    r.getCell('C').alignment = { horizontal: 'right' };
  });
  m3.getCell('C').numFmt = '"S/ "#,##0.00';

  dash.addRow([]); dash.addRow([]); 

  // Table Categoría Header
  const catHeader = dash.addRow(['', 'ESTADÍSTICAS POR CATEGORÍA']);
  catHeader.getCell('B').font = { bold: true, size: 12 };
  
  const catListHeader = dash.addRow(['', 'CATEGORÍA', 'VENTAS (S/)', 'GANANCIA (S/)', 'STOCK (UNDS)']);
  ['B', 'C', 'D', 'E'].forEach(c => catListHeader.getCell(c).style = headerStyle);

  categories.forEach((cat, index) => {
    const row = dash.addRow([
      '',
      cat.name,
      sales.filter(s => (s.product_category || s.products?.category) === cat.name).reduce((acc, s) => acc + safeNum(s.total_sale_pen), 0),
      sales.filter(s => (s.product_category || s.products?.category) === cat.name).reduce((acc, s) => acc + safeNum(s.profit_pen), 0),
      products.filter(p => p.category === cat.name).reduce((acc, p) => acc + safeNum(p.stock), 0)
    ]);
    if (index % 2 !== 0) row.eachCell(c => { if(c.col > 1) c.fill = zebraStyle.fill; });
    row.getCell('C').numFmt = '#,##0.00';
    row.getCell('D').numFmt = '#,##0.00';
  });

  dash.getColumn(2).width = 40;
  dash.getColumn(3).width = 25;
  dash.getColumn(4).width = 25;
  dash.getColumn(5).width = 25;

  // --- SHEET 2: VENTAS ---
  const vSheet = workbook.addWorksheet('DETALLE DE VENTAS', { views: [{ xSplit: 1, ySplit: 1 }] });
  vSheet.columns = [
    { header: 'FECHA', key: 'date', width: 15 },
    { header: 'PRODUCTO', key: 'product', width: 45 },
    { header: 'CATEGORÍA', key: 'cat', width: 25 },
    { header: 'TANDA', key: 'batch', width: 20 },
    { header: 'CANTIDAD', key: 'qty', width: 12 },
    { header: 'PRECIO S/', key: 'price', width: 15 },
    { header: 'TOTAL S/', key: 'total', width: 15 },
    { header: 'GANANCIA S/', key: 'profit', width: 15 },
    { header: 'MARGEN %', key: 'margin', width: 15 }
  ];

  sales.forEach((s, i) => {
    const row = vSheet.addRow({
      date: safeDate(s.created_at || s.date),
      product: s.product_name || s.products?.name || 'N/A',
      cat: s.product_category || s.products?.category || 'Otros',
      batch: s.batch || '-',
      qty: safeNum(s.quantity),
      price: safeNum(s.sale_price_pen),
      total: safeNum(s.total_sale_pen),
      profit: safeNum(s.profit_pen),
      margin: s.total_sale_pen > 0 ? (s.profit_pen / s.total_sale_pen) : 0
    });
    if (i % 2 !== 0) row.fill = zebraStyle.fill;
    row.getCell('margin').numFmt = '0.0%';
    row.getCell('price').numFmt = '#,##0.00';
    row.getCell('total').numFmt = '#,##0.00';
    row.getCell('profit').numFmt = '#,##0.00';
    if (safeNum(s.profit_pen) < 0) row.getCell('profit').font = { color: { argb: 'FFFF0000' }, bold: true };
  });

  vSheet.getRow(1).eachCell(c => c.style = headerStyle);

  // --- SHEET 3: ANÁLISIS DE TANDAS ---
  const tSheet = workbook.addWorksheet('ANALISIS DE TANDAS');
  tSheet.columns = [
    { header: 'TANDA MAESTRA', key: 'name', width: 35 },
    { header: 'CATEGORÍAS', key: 'cats', width: 40 },
    { header: 'VENTA TOTAL', key: 'rev', width: 20 },
    { header: 'UTILIDAD', key: 'prof', width: 20 },
    { header: 'UNIDADES', key: 'units', width: 15 },
    { header: 'EFICIENCIA', key: 'eff', width: 15 }
  ];

  // Deduplicate and process batches
  const uniqueBatches = Array.from(new Map(batches.map(b => [b.name, b])).values());
  uniqueBatches.forEach((b, i) => {
    const bSales = sales.filter(s => s.batch === b.name);
    const rev = bSales.reduce((acc, s) => acc + safeNum(s.total_sale_pen), 0);
    const prof = bSales.reduce((acc, s) => acc + safeNum(s.profit_pen), 0);
    const cats = [...new Set(bSales.map(s => s.product_category || s.products?.category).filter(Boolean))].join(', ') || 'N/A';
    
    const row = tSheet.addRow({
      name: b.name,
      cats: cats,
      rev: rev,
      prof: prof,
      units: bSales.reduce((acc, s) => acc + safeNum(s.quantity), 0),
      eff: rev > 0 ? (prof / rev) : 0
    });
    if (i % 2 !== 0) row.fill = zebraStyle.fill;
    row.getCell('rev').numFmt = '#,##0.00';
    row.getCell('prof').numFmt = '#,##0.00';
    row.getCell('eff').numFmt = '0.0%';
  });
  tSheet.getRow(1).eachCell(c => c.style = headerStyle);

  // --- SHEET 4: BODEGA Y CAPITAL ---
  const invSheet = workbook.addWorksheet('BODEGA Y CAPITAL');
  invSheet.columns = [
    { header: 'NOMBRES DEL PRODUCTO', key: 'name', width: 50 },
    { header: 'CATEGORÍA', key: 'cat', width: 20 },
    { header: 'UNIDADES EN STOCK', key: 'stock', width: 20 },
    { header: 'COSTO UNITARIO S/', key: 'cost', width: 20 },
    { header: 'CAPITAL INMOVILIZADO S/', key: 'cap', width: 25 }
  ];

  products.filter(p => safeNum(p.stock) > 0).forEach((p, i) => {
    const stock = safeNum(p.stock);
    const row = invSheet.addRow({
      name: p.name,
      cat: p.category,
      stock: stock,
      cost: safeNum(p.cost_pen),
      cap: stock * safeNum(p.cost_pen)
    });
    if (i % 2 !== 0) row.fill = zebraStyle.fill;
    row.getCell('cost').numFmt = '#,##0.00';
    row.getCell('cap').numFmt = '#,##0.00';
  });
  invSheet.getRow(1).eachCell(c => c.style = headerStyle);

  // SAVE FILE
  const buffer = await workbook.xlsx.writeBuffer();
  if (autoSave) {
    saveAs(new Blob([buffer]), `REPORTE_EJECUTIVO_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  return buffer;
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    alert("Error: " + error.message);
  }
};
