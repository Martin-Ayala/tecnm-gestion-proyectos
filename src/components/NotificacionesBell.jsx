import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function NotificacionesBell() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotificaciones = async () => {
      const { data } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', user.id)
        .order('creado_en', { ascending: false })
        .limit(10);
      setNotificaciones(data || []);
    };

    fetchNotificaciones();

    const canal = supabase
      .channel('notificaciones-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `usuario_id=eq.${user.id}`
      }, (payload) => {
        setNotificaciones((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    const handleClickFuera = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);

    return () => {
      supabase.removeChannel(canal);
      document.removeEventListener('mousedown', handleClickFuera);
    };
  }, [user]);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const toggleNotificaciones = async () => {
    const nuevoEstado = !open;
    setOpen(nuevoEstado);

    if (nuevoEstado && noLeidas > 0) {
      const ids = notificaciones.filter(n => !n.leida).map(n => n.id);
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .in('id', ids);

      setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button"
        onClick={toggleNotificaciones} 
        className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-100 font-semibold text-xs text-slate-700 uppercase tracking-wide flex justify-between items-center">
            <span>Notificaciones</span>
            <span className="text-[11px] text-slate-400 font-normal">Recientes</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 bg-white">
            {notificaciones.length === 0 ? (
              <p className="p-5 text-center text-xs text-slate-400 bg-white">
                Sin notificaciones registradas.
              </p>
            ) : (
              notificaciones.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 text-xs border-l-4 transition-colors ${
                    !n.leida 
                      ? 'bg-blue-50/70 border-blue-500 font-medium' 
                      : 'bg-white border-transparent text-slate-700'
                  }`}
                >
                  <p className="text-slate-800 leading-relaxed">{n.mensaje}</p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    {new Date(n.creado_en).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}