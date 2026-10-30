import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminPanel({ onRefreshProyectos, user }) {
    const [tabActiva, setTabActiva] = useState('usuarios');

    // Estados para Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [busquedaUsuario, setBusquedaUsuario] = useState('');
    const [filtroRol, setFiltroRol] = useState('Todos');

    // Estados para Postulaciones
    const [todasPostulaciones, setTodasPostulaciones] = useState([]);
    const [loadingPostulaciones, setLoadingPostulaciones] = useState(false);

    // Estados para Aviso Global (Solo Admin)
    const [mensajeGlobal, setMensajeGlobal] = useState('');
    const [destinoAviso, setDestinoAviso] = useState('Todos');
    const [enviandoAviso, setEnviandoAviso] = useState(false);

    const esAdmin = user?.rol === 'Administrador';

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            // 1. Cargar Usuarios
            const { data: dataUsuarios, error: errUsuarios } = await supabase
                .from('usuarios')
                .select('*')
                .order('fecha_registro', { ascending: false });

            if (errUsuarios) console.error('Error cargando usuarios:', errUsuarios);
            else setUsuarios(dataUsuarios || []);
            setLoadingUsuarios(false);

            // 2. Cargar Postulaciones
            setLoadingPostulaciones(true);
            const { data: dataPostulaciones, error: errPostulaciones } = await supabase
                .from('postulaciones')
                .select(`
                  id, estado, fecha_postulacion, documento_kardex_url, id_estudiante,
                  estudiante:usuarios!id_estudiante(nombre_completo, correo_institucional, numero_control, carrera),
                  proyecto:proyectos!id_proyecto(id, titulo, investigador_id, investigador:usuarios!investigador_id(nombre_completo))
                `)
                .order('fecha_postulacion', { ascending: false });

            if (errPostulaciones) console.error('Error cargando postulaciones:', errPostulaciones);
            else {
                // Si es investigador, filtramos para que solo vea las postulaciones de SUS proyectos
                const post = esAdmin 
                    ? dataPostulaciones 
                    : dataPostulaciones.filter(p => p.proyecto?.investigador_id === user?.id);
                setTodasPostulaciones(post || []);
            }
            setLoadingPostulaciones(false);
        };

        cargarDatosIniciales();
    }, [user, esAdmin]);

    // Cambiar rol de un usuario (SOLO ADMIN)
    const handleCambiarRol = async (usuarioId, nuevoRol) => {
        if (!esAdmin) return;
        const { data, error } = await supabase
            .from('usuarios')
            .update({ rol: nuevoRol })
            .eq('id', usuarioId)
            .select();

        if (error) {
            alert(`Error al cambiar el rol: ${error.message}`);
            return;
        }

        if (!data || data.length === 0) {
            alert('La base de datos bloqueó la actualización (0 filas afectadas). Ejecuta el script SQL en Supabase para otorgar permisos.');
            return;
        }

        setUsuarios(usuarios.map(u => u.id === usuarioId ? { ...u, rol: nuevoRol } : u));
        alert(`Rol actualizado exitosamente a "${nuevoRol}".`);
    };

    // Eliminar usuario de la tabla pública (SOLO ADMIN)
    const handleEliminarUsuario = async (usuarioId, nombre) => {
        if (!esAdmin) return;
        if (!window.confirm(`¿Estás seguro de eliminar a "${nombre}" del sistema? Esta acción borrará también sus proyectos y postulaciones asociadas.`)) return;

        const { data, error } = await supabase.from('usuarios').delete().eq('id', usuarioId).select();

        if (error) { alert(`No se pudo eliminar el usuario: ${error.message}`); return; }
        if (!data || data.length === 0) { alert('La base de datos bloqueó la eliminación (0 filas afectadas).'); return; }

        setUsuarios(usuarios.filter(u => u.id !== usuarioId));
        if (onRefreshProyectos) onRefreshProyectos();
        alert(`Usuario "${nombre}" eliminado con éxito.`);
    };

    // Intervenir postulación (ADMIN O INVESTIGADOR DUEÑO DEL PROYECTO)
    const handleDictamenAdmin = async (post, nuevoEstado) => {
        const { data, error } = await supabase
            .from('postulaciones')
            .update({ estado: nuevoEstado })
            .eq('id', post.id)
            .select(); // Obligamos a verificar la actualización

        if (error) {
            alert('Error al actualizar la postulación.');
            return;
        }
        
        if (!data || data.length === 0) {
            alert('⚠️ La base de datos bloqueó la acción. No tienes permisos para dictaminar (RLS).');
            return;
        }

        setTodasPostulaciones(todasPostulaciones.map(p => p.id === post.id ? { ...p, estado: nuevoEstado } : p));

        if (post.id_estudiante) {
            const autorDictamen = esAdmin ? "[Administración]" : "[Investigador Titular]";
            await supabase.from('notificaciones').insert([
                {
                    usuario_id: post.id_estudiante,
                    tipo: nuevoEstado.toLowerCase(),
                    mensaje: `${autorDictamen} Tu postulación al proyecto "${post.proyecto?.titulo}" fue marcada como ${nuevoEstado}.`
                }
            ]);
        }
    };

    // === ELIMINAR POSTULACIÓN CORREGIDA ===
    const handleEliminarPostulacion = async (postulacionId) => {
        if (!window.confirm("¿Estás seguro de borrar permanentemente esta solicitud? Si lo haces, el estudiante quedará desbloqueado y podrá volver a postularse a este proyecto.")) return;

        // Añadimos .select() para que Supabase confiese si realmente borró algo
        const { data, error } = await supabase
            .from('postulaciones')
            .delete()
            .eq('id', postulacionId)
            .select(); 

        if (error) {
            alert(`Error al eliminar la solicitud: ${error.message}`);
            return;
        }

        // Esta es la validación que te protegerá de fallos silenciosos
        if (!data || data.length === 0) {
            alert("⚠️ La base de datos bloqueó la eliminación (0 filas afectadas). Necesitas configurar los permisos SQL en Supabase para permitir borrar postulaciones.");
            return;
        }

        setTodasPostulaciones(todasPostulaciones.filter(p => p.id !== postulacionId));
        if (onRefreshProyectos) onRefreshProyectos();
        alert("Solicitud eliminada. El estudiante ya puede volver a postularse.");
    };

    // Enviar notificación masiva (SOLO ADMIN)
    const handleEnviarAvisoGlobal = async (e) => {
        e.preventDefault();
        if (!esAdmin || !mensajeGlobal.trim()) return;
        setEnviandoAviso(true);

        const destinatarios = usuarios.filter(u => {
            if (destinoAviso === 'Todos') return true;
            return u.rol === destinoAviso;
        });

        if (destinatarios.length === 0) {
            alert('No hay usuarios registrados en esa categoría.');
            setEnviandoAviso(false);
            return;
        }

        const filasNotificaciones = destinatarios.map(u => ({
            usuario_id: u.id,
            tipo: 'aviso_oficial',
            mensaje: `📢 AVISO OFICIAL: ${mensajeGlobal}`
        }));

        const { error } = await supabase.from('notificaciones').insert(filasNotificaciones);

        if (error) alert('Error al enviar el comunicado masivo.');
        else {
            alert(`Comunicado enviado con éxito a ${destinatarios.length} usuario(s).`);
            setMensajeGlobal('');
        }
        setEnviandoAviso(false);
    };

    // Exportar datos a CSV compatible con Excel
    const exportarCSV = (tipo) => {
        let encabezados, filas, nombreArchivo;

        if (tipo === 'usuarios') {
            encabezados = ['Nombre Completo', 'Rol', 'Correo Institucional', 'No. Control', 'Carrera', 'Grado Académico', 'Teléfono'];
            filas = usuarios.map(u => [
                `"${u.nombre_completo || ''}"`, `"${u.rol || ''}"`, `"${u.correo_institucional || ''}"`,
                `"${u.numero_control || 'N/A'}"`, `"${u.carrera || 'N/A'}"`, `"${u.grado_academico || 'N/A'}"`, `"${u.telefono || 'N/A'}"`
            ]);
            nombreArchivo = 'Directorio_TecNM.csv';
        } else {
            encabezados = ['Proyecto', 'Alumno', 'Correo Alumno', 'No. Control', 'Estado Postulación', 'Fecha'];
            filas = todasPostulaciones.map(p => [
                `"${(p.proyecto?.titulo || '').replace(/"/g, '""')}"`,
                `"${p.estudiante?.nombre_completo || ''}"`,
                `"${p.estudiante?.correo_institucional || ''}"`,
                `"${p.estudiante?.numero_control || 'N/A'}"`,
                `"${p.estado || ''}"`,
                `"${p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleDateString('es-MX') : ''}"`
            ]);
            nombreArchivo = esAdmin ? 'Auditoria_Postulaciones_TecNM.csv' : 'Mis_Postulaciones_TecNM.csv';
        }

        const contenidoCSV = '\uFEFF' + [encabezados.join(','), ...filas.map(e => e.join(','))].join('\n');
        const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nombreArchivo);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtrado de usuarios
    const usuariosFiltrados = usuarios.filter(u => {
        const coincideTexto =
            u.nombre_completo?.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
            u.correo_institucional?.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
            u.numero_control?.toLowerCase().includes(busquedaUsuario.toLowerCase());
        const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
        return coincideTexto && coincideRol;
    });

    const totalEstudiantes = usuarios.filter(u => u.rol === 'Estudiante').length;
    const totalInvestigadores = usuarios.filter(u => u.rol === 'Investigador').length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-12">
            {/* CABECERA DEL PANEL */}
            <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider ${esAdmin ? 'bg-amber-500' : 'bg-purple-400'}`}>
                            {esAdmin ? 'Modo Administrador' : 'Panel del Investigador'}
                        </span>
                        <h3 className="text-xl font-bold">{esAdmin ? 'Centro de Control Institucional' : 'Gestión y Directorio'}</h3>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                        {usuarios.length} usuarios registrados ({totalEstudiantes} Estudiantes, {totalInvestigadores} Docentes) • {todasPostulaciones.length} {esAdmin ? 'postulaciones globales' : 'solicitudes a tus proyectos'}
                    </p>
                </div>

                {/* BOTONES DE EXPORTACIÓN */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => exportarCSV('usuarios')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                        👥 Exportar Directorio
                    </button>
                    <button
                        onClick={() => exportarCSV('postulaciones')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        📑 Exportar Postulaciones
                    </button>
                </div>
            </div>

            {/* NAVEGACIÓN POR PESTAÑAS */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 flex gap-6 overflow-x-auto">
                <button
                    onClick={() => setTabActiva('usuarios')}
                    className={`py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tabActiva === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    👥 Directorio de Usuarios ({usuarios.length})
                </button>
                <button
                    onClick={() => setTabActiva('postulaciones')}
                    className={`py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tabActiva === 'postulaciones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    📑 {esAdmin ? 'Auditoría de Postulaciones' : 'Solicitudes a Mis Proyectos'} ({todasPostulaciones.length})
                </button>
                
                {esAdmin && (
                    <button
                        onClick={() => setTabActiva('avisos')}
                        className={`py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tabActiva === 'avisos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        📢 Enviar Comunicado Oficial
                    </button>
                )}
            </div>

            {/* CONTENIDO DE LAS PESTAÑAS */}
            <div className="p-6">

                {/* PESTAÑA 1: DIRECTORIO DE USUARIOS */}
                {tabActiva === 'usuarios' && (
                    <div>
                        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
                            <input
                                type="text"
                                value={busquedaUsuario}
                                onChange={(e) => setBusquedaUsuario(e.target.value)}
                                placeholder="Buscar por nombre, correo o número de control..."
                                className="w-full md:w-96 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">Filtrar rol:</span>
                                <select
                                    value={filtroRol}
                                    onChange={(e) => setFiltroRol(e.target.value)}
                                    className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
                                >
                                    <option value="Todos">Todos</option>
                                    <option value="Estudiante">Estudiantes</option>
                                    <option value="Investigador">Investigadores</option>
                                    <option value="Administrador">Administradores</option>
                                </select>
                            </div>
                        </div>

                        {loadingUsuarios ? (
                            <p className="text-center py-8 text-slate-500 text-sm">Cargando directorio...</p>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                                            <th className="p-3.5">Usuario</th>
                                            <th className="p-3.5">Información Académica</th>
                                            <th className="p-3.5">Contacto</th>
                                            <th className="p-3.5">Rol Asignado</th>
                                            {esAdmin && <th className="p-3.5 text-right">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {usuariosFiltrados.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50/80">
                                                <td className="p-3.5">
                                                    <p className="font-bold text-slate-800">
                                                        {u.grado_academico ? `${u.grado_academico} ` : ''}{u.nombre_completo}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{u.correo_institucional}</p>
                                                </td>
                                                <td className="p-3.5 text-xs text-slate-600">
                                                    {u.rol === 'Estudiante' ? (
                                                        <>
                                                            <span className="font-semibold text-slate-800 block">Matrícula: {u.numero_control || 'S/N'}</span>
                                                            <span>{u.carrera || 'Sin carrera'}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-500">Personal Docente / Investigador</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5 text-xs text-slate-600">
                                                    {u.telefono || 'No registrado'}
                                                </td>
                                                <td className="p-3.5">
                                                    {esAdmin ? (
                                                        <select
                                                            value={u.rol}
                                                            onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                                                            className={`text-xs font-bold px-2.5 py-1.5 rounded-md border outline-none cursor-pointer ${u.rol === 'Administrador' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                                                u.rol === 'Investigador' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                                                    'bg-blue-50 text-blue-800 border-blue-200'
                                                                }`}
                                                        >
                                                            <option value="Estudiante">Estudiante</option>
                                                            <option value="Investigador">Investigador</option>
                                                            <option value="Administrador">Administrador</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`text-xs font-bold px-2.5 py-1.5 rounded-md border ${
                                                            u.rol === 'Administrador' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                                                u.rol === 'Investigador' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                                                    'bg-blue-50 text-blue-800 border-blue-200'
                                                        }`}>
                                                            {u.rol}
                                                        </span>
                                                    )}
                                                </td>
                                                {esAdmin && (
                                                    <td className="p-3.5 text-right">
                                                        <button
                                                            onClick={() => handleEliminarUsuario(u.id, u.nombre_completo)}
                                                            className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* PESTAÑA 2: BANDEJA DE POSTULACIONES */}
                {tabActiva === 'postulaciones' && (
                    <div>
                        {loadingPostulaciones ? (
                            <p className="text-center py-8 text-slate-500 text-sm">Cargando postulaciones...</p>
                        ) : todasPostulaciones.length === 0 ? (
                            <p className="text-center py-8 text-slate-500 text-sm">No hay postulaciones registradas en esta vista.</p>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                                            <th className="p-3.5">Estudiante</th>
                                            <th className="p-3.5">Proyecto / Asesor</th>
                                            <th className="p-3.5">Kárdex</th>
                                            <th className="p-3.5">Estado</th>
                                            <th className="p-3.5 text-right">Dictamen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-sm">
                                        {todasPostulaciones.map((post) => (
                                            <tr key={post.id} className="hover:bg-slate-50/80">
                                                <td className="p-3.5">
                                                    <p className="font-bold text-slate-800">{post.estudiante?.nombre_completo}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {post.estudiante?.numero_control ? `${post.estudiante.numero_control} - ` : ''}
                                                        {post.estudiante?.correo_institucional}
                                                    </p>
                                                </td>
                                                <td className="p-3.5">
                                                    <p className="font-semibold text-slate-800 line-clamp-1">{post.proyecto?.titulo || 'Proyecto eliminado'}</p>
                                                    <p className="text-xs text-slate-500">Asesor: {post.proyecto?.investigador?.nombre_completo}</p>
                                                </td>
                                                <td className="p-3.5 text-xs">
                                                    {post.documento_kardex_url ? (
                                                        <a href={post.documento_kardex_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">
                                                            Ver documento ↗
                                                        </a>
                                                    ) : 'Sin adjunto'}
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${post.estado === 'Aceptado' ? 'bg-emerald-100 text-emerald-800' :
                                                        post.estado === 'Rechazado' ? 'bg-red-100 text-red-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                        {post.estado}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                                                    {post.estado !== 'Aceptado' && (
                                                        <button
                                                            onClick={() => handleDictamenAdmin(post, 'Aceptado')}
                                                            className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded font-semibold"
                                                        >
                                                            Aceptar
                                                        </button>
                                                    )}
                                                    {post.estado !== 'Rechazado' && (
                                                        <button
                                                            onClick={() => handleDictamenAdmin(post, 'Rechazado')}
                                                            className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded font-semibold"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEliminarPostulacion(post.id)}
                                                        className="text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded font-semibold ml-1"
                                                        title="Eliminar esta solicitud"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* PESTAÑA 3: COMUNICADOS GLOBALES (SOLO ADMIN) */}
                {esAdmin && tabActiva === 'avisos' && (
                    <form onSubmit={handleEnviarAvisoGlobal} className="max-w-xl space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Destinatarios del Comunicado
                            </label>
                            <select
                                value={destinoAviso}
                                onChange={(e) => setDestinoAviso(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Todos">Todos los usuarios registrados ({usuarios.length})</option>
                                <option value="Estudiante">Solo Estudiantes ({totalEstudiantes})</option>
                                <option value="Investigador">Solo Docentes / Investigadores ({totalInvestigadores})</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Mensaje de la Notificación
                            </label>
                            <textarea
                                required
                                rows="3"
                                value={mensajeGlobal}
                                onChange={(e) => setMensajeGlobal(e.target.value)}
                                placeholder="Ej. Se les recuerda que el cierre de registro de proyectos concluye este viernes a las 18:00 hrs..."
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={enviandoAviso}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                        >
                            {enviandoAviso ? 'Enviando notificaciones...' : 'Enviar Notificación en Tiempo Real'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}