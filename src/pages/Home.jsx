import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext'; // <-- 1. Importamos tu contexto

export default function Home() {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // <-- 2. Extraemos al usuario para saber si hay sesión activa

    useEffect(() => {
        const fetchProyectosPublicos = async () => {
            const { data, error } = await supabase
                .from('proyectos')
                .select('*, investigador:usuarios!investigador_id(nombre_completo)')
                .eq('estado', 'Activo')
                .order('fecha_creacion', { ascending: false });

            if (error) console.error("Error cargando proyectos públicos:", error);
            else setProyectos(data);
            
            setLoading(false);
        };
        fetchProyectosPublicos();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-600 font-sans">
            {/* BARRA DE NAVEGACIÓN */}
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <h1 className="text-2xl font-bold text-blue-900 tracking-wide">
                            TecNM <span className="text-blue-600">Felipe Carrillo Puerto</span>
                        </h1>
                        <div className="hidden md:flex gap-6 text-sm font-medium">
                            <a href="#proyectos" className="text-slate-600 hover:text-blue-600 transition-colors">Proyectos</a>
                            <a href="#comite" className="text-slate-600 hover:text-blue-600 transition-colors">Comité Revisor</a>
                            <a href="#fechas" className="text-slate-600 hover:text-blue-600 transition-colors">Fechas Importantes</a>
                        </div>
                    </div>
                    
                    {/* 3. Lógica dinámica: Cambia la ruta y el texto dependiendo de si hay usuario */}
                    <Link
                        to={user ? "/dashboard" : "/login"}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 px-5 py-2 rounded-md font-medium hover:bg-blue-600 hover:text-white transition-all text-sm"
                    >
                        {user ? "Ir al Dashboard →" : "Acceso al Sistema"}
                    </Link>
                </div>
            </nav>

            {/* HEADER / BUSCADOR */}
            <header className="max-w-7xl mx-auto px-6 py-12 md:py-20 text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-8">
                    Propuestas de Investigación 2026
                </h2>
                <div className="flex flex-col md:flex-row gap-4 max-w-3xl">
                    <input
                        type="text"
                        placeholder="Búsqueda de propuestas o investigadores..."
                        className="flex-1 bg-white border border-slate-300 rounded-md px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                    />
                    <button className="bg-blue-600 border border-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium">
                        Buscar
                    </button>
                </div>
            </header>

            {/* CUADRÍCULA DE PROYECTOS */}
            <main id="proyectos" className="max-w-7xl mx-auto px-6 pb-20">
                <h3 className="text-xl font-semibold text-slate-800 text-center mb-10">Listado de Proyectos Disponibles</h3>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Cargando catálogo de proyectos...</div>
                ) : proyectos.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-white border border-slate-200 rounded-lg">
                        Aún no hay propuestas activas publicadas para este periodo.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {proyectos.map((proyecto) => (
                            <div key={proyecto.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all flex flex-col h-full">
                                <h4 className="text-lg font-bold text-slate-800 text-center mb-6 leading-snug">
                                    {proyecto.titulo}
                                </h4>
                                <div className="space-y-2 text-sm text-center mb-8 flex-grow">
                                    <p><span className="text-slate-500">Institución:</span> TecNM Campus Felipe Carrillo Puerto</p>
                                    <p><span className="text-slate-500">Investigador:</span> <span className="text-slate-700 font-medium uppercase">{proyecto.investigador?.nombre_completo}</span></p>
                                    <p><span className="text-slate-500">Estado:</span> <span className="text-emerald-600 font-medium">Disponible</span></p>
                                </div>
                                <button className="w-full py-2.5 bg-slate-50 text-blue-600 border border-slate-200 font-medium rounded-md hover:bg-blue-50 transition-colors text-sm">
                                    Ver Detalle
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="border-t border-slate-200 bg-white py-10">
                <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
                    <p>© 2026 Tecnológico Nacional de México Campus Felipe Carrillo Puerto.</p>
                    <p className="mt-2">Sistema de Gestión de Proyectos de Investigación.</p>
                </div>
            </footer>
        </div>
    );
}