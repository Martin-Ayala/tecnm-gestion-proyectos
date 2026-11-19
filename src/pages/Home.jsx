import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const LISTA_CARRERAS = [
    "Ingeniería en Sistemas Computacionales",
    "Ingeniería en Gestión Empresarial",
    "Ingeniería Industrial",
    "Ingeniería en Administración",
    "Ingeniería en Industrias Alimentarias"
];

const OPCIONES_MODALIDAD = ["Presencial", "Híbrida", "Virtual"];

export default function Home() {
    const [proyectos, setProyectos] = useState([]);
    const [ultimaConvocatoria, setUltimaConvocatoria] = useState(null);
    const [totalConvocatorias, setTotalConvocatorias] = useState(0);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Estados para Búsqueda y Filtrado
    const [busqueda, setBusqueda] = useState('');
    const [filtroModalidad, setFiltroModalidad] = useState('Todas');
    const [filtroCarrera, setFiltroCarrera] = useState('Todas');

    useEffect(() => {
        const fetchDatosPublicos = async () => {
            const [resProyectos, resConvocatorias] = await Promise.all([
                supabase
                    .from('proyectos')
                    .select('*, investigador:usuarios!investigador_id(nombre_completo)')
                    .eq('estado', 'Activo')
                    .order('fecha_creacion', { ascending: false }),
                supabase
                    .from('convocatorias')
                    .select('*')
                    .order('fecha_creacion', { ascending: false })
            ]);

            if (resProyectos.error) console.error("Error cargando proyectos públicos:", resProyectos.error);
            else setProyectos(resProyectos.data || []);

            if (resConvocatorias.error) console.error("Error cargando convocatorias:", resConvocatorias.error);
            else if (resConvocatorias.data && resConvocatorias.data.length > 0) {
                setUltimaConvocatoria(resConvocatorias.data[0]);
                setTotalConvocatorias(resConvocatorias.data.length);
            }

            setLoading(false);
        };
        fetchDatosPublicos();
    }, []);

    const proyectosFiltrados = proyectos.filter((proy) => {
        const textoBuscar = busqueda.toLowerCase();
        const coincideTexto =
            proy.titulo?.toLowerCase().includes(textoBuscar) ||
            (proy.planteamiento_problema || proy.descripcion)?.toLowerCase().includes(textoBuscar) ||
            proy.investigador?.nombre_completo?.toLowerCase().includes(textoBuscar);
        const coincideModalidad = filtroModalidad === 'Todas' || proy.modalidad === filtroModalidad;
        const coincideCarrera = filtroCarrera === 'Todas' || proy.carrera?.includes(filtroCarrera) || proy.carrera?.includes('Multidisciplinario');
        return coincideTexto && coincideModalidad && coincideCarrera;
    });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-600 font-sans">
            {/* BARRA DE NAVEGACIÓN */}
            <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-bold text-blue-900 tracking-wide">
                            TecNM <span className="text-blue-600">Felipe Carrillo Puerto</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/convocatorias"
                            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 hover:text-white transition-all text-xs sm:text-sm"
                        >
                            <span>📄</span>
                            <span>Convocatorias</span>
                        </Link>
                        <Link
                            to={user ? "/dashboard" : "/login"}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all text-xs sm:text-sm shadow-sm"
                        >
                            {user ? "Ir al Dashboard →" : "Acceso al Sistema"}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO / ENCABEZADO LLAMATIVO CON DEGRADADO */}
            <header className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
                {/* Decoración sutil de fondo */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
                    <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Posgrado e Investigación • Periodo 2026
                    </span>

                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-3xl leading-tight">
                        Propuestas de Investigación y Residencias
                    </h2>
                    <p className="text-blue-100/90 text-sm md:text-base max-w-2xl">
                        Explora los proyectos vigentes dirigidos por docentes investigadores del TecNM Campus Felipe Carrillo Puerto y consulta las convocatorias oficiales.
                    </p>
                </div>
            </header>

            {/* BANNER DESTACADO DE CONVOCATORIAS */}
            <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-md p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/50">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0 border border-emerald-200">
                            📢
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                                    Convocatorias Oficiales
                                </span>
                                {ultimaConvocatoria?.fecha_limite && (
                                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                        Límite: {new Date(`${ultimaConvocatoria.fecha_limite}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-800 text-base md:text-lg leading-snug">
                                {ultimaConvocatoria
                                    ? ultimaConvocatoria.titulo
                                    : 'Consulta las convocatorias y lineamientos de investigación'}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">
                                {ultimaConvocatoria?.descripcion
                                    ? ultimaConvocatoria.descripcion
                                    : 'Visualiza o descarga los documentos oficiales emitidos por Posgrado e Investigación.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto flex-shrink-0">
                        {ultimaConvocatoria && (
                            <a
                                href={ultimaConvocatoria.archivo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 md:flex-none text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                            >
                                Ver Convocatoria
                            </a>
                        )}
                        <Link
                            to="/convocatorias"
                            className="flex-1 md:flex-none text-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                        >
                            {totalConvocatorias > 1 ? `Ver todas (${totalConvocatorias})` : 'Ir a Convocatorias →'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* CUADRÍCULA DE PROYECTOS */}
            <main id="proyectos" className="max-w-7xl mx-auto px-6 py-14 pb-20">
                <div className="flex flex-col items-center text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-800">Listado de Proyectos Disponibles</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        {proyectosFiltrados.length} {proyectosFiltrados.length === 1 ? 'propuesta disponible' : 'propuestas disponibles'}
                    </p>
                </div>

                {/* BARRA DE BÚSQUEDA Y FILTRADO (COMO EN EL DASHBOARD) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 mb-8">
                    <div className="relative w-full">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por proyecto, planteamiento o docente..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={filtroModalidad}
                            onChange={(e) => setFiltroModalidad(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="Todas">Modalidad: Todas</option>
                            {OPCIONES_MODALIDAD.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                            value={filtroCarrera}
                            onChange={(e) => setFiltroCarrera(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[240px] truncate"
                        >
                            <option value="Todas">Carrera: Todas</option>
                            {LISTA_CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {(busqueda || filtroModalidad !== 'Todas' || filtroCarrera !== 'Todas') && (
                            <button
                                onClick={() => { setBusqueda(''); setFiltroModalidad('Todas'); setFiltroCarrera('Todas'); }}
                                className="text-xs text-red-600 hover:text-red-700 font-bold whitespace-nowrap px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Cargando catálogo de proyectos...</div>
                ) : proyectos.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
                        Aún no hay propuestas activas publicadas para este periodo.
                    </div>
                ) : proyectosFiltrados.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-500 text-sm">No se encontraron proyectos con los criterios de búsqueda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {proyectosFiltrados.map((proyecto) => (
                            <div
                                key={proyecto.id}
                                className="bg-white border border-slate-200 border-t-4 border-t-blue-600 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col h-full items-center text-center justify-between"
                            >
                                {/* CONTENEDOR DEL TÍTULO COMPLETO Y CENTRADO */}
                                <div className="w-full min-h-[5.5rem] flex items-center justify-center">
                                    <h4 className="text-lg font-extrabold text-slate-800 leading-snug">
                                        {proyecto.titulo}
                                    </h4>
                                </div>

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
                                        className="w-full block text-center py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-sm"
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
                    <p className="font-medium text-slate-700">© 2026 Tecnológico Nacional de México Campus Felipe Carrillo Puerto.</p>
                    <p className="mt-1.5">Sistema de Gestión de Proyectos de Investigación y Residencias.</p>
                </div>
            </footer>
        </div>
    );
}