import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToExcel = (sales = [], products = [], categories = []) => {
  const workbook = XLSX.utils.book_new();

  // 1. Sales Sheet
  const salesData = sales.map(s => ({
    'ID': s.id.slice(0,8),
    'Fecha': new Date(s.date).toLocaleString(),
    'Producto': s.products?.name || 'N/A',
    'Categoría': s.products?.category || 'Otros',
    'Unidades': s.quantity,
    'Precio Venta (S/)': s.sale_price_pen,
    'Total Venta (S/)': s.total_sale_pen,
    'Costo Ref (S/)': s.cost_pen_at_time * s.quantity,
    'Ganancia (S/)': s.profit_pen
  }));
  const salesSheet = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'Ventas General');

  // 2. Sheets by Category
  categories.forEach(cat => {
    const catSales = sales.filter(s => s.products?.category === cat.name);
    if (catSales.length > 0) {
      const catData = catSales.map(s => ({
        'Fecha': new Date(s.date).toLocaleDateString(),
        'Producto': s.products?.name,
        'Cant': s.quantity,
        'Venta': s.total_sale_pen,
        'Utilidad': s.profit_pen
      }));
      const catSheet = XLSX.utils.json_to_sheet(catData);
      XLSX.utils.book_append_sheet(workbook, catSheet, cat.name.slice(0, 31));
    }
  });

  // 3. Inventory Sheet
  const invData = products.map(p => ({
    'Ítem': p.name,
    'Marca': p.brand,
    'Stock': p.stock,
    'Costo CLP': p.cost_clp,
    'Costo PEN': p.cost_pen,
    'Moneda base': p.currency
  }));
  const invSheet = XLSX.utils.json_to_sheet(invData);
  XLSX.utils.book_append_sheet(workbook, invSheet, 'Inventario Actual');

  // Generate and save
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, `Reporte_Inventario_${new Date().toLocaleDateString()}.xlsx`);
};
