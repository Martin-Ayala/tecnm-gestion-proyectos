import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Primero declaramos la función
  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) console.error("Error al obtener perfil:", error);

    // CORRECCIÓN: Si hay datos los combinamos. Si la base de datos bloquea
    // la lectura (RLS), al menos guardamos los datos básicos de la sesión
    // para evitar que el usuario se quede atrapado en el Login.
    if (data) {
      setUser({ ...authUser, ...data });
    } else {
      setUser(authUser);
    }
    setLoading(false);
  };

  // 2. Luego usamos la función dentro del useEffect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);