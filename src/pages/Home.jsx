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
        const coincideCarrera = filtroCarrera === 'Todas' ||
            proy.carrera?.includes(filtroCarrera) ||
            proy.carrera?.includes('Multidisciplinario');

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
                            <div
                                key={proyecto.id}
                                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all flex flex-col h-full items-center text-center justify-between"
                            >
                                {/* CONTENEDOR DEL TÍTULO COMPLETO Y CENTRADO */}
                                <div className="w-full min-h-[5.5rem] flex items-center justify-center">
                                    <h4 className="text-lg font-extrabold text-slate-800 leading-snug">
                                        {proyecto.titulo}
                                    </h4>
                                </div>

                                {/* LÍNEA DIVISORIA SUPERIOR */}
                                <hr className="border-slate-100 my-2 w-full" />

                                {/* BLOQUE CENTRAL CENTRADO VERTICALMENTE */}
                                <div className="flex-1 flex flex-col justify-center items-center w-full gap-3 py-2">
                                    <div className="flex flex-col items-center justify-center gap-1.5 text-sm w-full">
                                        <p className="leading-snug">
                                            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mr-1.5 text-xs uppercase tracking-wide">
                                                Carrera:
                                            </span>
                                            <span className="font-semibold text-slate-800">{proyecto.carrera || 'Multidisciplinario'}</span>
                                        </p>
                                        <p className="leading-snug">
                                            <span className="font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md mr-1.5 text-xs uppercase tracking-wide">
                                                Modalidad:
                                            </span>
                                            <span className="font-semibold text-slate-800">{proyecto.modalidad || 'Presencial'}</span>
                                        </p>
                                        <p className="leading-snug">
                                            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md mr-1.5 text-xs uppercase tracking-wide">
                                                Alumnos Permitidos:
                                            </span>
                                            <span className="font-semibold text-slate-800">{proyecto.cupos_requeridos || 1}</span>
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center text-sm w-full mt-1">
                                        <p>
                                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md mr-1.5 text-xs uppercase tracking-wide">
                                                Investigador:
                                            </span>
                                            <span className="font-bold text-slate-800 uppercase block mt-1">{proyecto.investigador?.nombre_completo || 'No asignado'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* BOTÓN EN LA PARTE INFERIOR */}
                                <div className="w-full pt-3 mt-auto">
                                    <Link
                                        to={`/proyecto/${proyecto.id}`}
                                        className="w-full block text-center py-2.5 bg-slate-50 text-blue-600 border border-slate-200 font-medium rounded-md hover:bg-blue-50 transition-colors text-sm"
                                    >
                                        Ver Detalle
                                    </Link>
                                </div>
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