import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const OPCIONES_CARRERAS = [
    "Ingeniería en Sistemas Computacionales",
    "Ingeniería en Gestión Empresarial",
    "Ingeniería Industrial",
    "Ingeniería en Administración",
    "Ingeniería en Industrias Alimentarias"
];

const OPCIONES_DEPARTAMENTOS = [
    "Departamento de Sistemas y Computación",
    "Departamento de Ciencias Básicas",
    "Departamento de Ingeniería Industrial",
    "Departamento de Económico-Administrativas"
];

// Función utilitaria para comprimir y recortar la imagen en el navegador
const comprimirImagen = (archivo, anchoMax = 400, altoMax = 400, calidad = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(archivo);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = anchoMax;
                canvas.height = altoMax;
                const ctx = canvas.getContext('2d');

                const menor = Math.min(img.width, img.height);
                const inicioX = (img.width - menor) / 2;
                const inicioY = (img.height - menor) / 2;

                ctx.drawImage(img, inicioX, inicioY, menor, menor, 0, 0, anchoMax, altoMax);

                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error('Error al procesar la imagen en el canvas'));
                    resolve(new File([blob], `avatar.webp`, { type: 'image/webp' }));
                }, 'image/webp', calidad);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export default function Perfil() {
    const { user } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);

    // Estados para edición de contacto
    const [telefono, setTelefono] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [subiendoAvatar, setSubiendoAvatar] = useState(false);
    const [guardandoInfo, setGuardandoInfo] = useState(false);

    // Estados para Perfil Específico (Estudiante / Investigador / Admin)
    const [semestre, setSemestre] = useState('');
    const [habilidades, setHabilidades] = useState('');
    const [enlacesProfesionales, setEnlacesProfesionales] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [lineasInvestigacion, setLineasInvestigacion] = useState('');
    const [ubicacionCubiculo, setUbicacionCubiculo] = useState('');
    const [guardandoPerfilRoles, setGuardandoPerfilRoles] = useState(false);

    // Estados para Edición Administrativa (Admin)
    const [modoAdminEdicion, setModoAdminEdicion] = useState(false);
    const [editNombre, setEditNombre] = useState('');
    const [editControl, setEditControl] = useState('');
    const [editCarrera, setEditCarrera] = useState('');
    const [guardandoAdminInfo, setGuardandoAdminInfo] = useState(false);

    // Estados para Reporte de Estudiantes
    const [isReporteModalOpen, setIsReporteModalOpen] = useState(false);
    const [mensajeReporte, setMensajeReporte] = useState('');
    const [enviandoReporte, setEnviandoReporte] = useState(false);

    // Estados para contraseña
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cambiandoPassword, setCambiandoPassword] = useState(false);

    // Estados para Métricas de Actividad
    const [metricaEstudiante, setMetricaEstudiante] = useState({ proyecto: 'Cargando...', entregables: 0 });
    const [metricaInvestigador, setMetricaInvestigador] = useState({ proyectos: 0, residentes: 0 });

    // 1. Cargar Perfil Inicial
    useEffect(() => {
        const cargarPerfil = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error al cargar perfil:", error);
            } else {
                setPerfil(data);
                setTelefono(data.telefono || '');
                setAvatarUrl(data.avatar_url || '');

                setSemestre(data.semestre || '');
                setHabilidades(data.habilidades || '');
                setEnlacesProfesionales(data.enlaces_profesionales || '');

                setDepartamento(data.departamento || '');
                setLineasInvestigacion(data.lineas_investigacion || '');
                setUbicacionCubiculo(data.ubicacion_cubiculo || '');

                setEditNombre(data.nombre_completo || '');
                setEditControl(data.numero_control || '');
                setEditCarrera(data.carrera || '');
            }
            setLoading(false);
        };
        cargarPerfil();
    }, [user]);

    // 2. Cargar Métricas Dinámicas basadas en el rol
    useEffect(() => {
        const cargarMetricas = async () => {
            if (!user) return;

            const rolUsuario = perfil?.rol || user?.rol;

            if (rolUsuario === 'Estudiante') {
                try {
                    // 1. Consultamos todas las postulaciones aceptadas
                    const { data: postsAceptadas, error: errorPost } = await supabase
                        .from('postulaciones')
                        .select('proyecto:proyectos(titulo)')
                        .eq('id_estudiante', user.id)
                        .eq('estado', 'Aceptado');

                    if (errorPost) throw errorPost;

                    let textoProyecto = 'Sin proyecto asignado';

                    if (postsAceptadas && postsAceptadas.length > 0) {
                        if (postsAceptadas.length === 1) {
                            textoProyecto = postsAceptadas[0].proyecto?.titulo || 'Proyecto asignado';
                        } else {
                            const primerTitulo = postsAceptadas[0].proyecto?.titulo || 'Proyecto';
                            textoProyecto = `${primerTitulo} (+${postsAceptadas.length - 1} más)`;
                        }
                    } else {
                        // 2. Si no tiene proyectos aceptados, revisamos si tiene postulaciones pendientes
                        const { count: countPendientes } = await supabase
                            .from('postulaciones')
                            .select('*', { count: 'exact', head: true })
                            .eq('id_estudiante', user.id)
                            .eq('estado', 'Pendiente');

                        if (countPendientes > 0) {
                            textoProyecto = `En espera de respuesta (${countPendientes} postulación${countPendientes > 1 ? 'es' : ''})`;
                        }
                    }

                    // 3. Contamos los entregables subidos
                    const { count: countEntregables } = await supabase
                        .from('tareas_entregables')
                        .select('*', { count: 'exact', head: true })
                        .eq('id_estudiante', user.id);

                    setMetricaEstudiante({
                        proyecto: textoProyecto,
                        entregables: countEntregables || 0
                    });
                } catch (err) {
                    console.error("Error cargando métricas de estudiante:", err);
                }

            } else {
                // Aplica tanto para 'Investigador' como para 'Administrador'
                try {
                    const { data: misProyectos } = await supabase
                        .from('proyectos')
                        .select('id')
                        .eq('investigador_id', user.id);

                    const countProyectos = misProyectos ? misProyectos.length : 0;
                    let countResidentes = 0;

                    if (countProyectos > 0) {
                        const idsProyectos = misProyectos.map(p => p.id);
                        
                        // En lugar de solo contar filas, traemos los IDs de los estudiantes
                        const { data: postAceptadas } = await supabase
                            .from('postulaciones')
                            .select('id_estudiante')
                            .in('id_proyecto', idsProyectos)
                            .eq('estado', 'Aceptado');
                        
                        if (postAceptadas) {
                            // Usamos un Set para filtrar y contar solo IDs únicos (personas reales)
                            const estudiantesUnicos = new Set(postAceptadas.map(p => p.id_estudiante));
                            countResidentes = estudiantesUnicos.size;
                        }
                    }

                    setMetricaInvestigador({
                        proyectos: countProyectos,
                        residentes: countResidentes
                    });
                } catch (err) {
                    console.error("Error cargando métricas:", err);
                }
            }
        };

        cargarMetricas();
    }, [perfil, user]);

    const handleSubirAvatar = async (e) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            setSubiendoAvatar(true);

            const fileOriginal = e.target.files[0];

            if (!fileOriginal.type.startsWith('image/')) {
                alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");
                setSubiendoAvatar(false);
                return;
            }

            const fileOptimizado = await comprimirImagen(fileOriginal, 400, 400, 0.85);

            const { data: archivosExistentes } = await supabase.storage
                .from('avatares')
                .list(user.id);

            if (archivosExistentes && archivosExistentes.length > 0) {
                const rutasABorrar = archivosExistentes.map(f => `${user.id}/${f.name}`);
                await supabase.storage.from('avatares').remove(rutasABorrar);
            }

            const filePath = `${user.id}/avatar.webp`;

            const { error: uploadError } = await supabase.storage
                .from('avatares')
                .upload(filePath, fileOptimizado, {
                    upsert: true,
                    contentType: 'image/webp'
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('avatares')
                .getPublicUrl(filePath);

            const publicUrlConCacheBuster = `${urlData.publicUrl}?t=${Date.now()}`;

            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ avatar_url: publicUrlConCacheBuster })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrlConCacheBuster);
            alert('¡Foto de perfil actualizada con éxito!');

        } catch (error) {
            alert('Error al procesar o subir la imagen: ' + error.message);
        } finally {
            setSubiendoAvatar(false);
        }
    };

    const handleActualizarDatos = async (e) => {
        e.preventDefault();
        setGuardandoInfo(true);
        const { error } = await supabase
            .from('usuarios')
            .update({ telefono: telefono })
            .eq('id', user.id);

        if (error) {
            alert('Error al guardar datos de contacto: ' + error.message);
        } else {
            alert('Datos de contacto actualizados correctamente.');
        }
        setGuardandoInfo(false);
    };

    const handleActualizarPerfilRol = async (e) => {
        e.preventDefault();

        if (!perfil) {
            alert("El perfil no está cargado completamente.");
            return;
        }

        setGuardandoPerfilRoles(true);

        let updates;

        if (perfil.rol === 'Estudiante') {
            updates = {
                semestre: semestre ? parseInt(semestre) : null,
                habilidades: habilidades,
                enlaces_profesionales: enlacesProfesionales
            };
        } else {
            updates = {
                departamento: departamento,
                lineas_investigacion: lineasInvestigacion,
                ubicacion_cubiculo: ubicacionCubiculo
            };
        }

        const { error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('id', user.id);

        if (error) {
            alert('Error al actualizar tu perfil: ' + error.message);
        } else {
            alert('¡Perfil profesional actualizado con éxito!');
        }
        setGuardandoPerfilRoles(false);
    };

    const handleActualizarDatosAdmin = async () => {
        setGuardandoAdminInfo(true);
        const { error } = await supabase
            .from('usuarios')
            .update({
                nombre_completo: editNombre,
                numero_control: editControl,
                carrera: editCarrera
            })
            .eq('id', user.id);

        if (error) {
            alert('Error al modificar los datos: ' + error.message);
        } else {
            setPerfil(prev => ({
                ...prev,
                nombre_completo: editNombre,
                numero_control: editControl,
                carrera: editCarrera
            }));
            setModoAdminEdicion(false);
            alert('Perfil administrativo actualizado con éxito.');
        }
        setGuardandoAdminInfo(false);
    };

    const enviarReporteCorreccion = async (e) => {
        e.preventDefault();
        if (!mensajeReporte.trim()) return;
        setEnviandoReporte(true);

        const { data: adminUser } = await supabase
            .from('usuarios')
            .select('id')
            .eq('rol', 'Administrador')
            .limit(1)
            .single();

        if (adminUser) {
            const { error } = await supabase.from('notificaciones').insert([{
                usuario_id: adminUser.id,
                tipo: 'soporte',
                mensaje: `El estudiante ${perfil.nombre_completo} solicita una corrección en su perfil: "${mensajeReporte}"`
            }]);

            if (error) {
                alert('Hubo un error al enviar el reporte.');
            } else {
                alert('Solicitud enviada correctamente a Servicios Escolares/Administrador.');
                setIsReporteModalOpen(false);
                setMensajeReporte('');
            }
        } else {
            alert('No se encontró a un administrador en el sistema para recibir el reporte.');
        }
        setEnviandoReporte(false);
    };

    const handleCambiarPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }
        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setCambiandoPassword(true);
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            alert('Error al actualizar contraseña: ' + error.message);
        } else {
            alert('¡Contraseña actualizada con éxito!');
            setNewPassword('');
            setConfirmPassword('');
        }
        setCambiandoPassword(false);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center text-slate-500">Cargando tu perfil...</div>;
    if (!perfil) return <div className="min-h-screen flex justify-center items-center text-slate-500">No se encontró la información del usuario.</div>;

    const iniciales = perfil.nombre_completo
        ? perfil.nombre_completo.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'US';

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
                <Link to="/dashboard" className="text-xl font-bold text-blue-900 hover:opacity-90 transition-opacity">
                    TecNM <span className="text-blue-600">Gestión Interna</span>
                </Link>
                <Link to="/dashboard" className="text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-semibold transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Volver al Dashboard
                </Link>
            </nav>

            <main className="max-w-4xl mx-auto px-6 mt-10">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Mi Perfil</h2>
                        <p className="text-slate-500 mt-1">Administra tu información personal y credenciales de acceso</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* COLUMNA IZQUIERDA: Tarjeta de Identidad y Avatar */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 w-full h-28 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-t-xl"></div>

                            <div className="relative mt-8 mb-4 w-32 h-32 flex justify-center items-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md bg-white relative z-10" />
                                ) : (
                                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 z-10 relative">
                                        {iniciales}
                                    </div>
                                )}

                                <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors border-2 border-white z-20 flex items-center justify-center" title="Cambiar foto de perfil">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleSubirAvatar} disabled={subiendoAvatar} />
                                </label>
                            </div>

                            {subiendoAvatar && <p className="text-xs text-blue-600 mb-2 font-medium animate-pulse">Optimizando y subiendo...</p>}

                            {!modoAdminEdicion ? (
                                <>
                                    <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{perfil.nombre_completo}</h3>
                                    <span className={`text-xs px-3 py-1 rounded-full font-bold mb-4 ${perfil.rol === 'Administrador' ? 'bg-amber-100 text-amber-800' : perfil.rol === 'Investigador' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {perfil.rol}
                                    </span>
                                </>
                            ) : (
                                <div className="w-full mb-4 space-y-2">
                                    <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm text-center font-bold" placeholder="Nombre completo" />
                                    <span className="inline-block text-xs px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-800">{perfil.rol}</span>
                                </div>
                            )}

                            <div className="w-full text-left space-y-3 mt-2 pt-5 border-t border-slate-100 text-sm">
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Correo Electrónico</p>
                                    <p className="font-medium text-slate-700 truncate">{perfil.correo_institucional}</p>
                                </div>

                                {(!modoAdminEdicion) ? (
                                    <>
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Número de Control</p>
                                            <p className="font-medium text-slate-700">{perfil.numero_control || 'No registrado'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Carrera / Área</p>
                                            <p className="font-medium text-slate-700">{perfil.carrera || 'No registrada'}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5 block">Número de Control / Empleado</label>
                                            <input type="text" value={editControl} onChange={(e) => setEditControl(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5 block">Carrera / Área</label>
                                            <select value={editCarrera} onChange={(e) => setEditCarrera(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white">
                                                <option value="">Selecciona área</option>
                                                {OPCIONES_CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {perfil.rol === 'Administrador' && (
                                    <div className="pt-4 border-t border-slate-100 mt-4">
                                        {!modoAdminEdicion ? (
                                            <button onClick={() => setModoAdminEdicion(true)} className="w-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2 rounded-md transition-colors">
                                                Habilitar Edición de Lectura
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={() => setModoAdminEdicion(false)} className="flex-1 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 py-2 rounded-md">Cancelar</button>
                                                <button onClick={handleActualizarDatosAdmin} disabled={guardandoAdminInfo} className="flex-1 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-md">
                                                    {guardandoAdminInfo ? 'Guardando...' : 'Guardar'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {perfil.rol !== 'Administrador' && (
                                    <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 mt-4">
                                        <p className="mb-2">Tus datos académicos oficiales son de <b>solo lectura</b>.</p>
                                        <button
                                            onClick={() => setIsReporteModalOpen(true)}
                                            className="font-bold underline hover:text-blue-600 transition-colors"
                                        >
                                            Solicitar corrección de datos →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Formularios de Edición */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Tarjeta de Perfil Profesional Académico (Visible para todos) */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    Perfil Académico / Profesional
                                </h3>
                            </div>
                            <form onSubmit={handleActualizarPerfilRol} className="p-6">

                                {perfil.rol === 'Estudiante' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Semestre Actual</label>
                                            <input
                                                type="number"
                                                min="1" max="12"
                                                value={semestre}
                                                onChange={(e) => setSemestre(e.target.value)}
                                                placeholder="Ej. 8"
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Habilidades Técnicas / Tecnologías</label>
                                            <textarea
                                                rows="2"
                                                value={habilidades}
                                                onChange={(e) => setHabilidades(e.target.value)}
                                                placeholder="Ej. React, Python, Diseño de Circuitos, AutoCAD..."
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Enlaces Profesionales (LinkedIn / GitHub)</label>
                                            <input
                                                type="text"
                                                value={enlacesProfesionales}
                                                onChange={(e) => setEnlacesProfesionales(e.target.value)}
                                                placeholder="https://github.com/tuusuario"
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* Para Investigadores y Administradores */
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Departamento de Adscripción</label>
                                            <select
                                                value={departamento}
                                                onChange={(e) => setDepartamento(e.target.value)}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
                                            >
                                                <option value="">Selecciona tu departamento...</option>
                                                {OPCIONES_DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Líneas de Investigación / Especialidad</label>
                                            <textarea
                                                rows="2"
                                                value={lineasInvestigacion}
                                                onChange={(e) => setLineasInvestigacion(e.target.value)}
                                                placeholder="Ej. Inteligencia Artificial, Redes de Sensores..."
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Ubicación / Cubículo para Asesorías</label>
                                            <input
                                                type="text"
                                                value={ubicacionCubiculo}
                                                onChange={(e) => setUbicacionCubiculo(e.target.value)}
                                                placeholder="Ej. Edificio K, Cubículo 4"
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end mt-4">
                                    <button
                                        type="submit"
                                        disabled={guardandoPerfilRoles}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {guardandoPerfilRoles ? 'Guardando...' : 'Guardar Perfil Profesional'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    Información de Contacto
                                </h3>
                            </div>
                            <form onSubmit={handleActualizarDatos} className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Teléfono (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        placeholder="Ej. 983 123 4567"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={guardandoInfo}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {guardandoInfo ? 'Guardando...' : 'Guardar Contacto'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    Seguridad y Contraseña
                                </h3>
                            </div>
                            <form onSubmit={handleCambiarPassword} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            required
                                            minLength="6"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            required
                                            minLength="6"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repite la contraseña"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={cambiandoPassword || !newPassword || !confirmPassword}
                                        className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {cambiandoPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* SECCIÓN INFERIOR: HISTORIAL Y MÉTRICAS (Disponible para todos) */}
                    <div className="md:col-span-3 mt-2">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                Resumen de Actividad
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {perfil?.rol === 'Estudiante' ? (
                                    <>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center">
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Proyecto Asignado Actual</span>
                                            <span className="text-base font-semibold text-slate-800 truncate">{metricaEstudiante.proyecto}</span>
                                        </div>
                                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex flex-col justify-center">
                                            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Total de Entregables Subidos</span>
                                            <span className="text-3xl font-extrabold text-emerald-700">{metricaEstudiante.entregables}</span>
                                        </div>
                                    </>
                                ) : (
                                    /* Para Investigadores y Administradores */
                                    <>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-center">
                                            <span className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Proyectos Publicados</span>
                                            <span className="text-3xl font-extrabold text-blue-700">{metricaInvestigador.proyectos}</span>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col justify-center">
                                            <span className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">Residentes a tu cargo</span>
                                            <span className="text-3xl font-extrabold text-purple-700">{metricaInvestigador.residentes}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* MODAL REPORTE DE ESTUDIANTE */}
            {isReporteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Solicitar Corrección</h3>
                            <button onClick={() => setIsReporteModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>
                        <form onSubmit={enviarReporteCorreccion} className="p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                Describe cuál es el error en tu perfil (ej. "Mi número de control correcto es 21010045 y mi carrera es Ingeniería Industrial").
                            </p>
                            <textarea
                                required
                                rows="4"
                                value={mensajeReporte}
                                onChange={(e) => setMensajeReporte(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4 text-sm"
                                placeholder="Escribe tu solicitud aquí..."
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsReporteModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-100 rounded-lg">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={enviandoReporte} className="px-4 py-2 text-sm bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg disabled:opacity-50 shadow-sm">
                                    {enviandoReporte ? 'Enviando...' : 'Enviar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}