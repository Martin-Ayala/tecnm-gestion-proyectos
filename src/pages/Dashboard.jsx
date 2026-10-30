import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import NotificacionesBell from "../components/NotificacionesBell";
import AdminPanel from "../components/AdminPanel";

const OPCIONES_CARRERAS = [
  "Multidisciplinario (Todas las carreras)",
  "Ingeniería en Sistemas Computacionales",
  "Ingeniería en Gestión Empresarial",
  "Ingeniería Industrial",
  "Ingeniería en Administración",
  "Ingeniería en Industrias Alimentarias"
];

const OPCIONES_MODALIDAD = ["Presencial", "Híbrida", "Virtual"];

export default function Dashboard() {
  const { user } = useAuth();

  const [loadingDatos, setLoadingDatos] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Estados para TODOS los proyectos (Catálogo General)
  const [proyectos, setProyectos] = useState([]);

  // Estados para Búsqueda y Filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [filtroCarrera, setFiltroCarrera] = useState('Todas');

  // Estados exclusivos del ESTUDIANTE
  const [misPostulaciones, setMisPostulaciones] = useState([]);

  // Estados Modal CREAR PROYECTO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoPlanteamiento, setNuevoPlanteamiento] = useState('');
  const [nuevoObjetivoGeneral, setNuevoObjetivoGeneral] = useState('');
  const [nuevoObjetivosEspecificos, setNuevoObjetivosEspecificos] = useState('');
  const [nuevaDelimitacion, setNuevaDelimitacion] = useState('');
  const [cuposRequeridos, setCuposRequeridos] = useState(1);
  const [nuevaModalidad, setNuevaModalidad] = useState('Presencial');
  const [nuevaCarrera, setNuevaCarrera] = useState(OPCIONES_CARRERAS[0]);
  const [protocoloFile, setProtocoloFile] = useState(null);
  const [protocoloUrl, setProtocoloUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados Modal EDITAR PROYECTO
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editPlanteamiento, setEditPlanteamiento] = useState('');
  const [editObjetivoGeneral, setEditObjetivoGeneral] = useState('');
  const [editObjetivosEspecificos, setEditObjetivosEspecificos] = useState('');
  const [editDelimitacion, setEditDelimitacion] = useState('');
  const [editEstado, setEditEstado] = useState('');
  const [editCupos, setEditCupos] = useState(1);
  const [editModalidad, setEditModalidad] = useState('Presencial');
  const [editCarrera, setEditCarrera] = useState('');
  const [editProtocoloFile, setEditProtocoloFile] = useState(null);
  const [editProtocoloUrl, setEditProtocoloUrl] = useState('');

  const [isPostulacionesModalOpen, setIsPostulacionesModalOpen] = useState(false);
  const [postulaciones, setPostulaciones] = useState([]);
  const [loadingPostulaciones, setLoadingPostulaciones] = useState(false);
  const [proyectoActualTit, setProyectoActualTit] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const fetchDatos = async () => {
      if (!user) return;
      setLoadingDatos(true);

      const { data: dataProyectos, error: errProyectos } = await supabase
        .from('proyectos')
        .select(`*, investigador:usuarios!investigador_id(nombre_completo), postulaciones:postulaciones!id_proyecto(id, estado)`)
        .order('fecha_creacion', { ascending: false });

      if (errProyectos) console.error("Error cargando proyectos:", errProyectos);
      else setProyectos(dataProyectos || []);

      if (user.rol === 'Estudiante') {
        const { data: dataMisPost, error: errMisPost } = await supabase
          .from('postulaciones')
          .select(`id, estado, fecha_postulacion, proyecto:proyectos!id_proyecto(id, titulo, planteamiento_problema, descripcion, investigador:usuarios!investigador_id(nombre_completo))`)
          .eq('id_estudiante', user.id)
          .order('fecha_postulacion', { ascending: false });

        if (errMisPost) console.error("Error cargando mis postulaciones:", errMisPost);
        else setMisPostulaciones(dataMisPost || []);
      }

      setLoadingDatos(false);
    };
    fetchDatos();
  }, [refresh, user]);

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalUrl = '';

    if (protocoloFile) {
      const ext = protocoloFile.name.split('.').pop();
      const fileName = `protocolo_${Date.now()}_${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documentos').upload(`protocolos/${fileName}`, protocoloFile);
      if (uploadError) { alert("Error al subir protocolo: " + uploadError.message); setIsSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(`protocolos/${fileName}`);
      finalUrl = urlData.publicUrl;
    } else if (protocoloUrl) {
      finalUrl = protocoloUrl;
    }

    const { error } = await supabase.from('proyectos').insert([{
      titulo: nuevoTitulo, planteamiento_problema: nuevoPlanteamiento, objetivo_general: nuevoObjetivoGeneral,
      objetivos_especificos: nuevoObjetivosEspecificos, delimitacion: nuevaDelimitacion,
      estado: 'En preparación', investigador_id: user.id, cupos_requeridos: cuposRequeridos,
      documento_protocolo_url: finalUrl, modalidad: nuevaModalidad, carrera: nuevaCarrera,
      descripcion: nuevoPlanteamiento, objetivo: nuevoObjetivoGeneral, pre_requisitos: nuevoObjetivosEspecificos, requisitos: nuevaDelimitacion
    }]);

    if (error) { alert(`Error al crear: ${error.message}`); console.error(error); }
    else {
      setIsModalOpen(false);
      setNuevoTitulo(''); setNuevoPlanteamiento(''); setNuevoObjetivoGeneral('');
      setNuevoObjetivosEspecificos(''); setNuevaDelimitacion(''); setCuposRequeridos(1);
      setNuevaModalidad('Presencial'); setNuevaCarrera(OPCIONES_CARRERAS[0]);
      setProtocoloFile(null); setProtocoloUrl('');
      setRefresh(prev => prev + 1);
    }
    setIsSubmitting(false);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proyecto de forma permanente?")) return;
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) alert("Error al intentar eliminar el proyecto.");
    else setRefresh(prev => prev + 1);
  };

  const abrirModalEdicion = (proyecto) => {
    setProyectoEditando(proyecto.id);
    setEditTitulo(proyecto.titulo);
    setEditPlanteamiento(proyecto.planteamiento_problema || proyecto.descripcion || '');
    setEditObjetivoGeneral(proyecto.objetivo_general || proyecto.objetivo || '');
    setEditObjetivosEspecificos(proyecto.objetivos_especificos || proyecto.pre_requisitos || '');
    setEditDelimitacion(proyecto.delimitacion || proyecto.requisitos || '');
    setEditEstado(proyecto.estado === 'Borrador' ? 'En preparación' : (proyecto.estado || 'En preparación'));
    setEditCupos(proyecto.cupos_requeridos || 1);
    setEditModalidad(proyecto.modalidad || 'Presencial');
    setEditCarrera(proyecto.carrera || OPCIONES_CARRERAS[0]);
    setEditProtocoloUrl(proyecto.documento_protocolo_url || '');
    setEditProtocoloFile(null);
    setIsEditModalOpen(true);
  };

  const handleActualizarProyecto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalUrl = editProtocoloUrl;

    if (editProtocoloFile) {
      const ext = editProtocoloFile.name.split('.').pop();
      const fileName = `protocolo_${Date.now()}_${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documentos').upload(`protocolos/${fileName}`, editProtocoloFile);
      if (uploadError) { alert("Error al subir protocolo: " + uploadError.message); setIsSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(`protocolos/${fileName}`);
      finalUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('proyectos').update({
      titulo: editTitulo, planteamiento_problema: editPlanteamiento, objetivo_general: editObjetivoGeneral,
      objetivos_especificos: editObjetivosEspecificos, delimitacion: editDelimitacion, estado: editEstado, cupos_requeridos: editCupos,
      documento_protocolo_url: finalUrl, modalidad: editModalidad, carrera: editCarrera,
      descripcion: editPlanteamiento, objetivo: editObjetivoGeneral, pre_requisitos: editObjetivosEspecificos, requisitos: editDelimitacion
    }).eq('id', proyectoEditando);

    if (error) alert("Error al guardar los cambios.");
    else { setIsEditModalOpen(false); setRefresh(prev => prev + 1); }
    setIsSubmitting(false);
  };

  const abrirModalPostulaciones = async (proyecto) => {
    setProyectoActualTit(proyecto.titulo); setIsPostulacionesModalOpen(true); setLoadingPostulaciones(true);
    const { data, error } = await supabase.from('postulaciones').select('*, estudiante:usuarios!id_estudiante(nombre_completo, correo_institucional)').eq('id_proyecto', proyecto.id).order('fecha_postulacion', { ascending: false });
    if (error) console.error("Error cargando postulaciones:", error);
    else setPostulaciones(data);
    setLoadingPostulaciones(false);
  };

  const cambiarEstadoPostulacion = async (postulacionId, nuevoEstado) => {
    const post = postulaciones.find(p => p.id === postulacionId);
    const { error } = await supabase.from('postulaciones').update({ estado: nuevoEstado }).eq('id', postulacionId);
    if (error) { alert("Error al actualizar el estado."); } else {
      setPostulaciones(postulaciones.map(p => p.id === postulacionId ? { ...p, estado: nuevoEstado } : p));
      setRefresh(prev => prev + 1);
      if (post?.id_estudiante) { await supabase.from('notificaciones').insert([{ usuario_id: post.id_estudiante, tipo: nuevoEstado.toLowerCase(), mensaje: `Tu postulación al proyecto "${proyectoActualTit}" ha sido ${nuevoEstado.toLowerCase()}.` }]); }
    }
  };

  const totalProyectos = proyectos.length;
  const proyectosActivos = proyectos.filter(p => p.estado?.toLowerCase() === 'activo').length;
  const proyectosFinalizados = proyectos.filter(p => p.estado?.toLowerCase() === 'finalizado').length;
  const proyectosPreparacion = proyectos.filter(p => !p.estado || p.estado?.toLowerCase() === 'en preparación' || p.estado?.toLowerCase() === 'borrador').length;
  const datosGraficaEstado = [{ name: 'Activos', cantidad: proyectosActivos, color: '#10b981' }, { name: 'Finalizados', cantidad: proyectosFinalizados, color: '#3b82f6' }, { name: 'En preparación', cantidad: proyectosPreparacion, color: '#64748b' }];

  // Proyectos creados por el docente logueado
  const misProyectosDocente = proyectos.filter(p => p.investigador_id === user?.id);

  // Lógica de filtrado en catálogo general
  const proyectosFiltrados = proyectos.filter((proy) => {
    const textoBuscar = busqueda.toLowerCase();
    const coincideTexto = proy.titulo?.toLowerCase().includes(textoBuscar) || (proy.planteamiento_problema || proy.descripcion)?.toLowerCase().includes(textoBuscar) || proy.investigador?.nombre_completo?.toLowerCase().includes(textoBuscar);
    const coincideEstado = filtroEstado === 'Todos' || proy.estado?.toLowerCase() === filtroEstado.toLowerCase();
    const coincideModalidad = filtroModalidad === 'Todas' || proy.modalidad === filtroModalidad;
    const coincideCarrera = filtroCarrera === 'Todas' || proy.carrera === filtroCarrera;

    return coincideTexto && coincideEstado && coincideModalidad && coincideCarrera;
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* BARRA DE NAVEGACIÓN CON ACCESO AL HOME */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-blue-900 hover:opacity-90 transition-opacity">
            TecNM <span className="text-blue-600">Gestión Interna</span>
          </Link>
          <Link 
            to="/" 
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Ir al Inicio
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 hidden md:block">{user?.nombre_completo} <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs ml-2">{user?.rol}</span></span>
          <NotificacionesBell />
          <Link 
            to="/" 
            className="sm:hidden text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
          >
            Inicio
          </Link>
          <button onClick={handleLogout} className="text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-semibold transition-colors">Cerrar Sesión</button>
        </div>
      </nav>

      <main className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">

        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-bold text-slate-800">Dashboard Analítico</h2><p className="text-slate-500 text-sm mt-1">Métricas operativas del periodo 2026</p></div>
          {(user?.rol === 'Investigador' || user?.rol === 'Administrador') && (
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg> Nuevo Proyecto
            </button>
          )}
        </div>

        {!loadingDatos && proyectos.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center"><span className="text-slate-500 text-sm font-medium mb-1">Total Registrados</span><span className="text-3xl font-bold text-slate-800">{totalProyectos}</span></div>
              <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center"><span className="text-emerald-600 text-sm font-medium mb-1">Activos</span><span className="text-3xl font-bold text-emerald-700">{proyectosActivos}</span></div>
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center"><span className="text-blue-600 text-sm font-medium mb-1">Finalizados</span><span className="text-3xl font-bold text-blue-700">{proyectosFinalizados}</span></div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center"><span className="text-slate-500 text-sm font-medium mb-1">En preparación</span><span className="text-3xl font-bold text-slate-600">{proyectosPreparacion}</span></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col"><h3 className="text-slate-700 font-semibold mb-4">Distribución por Estado</h3><div className="flex-1"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={datosGraficaEstado} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="cantidad">{datosGraficaEstado.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36} /></PieChart></ResponsiveContainer></div></div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col"><h3 className="text-slate-700 font-semibold mb-4">Volumen de Proyectos</h3><div className="flex-1"><ResponsiveContainer width="100%" height="100%"><BarChart data={datosGraficaEstado} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} /><Tooltip cursor={{ fill: '#f1f5f9' }} /><Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>{datosGraficaEstado.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div></div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECCIÓN: MIS PROYECTOS (DOCENTE / ADMIN)  */}
        {/* ========================================== */}
        {(user?.rol === 'Investigador' || user?.rol === 'Administrador') && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Mis Proyectos Asignados</h3>
                <p className="text-xs text-slate-500">Propuestas bajo tu asesoría y autoría técnica</p>
              </div>
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {misProyectosDocente.length} {misProyectosDocente.length === 1 ? 'proyecto' : 'proyectos'}
              </span>
            </div>

            {misProyectosDocente.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
                Aún no has creado ningún proyecto. Haz clic en "Nuevo Proyecto" para publicar una propuesta.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {misProyectosDocente.map((proyecto) => {
                  const aceptados = proyecto.postulaciones ? proyecto.postulaciones.filter(p => p.estado === 'Aceptado').length : 0;
                  const pendientes = proyecto.postulaciones ? proyecto.postulaciones.filter(p => p.estado === 'Pendiente').length : 0;
                  const cuposTotales = proyecto.cupos_requeridos || 1;
                  const estaLleno = aceptados >= cuposTotales;
                  const porcentaje = Math.min(100, Math.round((aceptados / cuposTotales) * 100));

                  return (
                    <div key={proyecto.id} className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-200 hover:shadow-md transition-all flex flex-col h-full relative">
                      
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-bold text-lg text-slate-800 leading-tight">{proyecto.titulo}</h4>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${proyecto.estado?.toLowerCase() === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            proyecto.estado?.toLowerCase() === 'finalizado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                          {proyecto.estado === 'Borrador' ? 'En preparación' : (proyecto.estado || 'En preparación')}
                        </span>
                      </div>

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

                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-grow">
                        {proyecto.planteamiento_problema || proyecto.descripcion}
                      </p>

                      <div className="mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-medium text-slate-600">Cupos:</span>
                          <span className={`font-bold ${estaLleno ? 'text-red-600' : 'text-blue-600'}`}>
                            {aceptados} / {cuposTotales} {estaLleno ? '(Lleno)' : 'ocupados'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${estaLleno ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-auto gap-2">
                        <button
                          onClick={() => abrirModalPostulaciones(proyecto)}
                          className="relative text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                        >
                          Solicitudes
                          {pendientes > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                              {pendientes}
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <Link to={`/proyecto/${proyecto.id}`} className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                            Espacio
                          </Link>
                          <button onClick={() => abrirModalEdicion(proyecto)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => handleEliminar(proyecto.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                            Borrar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN: MIS POSTULACIONES (ESTUDIANTE) */}
        {user?.rol === 'Estudiante' && (
          <div className="mb-12">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Mis Postulaciones</h3>
            {misPostulaciones.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">Aún no te has postulado a ningún proyecto.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {misPostulaciones.map((post) => (
                  <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3 gap-4">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{post.proyecto?.titulo || 'Proyecto Eliminado'}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border flex-shrink-0 ${post.estado === 'Aceptado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : post.estado === 'Rechazado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{post.estado}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 flex-grow line-clamp-2">{post.proyecto?.planteamiento_problema || post.proyecto?.descripcion}</p>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                      <div className="text-xs text-slate-500">Profesor: <span className="font-semibold text-slate-700 uppercase">{post.proyecto?.investigador?.nombre_completo}</span></div>
                      <Link to={`/proyecto/${post.proyecto?.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-md">Ver Detalles</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL DE GESTIÓN INTELIGENTE (ADMINISTRADOR E INVESTIGADOR) */}
        {(user?.rol === 'Administrador' || user?.rol === 'Investigador') && (
          <AdminPanel
            onRefreshProyectos={() => setRefresh(prev => prev + 1)}
            user={user}
          />
        )}

        {/* BARRA DE BÚSQUEDA Y FILTRADO */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 mb-6">
          <div className="relative w-full">
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por proyecto, planteamiento o docente..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="Todos">Estado: Todos</option><option value="Activo">Activos</option><option value="En preparación">En preparación</option><option value="Finalizado">Finalizados</option>
            </select>

            <select value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="Todas">Modalidad: Todas</option>
              {OPCIONES_MODALIDAD.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select value={filtroCarrera} onChange={(e) => setFiltroCarrera(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[200px] truncate">
              <option value="Todas">Carrera: Todas</option>
              {OPCIONES_CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {(busqueda || filtroEstado !== 'Todos' || filtroModalidad !== 'Todas' || filtroCarrera !== 'Todas') && (
              <button onClick={() => { setBusqueda(''); setFiltroEstado('Todos'); setFiltroModalidad('Todas'); setFiltroCarrera('Todas'); }} className="text-xs text-red-600 hover:text-red-700 font-bold whitespace-nowrap px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto">
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Catálogo General de Proyectos</h3>

        {loadingDatos ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">Cargando base de datos...</div>
        ) : proyectos.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center"><div className="text-slate-400 mb-2 text-4xl">📂</div><h3 className="text-lg font-medium text-slate-700">El sistema está vacío</h3></div>
        ) : proyectosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300"><svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="text-slate-500 text-sm">No se encontraron proyectos con los criterios de búsqueda.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectosFiltrados.map((proyecto) => {
              const aceptados = proyecto.postulaciones ? proyecto.postulaciones.filter(p => p.estado === 'Aceptado').length : 0;
              const cuposTotales = proyecto.cupos_requeridos || 1;
              const estaLleno = aceptados >= cuposTotales;
              const porcentaje = Math.min(100, Math.round((aceptados / cuposTotales) * 100));

              return (
                <div key={proyecto.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{proyecto.titulo}</h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {estaLleno && (<span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">Lleno</span>)}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${proyecto.estado?.toLowerCase() === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : proyecto.estado?.toLowerCase() === 'finalizado' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>{proyecto.estado === 'Borrador' ? 'En preparación' : (proyecto.estado || 'En preparación')}</span>
                    </div>
                  </div>

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

                  <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">{proyecto.planteamiento_problema || proyecto.descripcion}</p>

                  <div className="mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1.5"><span className="font-medium text-slate-600">Cupos de Residentes:</span><span className={`font-bold ${estaLleno ? 'text-red-600' : 'text-blue-600'}`}>{aceptados} / {cuposTotales} {estaLleno ? '(Sin cupo)' : 'ocupados'}</span></div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className={`h-full transition-all duration-300 ${estaLleno ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${porcentaje}%` }} /></div>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-auto">
                    <div className="text-xs text-slate-500">Investigador: <span className="font-medium text-slate-700 block uppercase">{proyecto.investigador?.nombre_completo || 'No asignado'}</span></div>
                    <div className="flex gap-2.5 items-center flex-wrap justify-end">
                      <Link to={`/proyecto/${proyecto.id}`} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Ver Detalle</Link>
                      {(user?.id === proyecto.investigador_id || user?.rol === 'Administrador') && (
                        <><button onClick={() => abrirModalPostulaciones(proyecto)} className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">Solicitudes</button><button onClick={() => abrirModalEdicion(proyecto)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Editar</button><button onClick={() => handleEliminar(proyecto.id)} className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">Borrar</button></>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {(user?.rol === 'Investigador' || user?.rol === 'Administrador') && (
        <>
          {/* MODAL: VER POSTULACIONES */}
          {isPostulacionesModalOpen && (
            <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800 truncate pr-4">Solicitudes: {proyectoActualTit}</h3><button onClick={() => setIsPostulacionesModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl flex-shrink-0">✕</button></div>
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                  {loadingPostulaciones ? (<p className="text-center text-slate-500 py-4">Cargando solicitudes...</p>) : postulaciones.length === 0 ? (<div className="text-center py-8"><p className="text-4xl mb-2">📬</p><p className="text-slate-500 font-medium">Aún no hay alumnos postulados a este proyecto.</p></div>) : (
                    <div className="space-y-4">
                      {postulaciones.map(postulacion => (
                        <div key={postulacion.id} className="border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 uppercase text-lg">{postulacion.estudiante?.nombre_completo || 'Alumno Desconocido'}</p>
                            <p className="text-sm text-blue-600 font-medium mb-3">{postulacion.estudiante?.correo_institucional}</p>
                            <div className="bg-white p-3 rounded border border-slate-200 mb-3"><p className="text-xs font-bold text-slate-500 uppercase mb-1">Carta de Motivos:</p><p className="text-sm text-slate-700 italic">"{postulacion.mensaje_estudiante || 'Sin mensaje'}"</p></div>
                            <div className="flex items-center gap-4 text-sm">
                              <p className="text-slate-500">Estado: <span className={`font-bold ${postulacion.estado === 'Aceptado' ? 'text-emerald-600' : postulacion.estado === 'Rechazado' ? 'text-red-600' : 'text-amber-600'}`}>{postulacion.estado}</span></p>
                              {postulacion.documento_kardex_url && (<a href={postulacion.documento_kardex_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg> Ver Kardex</a>)}
                            </div>
                          </div>
                          <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                            {postulacion.estado !== 'Aceptado' && (<button onClick={() => cambiarEstadoPostulacion(postulacion.id, 'Aceptado')} className="flex-1 md:flex-none bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-6 py-2 rounded-md text-sm font-bold transition-colors shadow-sm">Aceptar</button>)}
                            {postulacion.estado !== 'Rechazado' && (<button onClick={() => cambiarEstadoPostulacion(postulacion.id, 'Rechazado')} className="flex-1 md:flex-none bg-red-100 text-red-700 hover:bg-red-200 px-6 py-2 rounded-md text-sm font-bold transition-colors shadow-sm">Rechazar</button>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODAL: CREAR */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0"><h3 className="text-lg font-bold text-slate-800">Crear Nuevo Proyecto</h3></div>
                <form onSubmit={handleCrearProyecto} className="p-6 space-y-4 overflow-y-auto">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Título</label><input type="text" required value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Planteamiento del problema</label><textarea required rows="3" value={nuevoPlanteamiento} onChange={(e) => setNuevoPlanteamiento(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Objetivo general</label><textarea required rows="2" value={nuevoObjetivoGeneral} onChange={(e) => setNuevoObjetivoGeneral(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Objetivos Específicos</label><textarea required rows="2" value={nuevoObjetivosEspecificos} onChange={(e) => setNuevoObjetivosEspecificos(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Delimitación</label><textarea required rows="2" value={nuevaDelimitacion} onChange={(e) => setNuevaDelimitacion(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cupos Requeridos</label>
                      <input type="number" min="1" max="10" required value={cuposRequeridos} onChange={(e) => setCuposRequeridos(parseInt(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Modalidad</label>
                      <select value={nuevaModalidad} onChange={(e) => setNuevaModalidad(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        {OPCIONES_MODALIDAD.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Carrera Destino</label>
                      <select value={nuevaCarrera} onChange={(e) => setNuevaCarrera(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none truncate">
                        {OPCIONES_CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Protocolo Oficial / Convocatoria (Opcional)</label>
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Subir Archivo PDF</label><input type="file" accept=".pdf" onChange={(e) => { setProtocoloFile(e.target.files[0]); setProtocoloUrl(''); }} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" /></div>
                      <div className="flex items-center gap-2"><hr className="flex-grow border-slate-200" /><span className="text-xs text-slate-400 font-medium">O</span><hr className="flex-grow border-slate-200" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Enlace Externo (Google Drive)</label><input type="url" value={protocoloUrl} onChange={(e) => { setProtocoloUrl(e.target.value); setProtocoloFile(null); }} placeholder="https://drive.google.com/..." className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" disabled={!!protocoloFile} /></div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg disabled:opacity-50">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: EDITAR */}
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0"><h3 className="text-lg font-bold text-slate-800">Editar Proyecto</h3></div>
                <form onSubmit={handleActualizarProyecto} className="p-6 space-y-4 overflow-y-auto">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Título</label><input type="text" required value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Planteamiento del problema</label><textarea required rows="3" value={editPlanteamiento} onChange={(e) => setEditPlanteamiento(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Objetivo general</label><textarea required rows="2" value={editObjetivoGeneral} onChange={(e) => setEditObjetivoGeneral(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Objetivos Específicos</label><textarea required rows="2" value={editObjetivosEspecificos} onChange={(e) => setEditObjetivosEspecificos(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Delimitación</label><textarea required rows="2" value={editDelimitacion} onChange={(e) => setEditDelimitacion(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cupos</label>
                      <input type="number" min="1" max="10" required value={editCupos} onChange={(e) => setEditCupos(parseInt(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                      <select value={editEstado} onChange={(e) => setEditEstado(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="En preparación">En preparación</option><option value="Activo">Activo</option><option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Modalidad</label>
                      <select value={editModalidad} onChange={(e) => setEditModalidad(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        {OPCIONES_MODALIDAD.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Carrera</label>
                      <select value={editCarrera} onChange={(e) => setEditCarrera(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none truncate">
                        {OPCIONES_CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Protocolo Oficial / Convocatoria</label>
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Subir o reemplazar Archivo PDF</label><input type="file" accept=".pdf" onChange={(e) => { setEditProtocoloFile(e.target.files[0]); setEditProtocoloUrl(''); }} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" /></div>
                      <div className="flex items-center gap-2"><hr className="flex-grow border-slate-200" /><span className="text-xs text-slate-400 font-medium">O</span><hr className="flex-grow border-slate-200" /></div>
                      <div><label className="block text-xs font-medium text-slate-500 mb-1">Enlace Externo (Google Drive)</label><input type="url" value={editProtocoloUrl} onChange={(e) => { setEditProtocoloUrl(e.target.value); setEditProtocoloFile(null); }} placeholder="https://drive.google.com/..." className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" disabled={!!editProtocoloFile} /></div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg disabled:opacity-50">{isSubmitting ? 'Actualizando...' : 'Actualizar'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}