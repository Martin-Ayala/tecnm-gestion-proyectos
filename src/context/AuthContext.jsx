import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedUser = useRef(false);

  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      hasLoadedUser.current = false;
      setUser(null);
      setLoading(false);
      return;
    }

    // Activa loading solo en el inicio de sesión inicial (sin parpadeos al cambiar de pestaña)
    if (!hasLoadedUser.current) {
      setLoading(true);
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

    hasLoadedUser.current = true;
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
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);