import fs from 'fs';
const path = 'd:\\Programas\\Inventario-S\\src\\pages\\Catalog\\CatalogPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// Injection for handleProductSubmit UI
const uiOld = /<p className="text-2xl font-black text-indigo-600 font-mono">[\s\S]*?<\/p>\s*?<\/div>\s*?<\/div>/;
const uiNew = `<p className="text-2xl font-black text-indigo-600 font-mono">
                    S/ {(
                      (productForm.suggested_price || 0) - 
                      (productForm.currency === 'PEN' ? (productForm.cost_pen || 0) : ((productForm.cost_clp || 0) * (parseFloat(settings.exchange_rate) || 0.0039)))
                    ).toFixed(2)}
                 </p>
              </div>
            </div>

            {!editingProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Stock Inicial</label>
                    <div className="relative group/field">
                      <Package size={16} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within/field:text-indigo-600 transition-all font-mono" />
                      <input 
                        type="number" 
                        className="w-full h-14 bg-slate-50 dark:bg-slate-950 pl-16 pr-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none tabular-nums shadow-inner transition-all h-16" 
                        value={productForm.stock || ''} 
                        onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} 
                        placeholder="0"
                      />
                    </div>
                </div>
                <div className="flex items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight italic max-w-xs">
                    * El stock inicial generará automáticamente un registro en el historial de compras.
                  </p>
                </div>
              </div>
            )}`;

if (uiOld.test(content)) {
    content = content.replace(uiOld, uiNew);
    fs.writeFileSync(path, content);
    console.log('File CatalogPage.jsx UI updated successfully');
} else {
    console.error('Could not find target UI in CatalogPage.jsx');
}
