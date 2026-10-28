import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ActualizarPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleActualizar = async (e) => {
    e.preventDefault();
    setLoading(true);

    // updateUser actualiza al usuario que acaba de ser validado por el enlace del correo
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      alert("Error al actualizar la contraseña: " + error.message);
    } else {
      alert("¡Tu contraseña ha sido actualizada con éxito!");
      navigate('/dashboard'); // O envíalo al /login
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Crea tu nueva contraseña</h2>
        
        <form onSubmit={handleActualizar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
            <input 
              type="password" 
              required 
              minLength="6"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-medium py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}