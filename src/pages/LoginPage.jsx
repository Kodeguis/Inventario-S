import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, User, Lock, Loader2 } from 'lucide-react';
import PinoIcon from '../components/Common/PinoIcon';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Trick: if user only types "sergio", we use "sergio@sistema.com"
    const finalEmail = email.includes('@') ? email : `${email}@sistema.com`;

    const { error } = await supabase.auth.signInWithPassword({ 
      email: finalEmail, 
      password 
    });
    if (error) setError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans antialiased selection:bg-indigo-500/30">
      {/* Abstract Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] space-y-10">
          <div className="space-y-4 text-center">
            <div className="flex justify-center animate-in zoom-in duration-500 text-indigo-500 hover:scale-105 transition-transform">
               <PinoIcon size={100} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Pino</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Acceso Restringido • v.1.0</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-indigo-400 transition-colors">Usuario Maestro</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                  <input 
                    type="text" 
                    required 
                    className="w-full h-15 bg-white/5 border border-white/5 rounded-2xl px-16 text-sm font-bold text-white outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all placeholder:text-slate-600 uppercase" 
                    placeholder="EJ: SERGIO"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-indigo-400 transition-colors">Contraseña Maestra</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                  <input 
                    type="password" 
                    required 
                    className="w-full h-15 bg-white/5 border border-white/5 rounded-2xl px-16 text-sm font-bold text-white outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500/30 transition-all placeholder:text-slate-600" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-[11px] font-bold text-rose-500 uppercase tracking-widest text-center animate-in shake duration-300">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Autorizar Acceso</span>
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform"/>
                </>
              )}
            </button>
          </form>

          <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest">
            © 2026 Sistema de Gestión de Activos • Seguridad Encriptada
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
