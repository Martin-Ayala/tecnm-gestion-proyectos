import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Verificando sesión...</div>;
  
  if (!user) return <Navigate to="/" replace />;
  
  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) return <Navigate to="/dashboard" replace />;

  return children;
};