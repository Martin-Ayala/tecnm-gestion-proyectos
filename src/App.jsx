import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import ProyectoDetalle from './pages/ProyectoDetalle';
import RecuperarPassword from './pages/RecuperarPassword';
import ActualizarPassword from './pages/ActualizarPassword';
import Perfil from './pages/Perfil';
import Directorio from './pages/Directorio';

const RutaProtegida = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Verificando credenciales...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/actualizar-password" element={<ActualizarPassword />} />
          <Route path="/proyecto/:id" element={<ProyectoDetalle />} />
          
          <Route path="/perfil" element={
            <RutaProtegida>
              <Perfil />
            </RutaProtegida>
          } />

          <Route path="/directorio" element={
            <RutaProtegida>
              <Directorio />
            </RutaProtegida>
          } />

          <Route path="/dashboard" element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}