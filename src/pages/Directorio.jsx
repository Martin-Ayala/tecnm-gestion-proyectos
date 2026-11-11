import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Directorio() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('Todos');

    // Estado del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

    useEffect(() => {
        const fetchUsuarios = async () => {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .order('nombre_completo', { ascending: true });
                
            if (error) console.error("Error cargando directorio:", error);
            else setUsuarios(data || []);
            
            setLoading(false);
        };
        fetchUsuarios();
    }, []);

    const usuariosFiltrados = usuarios.filter((u) => {
        const txt = busqueda.toLowerCase();
        const coincideTexto = 
            u.nombre_completo?.toLowerCase().includes(txt) || 
            u.carrera?.toLowerCase().includes(txt) || 
            u.departamento?.toLowerCase().includes(txt);
            
        const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
        return coincideTexto && coincideRol;
    });

    const abrirPerfil = (user) => {
        setUsuarioSeleccionado(user);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* BARRA DE NAVEGACIÓN */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
                <Link to="/dashboard" className="text-xl font-bold text-blue-900 hover:opacity-90 transition-opacity">
                    TecNM <span className="text-blue-600">Gestión Interna</span>
                </Link>
                <Link to="/dashboard" className="text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-semibold transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Volver al Dashboard
                </Link>
            </nav>

            <main className="max-w-6xl mx-auto px-6 mt-10">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Directorio Institucional</h2>
                    <p className="text-slate-500 mt-1">Encuentra investigadores, administradores y compañeros estudiantes.</p>
                </div>

                {/* BARRA DE BÚSQUEDA Y FILTROS */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={busqueda} 
                            onChange={(e) => setBusqueda(e.target.value)} 
                            placeholder="Buscar por nombre, carrera o departamento..." 
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <select 
                        value={filtroRol} 
                        onChange={(e) => setFiltroRol(e.target.value)} 
                        className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]"
                    >
                        <option value="Todos">Todos los roles</option>
                        <option value="Investigador">Docentes / Investigadores</option>
                        <option value="Estudiante">Estudiantes / Residentes</option>
                        <option value="Administrador">Administradores</option>
                    </select>
                </div>

                {/* CUADRÍCULA DEL DIRECTORIO */}
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Cargando directorio...</div>
                ) : usuariosFiltrados.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No se encontraron usuarios con esos criterios.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {usuariosFiltrados.map((u) => (
                            <button 
                                key={u.id} 
                                onClick={() => abrirPerfil(u)}
                                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center text-center group text-left w-full focus:outline-none"
                            >
                                {u.avatar_url ? (
                                    <img src={u.avatar_url} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm mb-3 group-hover:scale-105 transition-transform" alt="Avatar" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-slate-50 shadow-sm flex items-center justify-center text-slate-400 font-bold text-2xl mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        {u.nombre_completo?.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                
                                <h4 className="font-bold text-slate-800 leading-tight mb-1 group-hover:text-blue-700 transition-colors line-clamp-1">
                                    {u.nombre_completo}
                                </h4>
                                
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-3 ${
                                    u.rol === 'Administrador' ? 'bg-amber-100 text-amber-800' : 
                                    u.rol === 'Investigador' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {u.rol}
                                </span>
                                
                                <p className="text-xs text-slate-500 line-clamp-2 mt-auto">
                                    {u.rol === 'Estudiante' ? u.carrera : u.departamento || 'Sin asignar'}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {/* MODAL UNIVERSAL DE PERFIL */}
            {isModalOpen && usuarioSeleccionado && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className={`px-6 py-4 flex justify-between items-center relative overflow-hidden ${
                            usuarioSeleccionado.rol === 'Estudiante' ? 'bg-indigo-700' : 'bg-blue-700'
                        }`}>
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                            <h3 className="text-lg font-bold text-white relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                Expediente de {usuarioSeleccionado.rol}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white opacity-70 hover:opacity-100 font-bold text-xl relative z-10">✕</button>
                        </div>
                        
                        <div className="p-6 bg-slate-50">
                            <div className="flex flex-col items-center mb-6 text-center">
                                {usuarioSeleccionado.avatar_url ? (
                                    <img src={usuarioSeleccionado.avatar_url} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm mb-3" alt="Avatar" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold text-2xl mb-3">
                                        {usuarioSeleccionado.nombre_completo?.substring(0,2).toUpperCase()}
                                    </div>
                                )}
                                <h4 className="text-xl font-bold text-slate-800 leading-tight">{usuarioSeleccionado.nombre_completo}</h4>
                                <p className="text-sm font-semibold text-slate-500 mt-1">
                                    {usuarioSeleccionado.rol === 'Estudiante' ? usuarioSeleccionado.carrera : usuarioSeleccionado.departamento || 'No especificado'}
                                </p>
                                {usuarioSeleccionado.rol === 'Estudiante' && (
                                    <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-2 border border-indigo-100">Matrícula: {usuarioSeleccionado.numero_control || 'N/A'}</p>
                                )}
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4 text-left">
                                
                                {/* AQUI ESTÁ EL CAMBIO SOLICITADO */}
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Contacto Institucional</p>
                                    <p className="text-sm font-medium text-slate-700 break-all mb-2 flex items-center gap-2">
                                        <span>📧</span> {usuarioSeleccionado.correo_institucional}
                                    </p>
                                    {usuarioSeleccionado.telefono ? (
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <a 
                                                href={`tel:${usuarioSeleccionado.telefono.replace(/\s+/g, '')}`}
                                                className="text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 transition-colors"
                                                title="Llamar o copiar teléfono"
                                            >
                                                <span>📱</span> {usuarioSeleccionado.telefono}
                                            </a>
                                            <a 
                                                href={`https://wa.me/52${usuarioSeleccionado.telefono.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors shadow-sm"
                                                title="Abrir chat de WhatsApp"
                                            >
                                                <svg className="w-3.5 h-3.5 fill-current text-emerald-600" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                </svg>
                                                WhatsApp
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic mt-1">📱 Sin teléfono registrado</p>
                                    )}
                                </div>
                                {/* FIN DEL CAMBIO */}

                                {usuarioSeleccionado.rol === 'Estudiante' ? (
                                    <>
                                        <div className="pt-3 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Habilidades Técnicas</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{usuarioSeleccionado.habilidades || 'No especificadas.'}</p>
                                        </div>
                                        {usuarioSeleccionado.enlaces_profesionales && (
                                            <div className="pt-3 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Portafolio / GitHub</p>
                                                <a href={usuarioSeleccionado.enlaces_profesionales} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline break-all">
                                                    {usuarioSeleccionado.enlaces_profesionales}
                                                </a>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="pt-3 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Ubicación / Cubículo</p>
                                            <p className="text-sm text-slate-700">{usuarioSeleccionado.ubicacion_cubiculo || 'Ubicación no especificada.'}</p>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Líneas de Investigación</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{usuarioSeleccionado.lineas_investigacion || 'No especificadas.'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={() => setIsModalOpen(false)} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm w-full">Cerrar Expediente</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}