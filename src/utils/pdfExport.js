import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportCatalogToPDF = (products = [], categories = []) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

  // 1. ESTILOS Y COLORES
  const primaryColor = [30, 41, 59]; // Slate 800
  const accentColor = [37, 99, 235]; // Blue 600

  // 2. ENCABEZADO BRANDED
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CATÁLOGO DE PRODUCTOS', 15, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Control Maestro de Inventario - Sistema Pino', 15, 32);

  doc.setTextColor(200, 200, 200);
  const dateStr = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Fecha de emisión: ${dateStr}`, pageWidth - 15, 32, { align: 'right' });

  // 3. TABLA DE PRODUCTOS POR CATEGORÍA
  let finalY = 45;

  // Agrupamos por categoría para un diseño más organizado
  const categoriesInUse = [...new Set(products.map(p => p.category))].sort();

  categoriesInUse.forEach((catName) => {
    const catProducts = products.filter(p => p.category === catName);
    if (catProducts.length === 0) return;

    // Título de Categoría
    doc.setTextColor(...accentColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(catName.toUpperCase(), 15, finalY + 10);
    
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(15, finalY + 12, 60, finalY + 12);

    const tableRows = catProducts.map(p => [
      p.name.toUpperCase(),
      p.brand || 'GENÉRICO',
      `S/ ${(p.suggested_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: finalY + 15,
      head: [['PRODUCTO', 'MARCA / LABORATORIO', 'PRECIO DE VENTA']],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: [255, 255, 255], 
        fontSize: 9, 
        halign: 'center',
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 90, fontSize: 8, fontStyle: 'bold' },
        1: { cellWidth: 50, fontSize: 8, halign: 'center' },
        2: { cellWidth: 40, fontSize: 10, halign: 'right', fontStyle: 'bold', textColor: accentColor }
      },
      styles: { 
        font: 'helvetica', 
        cellPadding: 4,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate 50
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Marcador de página si es necesario
      }
    });

    finalY = doc.lastAutoTable.finalY + 10;

    // Salto de página si la siguiente categoría no cabe
    if (finalY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      finalY = 15;
    }
  });

  // 4. PIE DE PÁGINA PROFESIONAL
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Este catálogo es solo para fines informativos | Precios sujetos a cambios sin previo aviso.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  }

  // 5. GUARDAR
  doc.save(`CATALOGO_CLIENTES_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  }
};
