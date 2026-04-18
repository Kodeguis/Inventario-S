import fs from 'fs';
const path = 'd:\\Programas\\Inventario-S\\src\\components\\Modals\\GlobalModals.jsx';
let content = fs.readFileSync(path, 'utf8');

// Injection for handleProductSubmit UI
// Matching the block before the button
const uiOld = /<div className="space-y-2">\s*<label className="text-\[10px\] font-black uppercase tracking-\[0\.2em\] text-slate-400 ml-1">Precio de Venta Sugerido \(S\/\)<\/label>[\s\S]*?<input [\s\S]*?\/>\s*?<\/div>\s*?<\/div>/;
const uiNew = `<div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Precio de Venta Sugerido (S/)</label>
               <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-focus-within/field:text-emerald-500 transition-colors uppercase font-mono">PEN</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full h-14 bg-slate-50 dark:bg-slate-900 pl-16 pr-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-emerald-500/20 outline-none tabular-nums shadow-inner transition-all"
                    value={productForm.suggested_price || ''}
                    onChange={e => setProductForm({...productForm, suggested_price: parseFloat(e.target.value)})}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Stock Inicial</label>
                  <div className="relative group">
                    <Hash size={16} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:text-indigo-600 transition-all font-mono" />
                    <input
                      type="number"
                      className="w-full h-14 bg-slate-50 dark:bg-slate-900 pl-16 pr-8 text-xl font-black rounded-2xl border-2 border-transparent focus:border-indigo-500/20 outline-none tabular-nums shadow-inner transition-all h-16"
                      value={productForm.stock || ''}
                      onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
              </div>
              <div className="flex items-center">
                 <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight italic max-w-xs">
                   * Se registrará automáticamente como una compra inicial.
                 </p>
              </div>
            </div>`;

if (uiOld.test(content)) {
    content = content.replace(uiOld, uiNew);
    fs.writeFileSync(path, content);
    console.log('File GlobalModals.jsx updated successfully');
} else {
    // Try a simpler regex if it fails
    console.error('Could not find target UI in GlobalModals.jsx');
}
