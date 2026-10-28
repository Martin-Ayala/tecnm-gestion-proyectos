import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState('Estudiante');
  
  // Campos dinámicos
  const [telefono, setTelefono] = useState('');
  const [numeroControl, setNumeroControl] = useState('');
  const [carrera, setCarrera] = useState('Ingeniería en Sistemas Computacionales');
  const [gradoAcademico, setGradoAcademico] = useState('Ing.');

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
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        
      } else {
        // VALIDACIÓN DE CONTRASEÑA EN REGISTRO
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        // REGISTRO
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.user) {
          // Preparamos los datos básicos
          const usuarioData = {
            id: data.user.id,
            nombre_completo: nombreCompleto,
            rol: rol,
            correo_institucional: email,
            institucion_plantel: 'TecNM Campus Felipe Carrillo Puerto',
            telefono: telefono || null
          };

          // Añadimos campos específicos según el rol
          if (rol === 'Estudiante') {
            usuarioData.numero_control = numeroControl;
            usuarioData.carrera = carrera;
          } else {
            usuarioData.grado_academico = gradoAcademico;
          }

          const { error: dbError } = await supabase.from('usuarios').insert([usuarioData]);
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative py-12">
      <Link to="/" className="absolute top-6 left-6 text-slate-500 hover:text-blue-600 font-medium flex items-center gap-2">
        ← Volver al inicio
      </Link>
      
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl mt-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          {isLogin ? 'Bienvenido de vuelta' : 'Crear una cuenta'}
        </h2>
        <p className="text-slate-500 text-center mb-8">
          Portal de Proyectos TecNM Felipe Carrillo Puerto
        </p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-4 border-b border-slate-100 pb-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol en el Instituto</label>
                <select 
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                >
                  <option value="Estudiante">Estudiante</option>
                  <option value="Investigador">Docente / Investigador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="Ej. Juan Pérez López"
                />
              </div>

              {/* CAMPOS DINÁMICOS ESTUDIANTE */}
              {rol === 'Estudiante' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">No. Control</label>
                      <input 
                        type="text" 
                        required
                        value={numeroControl}
                        onChange={(e) => setNumeroControl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Ej. 2210013"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                      <input 
                        type="tel" 
                        required
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="10 dígitos"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Carrera</label>
                    <select 
                      value={carrera}
                      onChange={(e) => setCarrera(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="Ingeniería en Sistemas Computacionales">Ing. en Sistemas Computacionales</option>
                      <option value="Ingeniería en Gestión Empresarial">Ing. en Gestión Empresarial</option>
                      <option value="Ingeniería Industrial">Ing. Industrial</option>
                      <option value="Ingeniería en Administración">Ing. en Administración</option>
                      <option value="Ingeniería en Industrias Alimentarias">Ing. en Industrias Alimentarias</option>
                    </select>
                  </div>
                </>
              )}

              {/* CAMPOS DINÁMICOS DOCENTE */}
              {rol === 'Investigador' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grado Académico</label>
                    <select 
                      value={gradoAcademico}
                      onChange={(e) => setGradoAcademico(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="Ing.">Ingeniero (Ing.)</option>
                      <option value="Lic.">Licenciado (Lic.)</option>
                      <option value="Mtro.">Maestro (Mtro.)</option>
                      <option value="Mtra.">Maestra (Mtra.)</option>
                      <option value="Dr.">Doctor (Dr.)</option>
                      <option value="Dra.">Doctora (Dra.)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <input 
                      type="tel" 
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="10 dígitos"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAMPOS DE CREDENCIALES (Siempre visibles) */}
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
          
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-4 pr-12 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0l1.42 1.42m1.42 1.42l4.243 4.243m4.242 4.242L21 21m-3.286-3.286l-1.42-1.42m-1.42-1.42l-4.243-4.243m-1.42 1.42a10.052 10.052 0 00-3.02-1.563M12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            
            {/* ENLACE DE RECUPERACIÓN DE CONTRASEÑA (Solo visible en Login) */}
            {isLogin && (
              <div className="text-right mt-2">
                <Link to="/recuperar-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="••••••••"
              />
            </div>
          )}

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