import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// 1. Importamos el AuthProvider además del useAuth
import { AuthProvider, useAuth } from './context/AuthContext'; 
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login'; 

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
    // 2. ENVOLVEMOS TODO EL ENRUTADOR CON EL PROVEEDOR
    // Esto "enciende" el contexto global para que Login, Home y Dashboard compartan al usuario
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
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