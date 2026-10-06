import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState('Estudiante');

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // INICIO DE SESIÓN
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Retrasamos la navegación apenas 500ms para asegurar que el AuthContext 
        // ya actualizó sus datos globales antes de que el guardián nos revise.
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        
      } else {
        // REGISTRO
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.user) {
          const { error: dbError } = await supabase.from('usuarios').insert([
            {
              id: data.user.id,
              nombre_completo: nombreCompleto,
              rol: rol,
              correo_institucional: email,
              institucion_plantel: 'TecNM Campus Felipe Carrillo Puerto'
            }
          ]);
          if (dbError) throw dbError;
        }

        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        setIsLogin(true);
        setLoading(false);
      }
    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative">
      <Link to="/" className="absolute top-6 left-6 text-slate-500 hover:text-blue-600 font-medium flex items-center gap-2">
        ← Volver al inicio
      </Link>
      
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          {isLogin ? 'Bienvenido de vuelta' : 'Crear una cuenta'}
        </h2>
        <p className="text-slate-500 text-center mb-8">
          Portal de Proyectos TecNM Felipe Carrillo Puerto
        </p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol en el Instituto</label>
                <select 
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="Estudiante">Estudiante</option>
                  <option value="Investigador">Investigador / Docente</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Institucional</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="usuario@tecnm.mx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-4 shadow-sm"
          >
            {loading ? 'Procesando...' : (isLogin ? 'Ingresar al Sistema' : 'Registrarme')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'} {' '}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(''); 
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}