import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const OPCIONES_CARRERAS = [
  "Multidisciplinario (Todas las carreras)",
  "Ingeniería en Sistemas Computacionales",
  "Ingeniería en Gestión Empresarial",
  "Ingeniería Industrial",
  "Ingeniería en Administración",
  "Ingeniería en Industrias Alimentarias"
];

const OPCIONES_MODALIDAD = ["Presencial", "Híbrida", "Virtual"];

export default function Home() {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    
    // Estados para la barra de búsqueda y filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroModalidad, setFiltroModalidad] = useState('Todas');
    const [filtroCarrera, setFiltroCarrera] = useState('Todas');

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

    // Lógica de filtrado en tiempo real
    const proyectosFiltrados = proyectos.filter((proy) => {
        const textoBuscar = busqueda.toLowerCase();
        
        const coincideTexto = 
            proy.titulo?.toLowerCase().includes(textoBuscar) ||
            proy.investigador?.nombre_completo?.toLowerCase().includes(textoBuscar) ||
            (proy.planteamiento_problema || proy.descripcion)?.toLowerCase().includes(textoBuscar);

        const coincideModalidad = filtroModalidad === 'Todas' || proy.modalidad === filtroModalidad;
        const coincideCarrera = filtroCarrera === 'Todas' || proy.carrera === filtroCarrera;

        return coincideTexto && coincideModalidad && coincideCarrera;
    });

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

                    <Link
                        to={user ? "/dashboard" : "/login"}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 px-5 py-2 rounded-md font-medium hover:bg-blue-600 hover:text-white transition-all text-sm"
                    >
                        {user ? "Ir al Dashboard →" : "Acceso al Sistema"}
                    </Link>
                </div>
            </nav>

            {/* HEADER / BUSCADOR CENTRADO */}
            <header className="max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col items-center text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-8">
                    Propuestas de Investigación 2026
                </h2>
                
                {/* BARRA DE BÚSQUEDA Y FILTRADO */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 w-full max-w-4xl">
                    <div className="relative w-full">
                        <input 
                            type="text" 
                            value={busqueda} 
                            onChange={(e) => setBusqueda(e.target.value)} 
                            placeholder="Buscar por propuesta, investigador o planteamiento..." 
                            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm" 
                        />
                        <svg className="w-6 h-6 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <select 
                            value={filtroModalidad} 
                            onChange={(e) => setFiltroModalidad(e.target.value)} 
                            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="Todas">Modalidad: Todas</option>
                            {OPCIONES_MODALIDAD.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>

                        <select 
                            value={filtroCarrera} 
                            onChange={(e) => setFiltroCarrera(e.target.value)} 
                            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[280px] truncate"
                        >
                            <option value="Todas">Carrera: Todas</option>
                            {OPCIONES_CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {(busqueda || filtroModalidad !== 'Todas' || filtroCarrera !== 'Todas') && (
                            <button 
                                onClick={() => { setBusqueda(''); setFiltroModalidad('Todas'); setFiltroCarrera('Todas'); }} 
                                className="text-xs text-red-600 hover:text-red-700 font-bold whitespace-nowrap px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors md:ml-auto"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* CUADRÍCULA DE PROYECTOS */}
            <main id="proyectos" className="max-w-7xl mx-auto px-6 pb-20">
                <h3 className="text-xl font-semibold text-slate-800 text-center mb-10">Listado de Proyectos Disponibles</h3>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Cargando catálogo de proyectos...</div>
                ) : proyectos.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm">
                        Aún no hay propuestas activas publicadas para este periodo.
                    </div>
                ) : proyectosFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        No se encontraron proyectos que coincidan con los filtros seleccionados.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {proyectosFiltrados.map((proyecto) => (
                            <div key={proyecto.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all flex flex-col h-full">
                                <h4 className="text-lg font-bold text-slate-800 text-center mb-3 leading-snug">
                                    {proyecto.titulo}
                                </h4>

                                {/* ETIQUETAS CENTRADAS EN LÍNEAS SEPARADAS */}
                                <div className="flex flex-col items-center justify-center gap-2 mt-2">
                                    <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-md flex items-center justify-center gap-1.5 font-bold shadow-sm w-fit text-center">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        {proyecto.carrera || 'Multidisciplinario'}
                                    </span>
                                    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-md flex items-center justify-center gap-1.5 font-bold shadow-sm w-fit text-center">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        {proyecto.modalidad || 'Presencial'}
                                    </span>
                                </div>

                                {/* LÍNEA DIVISORIA */}
                                <hr className="border-slate-100 my-4" />

                                <div className="space-y-2 text-sm text-center mb-8 flex-grow">
                                    <p><span className="text-slate-500">Institución:</span> TecNM Campus Felipe Carrillo Puerto</p>
                                    <p><span className="text-slate-500">Investigador:</span> <span className="text-slate-700 font-medium uppercase">{proyecto.investigador?.nombre_completo}</span></p>
                                    <p><span className="text-slate-500">Estado:</span> <span className="text-emerald-600 font-medium">Disponible</span></p>
                                </div>
                                
                                <Link
                                    to={`/proyecto/${proyecto.id}`}
                                    className="w-full block text-center py-2.5 bg-slate-50 text-blue-600 border border-slate-200 font-medium rounded-md hover:bg-blue-50 transition-colors text-sm"
                                >
                                    Ver Detalle
                                </Link>
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