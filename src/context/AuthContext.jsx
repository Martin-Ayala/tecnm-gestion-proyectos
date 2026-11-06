import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  // El loading ya arranca en 'true' para la primera carga de la página
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser) => {
    // ❌ ELIMINAMOS el setLoading(true) de aquí para que no parpadee al cambiar de pestaña

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

    if (data) {
      setUser({ ...authUser, ...data });
    } else {
      setUser(authUser);
    }
    
    // Al terminar, siempre apagamos el loading (y se quedará apagado)
    setLoading(false);
  };

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
      {/* 2. VITAL: Dejamos pasar a los children siempre, el guardián de App.jsx decidirá qué mostrar */}
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);