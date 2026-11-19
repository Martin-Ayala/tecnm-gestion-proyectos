import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Convocatorias() {
    const { user } = useAuth();
    const esAdmin = user?.rol === 'Administrador';

    const [convocatorias, setConvocatorias] = useState([]);
    const [seleccionada, setSeleccionada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [descargando, setDescargando] = useState(false);

    // Estados del Modal (Solo Admin)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fechaLimite, setFechaLimite] = useState('');
    const [archivoFile, setArchivoFile] = useState(null);
    const [archivoUrl, setArchivoUrl] = useState('');
    const [subiendo, setSubiendo] = useState(false);

    useEffect(() => {
        const fetchConvocatorias = async () => {
            const { data, error } = await supabase
                .from('convocatorias')
                .select('*, creador:usuarios!creado_por(nombre_completo)')
                .order('fecha_creacion', { ascending: false });

            if (error) {
                console.error('Error cargando convocatorias:', error);
            } else {
                const lista = data || [];
                setConvocatorias(lista);
                if (lista.length > 0) {
                    setSeleccionada(lista[0]); // Selecciona automáticamente la más reciente para mostrarla
                }
            }
            setLoading(false);
        };

        fetchConvocatorias();
    }, []);

    const handlePublicar = async (e) => {
        e.preventDefault();
        if (!archivoFile && !archivoUrl.trim()) {
            alert('Por favor sube un archivo PDF o pega un enlace externo.');
            return;
        }

        setSubiendo(true);
        let urlFinal = archivoUrl.trim();

        if (archivoFile) {
            const ext = archivoFile.name.split('.').pop();
            const fileName = `convocatoria_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(`convocatorias/${fileName}`, archivoFile);

            if (uploadError) {
                alert(`Error al subir el PDF: ${uploadError.message}`);
                setSubiendo(false);
                return;
            }

            const { data: urlData } = supabase.storage
                .from('documentos')
                .getPublicUrl(`convocatorias/${fileName}`);
            urlFinal = urlData.publicUrl;
        }

        const { data, error } = await supabase
            .from('convocatorias')
            .insert([{
                titulo,
                descripcion: descripcion || null,
                archivo_url: urlFinal,
                fecha_limite: fechaLimite || null,
                creado_por: user.id
            }])
            .select('*, creador:usuarios!creado_por(nombre_completo)')
            .single();

        if (error) {
            alert(`Error al publicar convocatoria: ${error.message}`);
        } else {
            const nuevaLista = [data, ...convocatorias];
            setConvocatorias(nuevaLista);
            setSeleccionada(data); // Muestra inmediatamente la recién subida
            setIsModalOpen(false);
            setTitulo('');
            setDescripcion('');
            setFechaLimite('');
            setArchivoFile(null);
            setArchivoUrl('');
        }
        setSubiendo(false);
    };

    const handleEliminar = async (conv) => {
        if (!window.confirm(`¿Estás seguro de eliminar la convocatoria "${conv.titulo}"?`)) return;

        if (conv.archivo_url && conv.archivo_url.includes('supabase.co/storage')) {
            const partes = conv.archivo_url.split('/');
            const nombreArchivo = partes[partes.length - 1];
            await supabase.storage.from('documentos').remove([`convocatorias/${nombreArchivo}`]);
        }

        const { data, error } = await supabase
            .from('convocatorias')
            .delete()
            .eq('id', conv.id)
            .select();

        if (error) {
            alert(`Error al eliminar: ${error.message}`);
            return;
        }
        if (!data || data.length === 0) {
            alert('⚠️ La base de datos bloqueó la eliminación (RLS).');
            return;
        }

        const restantes = convocatorias.filter((c) => c.id !== conv.id);
        setConvocatorias(restantes);
        if (seleccionada?.id === conv.id) {
            setSeleccionada(restantes.length > 0 ? restantes[0] : null);
        }
    };

    // Fuerza la descarga real del archivo PDF a la computadora
    const handleDescargarDirecto = async (conv) => {
        try {
            setDescargando(true);
            const response = await fetch(conv.archivo_url);
            const blob = await response.blob();
            const urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlBlob;
            link.download = `${conv.titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(urlBlob);
        } catch {
            // Si es un enlace externo (ej. Google Drive) con bloqueo CORS, lo abre en pestaña nueva
            window.open(conv.archivo_url, '_blank', 'noreferrer');
        } finally {
            setDescargando(false);
        }
    };

    // Convierte enlaces de Google Drive "/view" a "/preview" para que se vean dentro del iframe
    const obtenerUrlEmbebida = (url) => {
        if (!url) return '';
        if (url.includes('drive.google.com') && url.includes('/view')) {
            return url.replace('/view', '/preview');
        }
        return url;
    };

    const convocatoriasFiltradas = convocatorias.filter((c) => {
        const txt = busqueda.toLowerCase();
        return (
            c.titulo?.toLowerCase().includes(txt) ||
            c.descripcion?.toLowerCase().includes(txt)
        );
    });

    const esVigente = (fecha) => {
        if (!fecha) return true;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return new Date(`${fecha}T00:00:00`) >= hoy;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* BARRA DE NAVEGACIÓN */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
                <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-blue-900 hover:opacity-90 transition-opacity">
                    TecNM <span className="text-blue-600">Gestión Interna</span>
                </Link>
                <div className="flex items-center gap-3">
                    {esAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            <span>+</span> Publicar Convocatoria
                        </button>
                    )}
                    <Link
                        to={user ? "/dashboard" : "/"}
                        className="text-xs sm:text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-semibold transition-colors flex items-center gap-2"
                    >
                        ← {user ? 'Dashboard' : 'Inicio'}
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col">
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Convocatorias Oficiales</h2>
                    <p className="text-slate-500 text-sm mt-1">Visualiza y descarga los documentos oficiales de Posgrado e Investigación.</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Cargando convocatorias...</div>
                ) : convocatorias.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-4xl mb-2">📄</p>
                        <p className="text-slate-500 font-medium">No hay convocatorias publicadas por el momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* COLUMNA IZQUIERDA: LISTADO DE CONVOCATORIAS (4 columnas) */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Filtrar convocatorias..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                                {convocatoriasFiltradas.map((conv) => {
                                    const vigente = esVigente(conv.fecha_limite);
                                    const activa = seleccionada?.id === conv.id;

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSeleccionada(conv)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                                activa
                                                    ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center gap-2 mb-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                                    vigente
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    {vigente ? 'Vigente' : 'Cerrada'}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(conv.fecha_creacion).toLocaleDateString('es-MX')}
                                                </span>
                                            </div>

                                            <h3 className={`font-bold text-base leading-snug ${activa ? 'text-blue-900' : 'text-slate-800'}`}>
                                                {conv.titulo}
                                            </h3>

                                            {conv.descripcion && (
                                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                                    {conv.descripcion}
                                                </p>
                                            )}

                                            {conv.fecha_limite && (
                                                <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                                                    <span className="font-semibold">Fecha límite:</span>{' '}
                                                    {new Date(`${conv.fecha_limite}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: VISOR DE PDF EN PANTALLA COMPLETA (8 columnas) */}
                        {seleccionada && (
                            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                {/* Cabecera del documento seleccionado */}
                                <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800 leading-tight">{seleccionada.titulo}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Publicado por <span className="font-semibold">{seleccionada.creador?.nombre_completo || 'Administración'}</span>
                                            {seleccionada.descripcion && ` • ${seleccionada.descripcion}`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                                        <button
                                            onClick={() => handleDescargarDirecto(seleccionada)}
                                            disabled={descargando}
                                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {descargando ? 'Descargando...' : '⬇️ Descargar PDF'}
                                        </button>
                                        <a
                                            href={seleccionada.archivo_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                                            title="Abrir en pestaña completa"
                                        >
                                            ↗
                                        </a>
                                        {esAdmin && (
                                            <button
                                                onClick={() => handleEliminar(seleccionada)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                                                title="Eliminar convocatoria"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Visor PDF embebido */}
                                <div className="w-full bg-slate-800">
                                    <iframe
                                        key={seleccionada.id}
                                        src={obtenerUrlEmbebida(seleccionada.archivo_url)}
                                        title={seleccionada.titulo}
                                        className="w-full h-[78vh] border-0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL PUBLICAR CONVOCATORIA (SOLO ADMIN) */}
            {esAdmin && isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Publicar Nueva Convocatoria</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
                        </div>
                        <form onSubmit={handlePublicar} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Convocatoria</label>
                                <input
                                    type="text"
                                    required
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej. Convocatoria Fomento a la Investigación 2026"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                                <textarea
                                    rows="3"
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Resumen breve de a quién va dirigida o puntos clave..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Límite (Opcional)</label>
                                <input
                                    type="date"
                                    value={fechaLimite}
                                    onChange={(e) => setFechaLimite(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subir Archivo PDF</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => { setArchivoFile(e.target.files[0]); setArchivoUrl(''); }}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <hr className="flex-grow border-slate-200" />
                                    <span className="text-xs text-slate-400 font-medium">O</span>
                                    <hr className="flex-grow border-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Enlace Externo (Google Drive / TecNM)</label>
                                    <input
                                        type="url"
                                        value={archivoUrl}
                                        onChange={(e) => { setArchivoUrl(e.target.value); setArchivoFile(null); }}
                                        placeholder="https://..."
                                        disabled={!!archivoFile}
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
                                <button type="submit" disabled={subiendo} className="px-5 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 rounded-lg disabled:opacity-50 text-sm">
                                    {subiendo ? 'Publicando...' : 'Publicar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}