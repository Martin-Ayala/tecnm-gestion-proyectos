import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NotificacionesBell from "../components/NotificacionesBell";

const InfoBox = ({ titulo, texto }) => (
  <div className="bg-[#f0f7ff] border border-blue-200 rounded-md p-4 flex gap-3">
    <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <p className="text-slate-700 text-sm leading-relaxed">
      <span className="font-semibold text-blue-800">{titulo}: </span>
      {texto || 'No especificado.'}
    </p>
  </div>
);

const RenderizarEntregables = ({ lista, tituloLista, user, investigadorId, onCalificar, onEliminar }) => (
  <div className="mb-6">
    <h4 className="text-blue-400 font-bold mb-3 border-b border-slate-700 pb-1">{tituloLista}</h4>
    {lista.length === 0 ? (
      <div className="text-slate-500 text-center py-6 bg-slate-800 rounded-lg border border-slate-700 border-dashed text-sm">
        No hay registros en esta categoría.
      </div>
    ) : (
      <div className="space-y-3">
        {lista.map((tarea) => {
          const esDocente = user?.id === investigadorId || user?.rol === 'Administrador';
          const esDueno = user?.id === tarea.id_estudiante;
          const estaAprobado = tarea.estado === 'Aprobado';

          return (
            <div key={tarea.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-3 transition-all hover:border-slate-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-slate-200 font-bold text-base">{tarea.titulo_tarea}</h4>
                    {tarea.tipo_entregable && tarea.tipo_entregable !== 'Avance Libre' && (
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${tarea.tipo_entregable === 'Reporte Final' ? 'bg-orange-900/80 text-orange-300 border border-orange-700' : 'bg-purple-900/80 text-purple-300 border border-purple-700'}`}>
                        {tarea.tipo_entregable}
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-0.5 rounded font-semibold ${estaAprobado ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600' : tarea.estado === 'Corregir' ? 'bg-red-900/80 text-red-300 border border-red-600' : 'bg-amber-900/80 text-amber-300 border border-amber-600'}`}>
                      {tarea.estado || 'Pendiente'}
                    </span>
                    {tarea.calificacion !== null && tarea.calificacion !== undefined && (
                      <span className="text-xs bg-blue-900 text-blue-200 border border-blue-700 px-2 py-0.5 rounded font-bold">
                        Calificación: {tarea.calificacion}/100
                      </span>
                    )}
                  </div>
                  {tarea.estudiante && (
                    <p className="text-xs text-slate-300 mt-1 font-medium">Entregado por: <span className="font-semibold text-blue-300 uppercase">{tarea.estudiante.nombre_completo}</span></p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">Enviado: {tarea.creado_en ? new Date(tarea.creado_en).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}</p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto mt-2 md:mt-0">
                  <a href={tarea.archivo_adjunto_url} target="_blank" rel="noreferrer" className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-600 shadow-sm"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>Ver Documento</a>
                  {(esDueno || esDocente) && (
                    <button onClick={() => onEliminar(tarea)} className="text-slate-400 hover:text-red-400 p-1.5 rounded transition-colors" title="Eliminar archivo"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                  )}
                </div>
              </div>
              {tarea.observaciones_retroalimentacion && (
                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60 text-xs mt-1"><span className="font-semibold text-slate-400 block mb-1">Retroalimentación del docente:</span><p className="text-slate-300 italic">{tarea.observaciones_retroalimentacion}</p></div>
              )}
              {esDocente && (
                <div className="flex gap-2 pt-2 border-t border-slate-700/50 justify-end mt-1">
                  {!estaAprobado ? (
                    <><button onClick={() => onCalificar(tarea, 'Corregir')} className="text-xs bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-800 px-3 py-1.5 rounded transition-colors font-medium">Pedir Corrección</button><button onClick={() => onCalificar(tarea, 'Aprobado')} className="text-xs bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 px-3 py-1.5 rounded transition-colors font-medium">Aprobar y Calificar</button></>
                  ) : (
                    <button onClick={() => onCalificar(tarea, 'Aprobado')} className="text-xs bg-slate-700/80 text-slate-300 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">✏️ Reevaluar</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [yaPostulado, setYaPostulado] = useState(null); 
  const [idPostulacionExistente, setIdPostulacionExistente] = useState(null); 
  const [postulando, setPostulando] = useState(false);
  const [alumnosAceptados, setAlumnosAceptados] = useState(0);
  const [residentesProyecto, setResidentesProyecto] = useState([]); // Array de residentes aceptados

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [kardexUrl, setKardexUrl] = useState('');

  const [entregables, setEntregables] = useState([]);
  const [tituloTarea, setTituloTarea] = useState('');
  const [tipoEntregable, setTipoEntregable] = useState('Avance Libre');
  const [metodoSubida, setMetodoSubida] = useState('archivo'); 
  const [archivoFisico, setArchivoFisico] = useState(null);
  const [archivoAdjuntoUrl, setArchivoAdjuntoUrl] = useState('');
  const [subiendoTarea, setSubiendoTarea] = useState(false);

  // Estados para Expedientes (Modales)
  const [isAsesorModalOpen, setIsAsesorModalOpen] = useState(false);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
  const [isResidenteModalOpen, setIsResidenteModalOpen] = useState(false);
  const [residenteSeleccionado, setResidenteSeleccionado] = useState(null);

  useEffect(() => {
    const fetchDatos = async () => {
      // Consulta enriquecida: Trae el proyecto, perfil completo del investigador y las postulaciones de los estudiantes
      const { data: dataProyecto, error: errorProyecto } = await supabase
        .from('proyectos')
        .select(`
            *, 
            investigador:usuarios!investigador_id(
                id, nombre_completo, avatar_url, correo_institucional, telefono, departamento, ubicacion_cubiculo, lineas_investigacion
            ),
            postulaciones:postulaciones(
                id, estado,
                estudiante:usuarios!id_estudiante(
                    id, nombre_completo, avatar_url, telefono, correo_institucional, semestre, habilidades, enlaces_profesionales, carrera, numero_control
                )
            )
        `)
        .eq('id', id)
        .single();

      if (errorProyecto) {
        console.error("Error al cargar proyecto:", errorProyecto);
      } else {
        setProyecto(dataProyecto);
        
        // Calcular alumnos aceptados y guardarlos para mostrar "Equipo de Trabajo"
        const aceptados = dataProyecto.postulaciones ? dataProyecto.postulaciones.filter(p => p.estado === 'Aceptado') : [];
        setResidentesProyecto(aceptados);
        setAlumnosAceptados(aceptados.length);
      }

      if (user?.rol === 'Estudiante') {
        const { data: dataPostulacion } = await supabase.from('postulaciones').select('id, estado, mensaje_estudiante, documento_kardex_url').eq('id_proyecto', id).eq('id_estudiante', user.id).single();
        if (dataPostulacion) {
          setYaPostulado(dataPostulacion.estado); 
          setIdPostulacionExistente(dataPostulacion.id);
          setMensaje(dataPostulacion.mensaje_estudiante || '');
          setKardexUrl(dataPostulacion.documento_kardex_url || '');
        }
      }

      if (user) {
        const { data: dataEntregables } = await supabase.from('tareas_entregables').select('*, estudiante:usuarios!id_estudiante(nombre_completo)').eq('id_proyecto', id).order('creado_en', { ascending: false });
        if (dataEntregables) setEntregables(dataEntregables);
      }
      setLoading(false);
    };
    fetchDatos();
  }, [id, user]);

  const imprimirCartaAceptacion = () => {
    const ventanaImpresion = window.open('', '_blank');
    const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    ventanaImpresion.document.write(`
      <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Carta de Aceptación - ${proyecto.titulo}</title>
      <style>
        @page { size: letter; margin: 25mm 20mm; }
        body { font-family: 'Helvetica', Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 20px; }
        .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; }
        .header h2 { margin: 0; color: #1e3a8a; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { margin: 3px 0 0 0; color: #64748b; font-size: 13px; }
        .fecha { text-align: right; font-size: 13px; color: #475569; margin-bottom: 25px; }
        .destinatario { margin-bottom: 25px; font-size: 14px; }
        .cuerpo { font-size: 14px; text-align: justify; margin-bottom: 20px; }
        .datos-proyecto { background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .datos-proyecto p { margin: 5px 0; font-size: 13px; }
        .firma-container { margin-top: 70px; text-align: center; }
        .linea { width: 240px; border-top: 1px solid #334155; margin: 0 auto 8px auto; }
      </style></head><body>
      <div class="header"><h2>Tecnológico Nacional de México</h2><p>Programa de Proyectos de Investigación y Residencias Profesionales</p></div>
      <div class="fecha">Felipe Carrillo Puerto, Q. Roo a ${fechaHoy}</div>
      <div class="destinatario"><strong>A QUIEN CORRESPONDA:</strong></div>
      <div class="cuerpo">Por medio de la presente, se hace constar formalmente que el estudiante <strong>${user?.nombre_completo || 'ESTUDIANTE'}</strong> ha sido formalmente <strong>ACEPTADO</strong> para integrarse y colaborar activamente en las actividades del siguiente proyecto de investigación:</div>
      <div class="datos-proyecto"><p><strong>Proyecto:</strong> ${proyecto.titulo}</p><p><strong>Objetivo General:</strong> ${proyecto.objetivo_general || proyecto.objetivo || 'Desarrollo de investigación.'}</p><p><strong>Investigador Responsable:</strong> ${proyecto.investigador?.nombre_completo || 'Docente Titular Asignado'}</p></div>
      <div class="cuerpo">El estudiante llevará a cabo sus entregables, desarrollo técnico y seguimiento a través de la plataforma institucional durante el periodo estipulado para el cumplimiento satisfactorio de sus metas académicas.</div>
      <div class="firma-container"><div class="linea"></div><strong>${proyecto.investigador?.nombre_completo || 'Investigador Titular'}</strong><br><span style="font-size: 12px; color: #64748b;">Investigador Responsable del Proyecto</span></div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
      </body></html>
    `);
    ventanaImpresion.document.close();
  };

  const confirmarPostulacion = async (e) => {
    e.preventDefault();
    setPostulando(true);
    let errorOperacion;

    if (idPostulacionExistente && yaPostulado === 'Rechazado') {
      const { error } = await supabase.from('postulaciones').update({
        mensaje_estudiante: mensaje, documento_kardex_url: kardexUrl, estado: 'Pendiente', fecha_postulacion: new Date().toISOString()
      }).eq('id', idPostulacionExistente);
      errorOperacion = error;
    } else {
      const { data, error } = await supabase.from('postulaciones').insert([{ id_proyecto: id, id_estudiante: user.id, mensaje_estudiante: mensaje, documento_kardex_url: kardexUrl, estado: 'Pendiente' }]).select().single();
      if (data) setIdPostulacionExistente(data.id);
      errorOperacion = error;
    }

    if (errorOperacion) { alert("Error al procesar tu postulación."); console.error(errorOperacion); } 
    else {
      if (proyecto?.investigador_id) { await supabase.from('notificaciones').insert([{ usuario_id: proyecto.investigador_id, tipo: 'postulacion', mensaje: `El alumno ${user?.nombre_completo || 'un estudiante'} ha enviado o actualizado su postulación a tu proyecto: "${proyecto.titulo}".` }]); }
      alert(yaPostulado === 'Rechazado' ? "Postulación reenviada con éxito." : "Postulación enviada con éxito.");
      setYaPostulado('Pendiente'); setIsModalOpen(false); 
    }
    setPostulando(false);
  };

  const handleSubirTarea = async (e) => {
    e.preventDefault();
    setSubiendoTarea(true);
    let urlFinal;
    if (metodoSubida === 'archivo') {
      if (!archivoFisico) { alert("Selecciona un archivo PDF."); setSubiendoTarea(false); return; }
      const extension = archivoFisico.name.split('.').pop();
      const nombreLimpio = `${Date.now()}_${user.id}.${extension}`;
      const { error: errorStorage } = await supabase.storage.from('documentos').upload(`entregables/${nombreLimpio}`, archivoFisico);
      if (errorStorage) { alert(`Error al subir archivo a Supabase: ${errorStorage.message}`); setSubiendoTarea(false); return; }
      const { data: dataUrl } = supabase.storage.from('documentos').getPublicUrl(`entregables/${nombreLimpio}`);
      urlFinal = dataUrl.publicUrl;
    } else {
      if (!archivoAdjuntoUrl.trim()) { alert('Introduce el enlace externo.'); setSubiendoTarea(false); return; }
      urlFinal = archivoAdjuntoUrl.trim();
    }
    const { data, error } = await supabase.from('tareas_entregables').insert([{ id_proyecto: id, id_estudiante: user.id, titulo_tarea: tituloTarea, archivo_adjunto_url: urlFinal, estado: 'Pendiente', tipo_entregable: tipoEntregable }]).select('*, estudiante:usuarios!id_estudiante(nombre_completo)').single();
    if (error) { alert("Error al registrar entregable en base de datos."); console.error(error); } 
    else { alert("Entregable enviado con éxito."); setEntregables([data, ...entregables]); setTituloTarea(''); setArchivoAdjuntoUrl(''); setArchivoFisico(null); }
    setSubiendoTarea(false);
  };
  
  const handleCalificarTarea = async (tarea, nuevoEstado) => {
    const obs = prompt(`Retroalimentación para marcar como ${nuevoEstado}:`, tarea.observaciones_retroalimentacion || "");
    if (obs === null) return;
    let califNum = null;
    if (nuevoEstado === 'Aprobado') {
      const califStr = prompt("Asigna una calificación (0 - 100):", tarea.calificacion || "");
      if (califStr !== null && califStr.trim() !== '') califNum = parseInt(califStr);
    }
    const { error } = await supabase.from('tareas_entregables').update({ estado: nuevoEstado, observaciones_retroalimentacion: obs, calificacion: califNum }).eq('id', tarea.id);
    if (error) { alert("Error al actualizar la revisión."); console.error(error); } 
    else {
      setEntregables(entregables.map(t => t.id === tarea.id ? { ...t, estado: nuevoEstado, observaciones_retroalimentacion: obs, calificacion: califNum } : t));
      if (tarea.id_estudiante) { await supabase.from('notificaciones').insert([{ usuario_id: tarea.id_estudiante, tipo: 'revision', mensaje: `Tu entrega "${tarea.titulo_tarea}" fue marcada como: ${nuevoEstado}. Retroalimentación: "${obs}"` }]); }
    }
  };

  const handleEliminarTarea = async (tarea) => {
    if (!window.confirm(`¿Estás seguro de eliminar el entregable "${tarea.titulo_tarea}"? Esta acción no se puede deshacer.`)) return;
    if (tarea.archivo_adjunto_url && tarea.archivo_adjunto_url.includes('supabase.co/storage')) {
      const urlParts = tarea.archivo_adjunto_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const { error: errStorage } = await supabase.storage.from('documentos').remove([`entregables/${fileName}`]);
      if (errStorage) console.error("Error al borrar archivo de Storage:", errStorage);
    }
    const { data, error } = await supabase.from('tareas_entregables').delete().eq('id', tarea.id).select(); 
    if (error) { alert(`Error al eliminar el entregable: ${error.message}`); console.error(error); return; }
    if (!data || data.length === 0) { alert("La base de datos bloqueó la eliminación (0 filas afectadas). Verifica tus permisos."); return; }
    setEntregables(entregables.filter(t => t.id !== tarea.id));
  };

  // Funciones para Modales de Expediente
  const abrirModalAsesor = (asesor) => {
    setAsesorSeleccionado(asesor);
    setIsAsesorModalOpen(true);
  };

  const abrirModalResidente = (estudiante) => {
    setResidenteSeleccionado(estudiante);
    setIsResidenteModalOpen(true);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Cargando detalles...</div>;
  if (!proyecto) return <div className="min-h-screen flex justify-center items-center">Proyecto no encontrado.</div>;

  const gridClassNames = user?.rol === 'Estudiante' ? 'lg:col-span-2 space-y-6' : 'lg:col-span-3 space-y-6';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ENCABEZADO Y DETALLES DEL PROYECTO */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-start gap-4 flex-wrap md:flex-nowrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">{proyecto.titulo}</h1>
            <div className="flex items-center gap-3 flex-shrink-0">
              {user && <NotificacionesBell />}
              <button onClick={() => navigate(-1)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors">← Regresar</button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-100 p-4 rounded-t-lg border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Detalle de la Propuesta</h2>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-lg p-6 space-y-4">
              <InfoBox titulo="Planteamiento del problema" texto={proyecto.planteamiento_problema || proyecto.descripcion} />
              <InfoBox titulo="Objetivo general" texto={proyecto.objetivo_general || proyecto.objetivo} />
              <InfoBox titulo="Objetivos Específicos" texto={proyecto.objetivos_especificos || proyecto.pre_requisitos} />
              <InfoBox titulo="Hipótesis" texto={proyecto.delimitacion || proyecto.requisitos} />
              
              {user && (
                <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Convocatoria / Protocolo Oficial
                    </h4>
                    <p className="text-xs text-blue-700 mt-1">Revisa el documento original de investigación planteado por el docente.</p>
                  </div>
                  {proyecto.documento_protocolo_url ? (
                    <a href={proyecto.documento_protocolo_url} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Descargar Documento
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-200/60 text-slate-500 px-4 py-2 rounded-md text-sm font-semibold border border-slate-300 shadow-sm cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      No se adjuntó documento
                    </div>
                  )}
                </div>
              )}

              {/* BARRA INFERIOR: INVESTIGADOR, CUPOS Y ACCIONES */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Lado Izquierdo: Info del Investigador y Cupos */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    {/* Tarjeta del Asesor (Clicable) */}
                    <div className="flex justify-between items-center w-full max-w-[280px]">
                        <button 
                            onClick={() => abrirModalAsesor(proyecto.investigador)}
                            className="flex items-center gap-2 text-left group hover:bg-slate-50 p-1.5 rounded-lg transition-colors -ml-1.5"
                            title="Ver perfil del investigador"
                        >
                            {proyecto.investigador?.avatar_url ? (
                                <img src={proyecto.investigador.avatar_url} className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm" alt="Asesor" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shadow-sm">
                                    {proyecto.investigador?.nombre_completo?.substring(0, 2).toUpperCase() || 'IN'}
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Asesor Técnico</p>
                                <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors uppercase leading-none">{proyecto.investigador?.nombre_completo}</p>
                            </div>
                        </button>
                    </div>

                    <div className="text-slate-500 text-sm pl-1.5">
                        Cupos Ocupados: <span className={`font-bold ${alumnosAceptados >= (proyecto.cupos_requeridos || 1) ? 'text-red-600' : 'text-blue-600'}`}>{alumnosAceptados} / {proyecto.cupos_requeridos || 1}</span>
                    </div>

                    {/* BLOQUE: EQUIPO DE TRABAJO (SÓLO PARA DOCENTES/ADMIN) */}
                    {(user?.rol === 'Investigador' || user?.rol === 'Administrador') && residentesProyecto.length > 0 && (
                        <div className="w-full bg-indigo-50 border border-indigo-100 p-3 rounded-lg mt-1 text-left max-w-sm">
                            <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                Equipo de Trabajo
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {residentesProyecto.map(res => (
                                    <button 
                                        key={res.id} 
                                        onClick={() => abrirModalResidente(res.estudiante)} 
                                        className="flex items-center gap-2 bg-white border border-indigo-200 pl-1 pr-3 py-1 rounded-full hover:bg-indigo-100 transition-colors shadow-sm overflow-hidden group"
                                        title="Ver expediente del residente"
                                    >
                                        {res.estudiante?.avatar_url ? (
                                            <img src={res.estudiante.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                                                {res.estudiante?.nombre_completo ? res.estudiante.nombre_completo.substring(0,2).toUpperCase() : 'RS'}
                                            </div>
                                        )}
                                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px] group-hover:text-indigo-800">{res.estudiante?.nombre_completo}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Lado Derecho: Acciones del Estudiante */}
                {user?.rol === 'Estudiante' && proyecto.estado?.toLowerCase() !== 'finalizado' && (
                  <div>
                    {yaPostulado === 'Aceptado' ? (
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm text-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Aceptado</span>
                        <button onClick={imprimirCartaAceptacion} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm flex items-center gap-2">📄 Descargar Carta de Aceptación</button>
                      </div>
                    ) : yaPostulado === 'Rechazado' ? (
                      <div className="flex items-center gap-3">
                        <span className="bg-red-100 text-red-800 px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 shadow-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> 
                          Rechazado
                        </span>
                        {alumnosAceptados < (proyecto.cupos_requeridos || 1) && (
                          <button onClick={() => setIsModalOpen(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm flex items-center gap-1.5">
                            🔄 Reintentar solicitud
                          </button>
                        )}
                      </div>
                    ) : yaPostulado === 'Pendiente' ? (
                      <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> En Revisión</span>
                    ) : alumnosAceptados < (proyecto.cupos_requeridos || 1) ? (
                      <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-semibold transition-colors shadow-sm">Postularme a este proyecto</button>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-md font-bold flex items-center gap-2 shadow-sm border border-slate-200">🔒 Cupo Lleno</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA DE SEGUIMIENTO (ENTREGABLES) */}
        {(yaPostulado === 'Aceptado' || user?.id === proyecto.investigador_id || user?.rol === 'Administrador') && (
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> Espacio de Trabajo y Seguimiento</h2>
              <p className="text-slate-400 text-sm mt-1">{user?.rol === 'Estudiante' ? "Consulta los avances del equipo y sube tus reportes oficiales o bitácoras." : "Revisa, retroalimenta y califica los avances y reportes de tus residentes."}</p>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {user?.rol === 'Estudiante' && (
                <div className="lg:col-span-1 bg-slate-800 p-5 rounded-lg border border-slate-700 h-fit">
                  <h3 className="text-white font-semibold mb-4 border-b border-slate-700 pb-2">Subir Documento</h3>
                  <div className="flex bg-slate-900 p-1 rounded-lg mb-4 border border-slate-700"><button type="button" onClick={() => setMetodoSubida('archivo')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${metodoSubida === 'archivo' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>📄 Archivo PDF</button><button type="button" onClick={() => setMetodoSubida('enlace')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${metodoSubida === 'enlace' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>🔗 Enlace Externo</button></div>
                  <form onSubmit={handleSubirTarea} className="space-y-4">
                    <div><label className="block text-xs font-medium text-slate-300 mb-1">Clasificación</label><select value={tipoEntregable} onChange={(e) => setTipoEntregable(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none"><option value="Avance Libre">Avance / Tarea Semanal</option><option value="Reporte Preliminar">Reporte Preliminar Oficial</option><option value="Reporte Final">Reporte Final Oficial</option></select></div>
                    <div><label className="block text-xs font-medium text-slate-300 mb-1">Título de la entrega</label><input type="text" required value={tituloTarea} onChange={(e) => setTituloTarea(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none" placeholder="Ej. Reporte Semanal 1" /></div>
                    {metodoSubida === 'archivo' ? (<div><label className="block text-xs font-medium text-slate-300 mb-1">Archivo PDF (Max 10MB)</label><input type="file" accept=".pdf" onChange={(e) => setArchivoFisico(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer" /></div>) : (<div><label className="block text-xs font-medium text-slate-300 mb-1">Enlace (Drive, OneDrive)</label><input type="url" required value={archivoAdjuntoUrl} onChange={(e) => setArchivoAdjuntoUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none" placeholder="https://" /></div>)}
                    <button type="submit" disabled={subiendoTarea} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50 mt-2">{subiendoTarea ? 'Enviando...' : 'Subir Entregable'}</button>
                  </form>
                </div>
              )}
              <div className={gridClassNames}>
                <RenderizarEntregables lista={entregables.filter(t => t.tipo_entregable === 'Reporte Preliminar' || t.tipo_entregable === 'Reporte Final')} tituloLista="📑 Reportes Oficiales Institucionales" user={user} investigadorId={proyecto.investigador_id} onCalificar={handleCalificarTarea} onEliminar={handleEliminarTarea} />
                <RenderizarEntregables lista={entregables.filter(t => t.tipo_entregable === 'Avance Libre' || !t.tipo_entregable)} tituloLista="📝 Bitácora de Avances y Tareas" user={user} investigadorId={proyecto.investigador_id} onCalificar={handleCalificarTarea} onEliminar={handleEliminarTarea} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: POSTULACIÓN ESTUDIANTE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">Formulario de Postulación</h3><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">x</button></div>
            <form onSubmit={confirmarPostulacion} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carta de Motivos / Justificación</label>
                <textarea required rows="4" value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Estimado investigador..." />
                {yaPostulado === 'Rechazado' && <p className="text-xs text-blue-600 mt-1">Has recuperado tu último mensaje. Puedes modificarlo antes de reintentar.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enlace al Kardex / Historial Académico</label>
                <input type="url" required value={kardexUrl} onChange={(e) => setKardexUrl(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://drive.google.com/..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={postulando} className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm">
                  {postulando ? 'Enviando...' : (yaPostulado === 'Rechazado' ? 'Reenviar Solicitud' : 'Enviar Solicitud')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXPEDIENTE DEL ASESOR (VISTO POR EL ESTUDIANTE) */}
      {isAsesorModalOpen && asesorSeleccionado && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                  <div className="bg-blue-700 px-6 py-4 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                      <h3 className="text-lg font-bold text-white relative z-10 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          Perfil del Asesor
                      </h3>
                      <button onClick={() => setIsAsesorModalOpen(false)} className="text-blue-200 hover:text-white font-bold text-xl relative z-10">✕</button>
                  </div>
                  <div className="p-6 bg-slate-50">
                      <div className="flex flex-col items-center mb-6 text-center">
                          {asesorSeleccionado.avatar_url ? (
                              <img src={asesorSeleccionado.avatar_url} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm mb-3" alt="Avatar" />
                          ) : (
                              <div className="w-20 h-20 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold text-2xl mb-3">
                                  {asesorSeleccionado.nombre_completo?.substring(0,2).toUpperCase()}
                              </div>
                          )}
                          <h4 className="text-xl font-bold text-slate-800 leading-tight">{asesorSeleccionado.nombre_completo}</h4>
                          <p className="text-sm font-semibold text-slate-500 mt-1">{asesorSeleccionado.departamento || 'Docente / Investigador'}</p>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                          <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Contacto Institucional</p>
                              <p className="text-sm font-medium text-slate-700 break-all mb-1">📧 {asesorSeleccionado.correo_institucional}</p>
                              {asesorSeleccionado.telefono ? (
                                  <a href={`https://wa.me/52${asesorSeleccionado.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md transition-colors mt-1">
                                      WhatsApp Institucional
                                  </a>
                              ) : (
                                  <p className="text-sm font-medium text-slate-400">📱 Sin teléfono registrado</p>
                              )}
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Ubicación / Cubículo (Asesorías)</p>
                              <p className="text-sm text-slate-700">{asesorSeleccionado.ubicacion_cubiculo || 'Ubicación no especificada.'}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Líneas de Investigación</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{asesorSeleccionado.lineas_investigacion || 'No especificadas.'}</p>
                          </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                          <button onClick={() => setIsAsesorModalOpen(false)} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm w-full">Cerrar Perfil</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* NUEVO MODAL: EXPEDIENTE DE RESIDENTE ACTIVO (VISTO POR EL DOCENTE) */}
      {isResidenteModalOpen && residenteSeleccionado && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                  <div className="bg-indigo-700 px-6 py-4 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                      <h3 className="text-lg font-bold text-white relative z-10 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                          Expediente del Residente
                      </h3>
                      <button onClick={() => setIsResidenteModalOpen(false)} className="text-indigo-200 hover:text-white font-bold text-xl relative z-10">✕</button>
                  </div>
                  <div className="p-6 bg-slate-50">
                      <div className="flex flex-col items-center mb-6 text-center">
                          {residenteSeleccionado.avatar_url ? (
                              <img src={residenteSeleccionado.avatar_url} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm mb-3" alt="Avatar" />
                          ) : (
                              <div className="w-20 h-20 rounded-full bg-indigo-100 border-4 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold text-2xl mb-3">
                                  {residenteSeleccionado.nombre_completo?.substring(0,2).toUpperCase()}
                              </div>
                          )}
                          <h4 className="text-xl font-bold text-slate-800 leading-tight">{residenteSeleccionado.nombre_completo}</h4>
                          <p className="text-sm font-semibold text-slate-500 mt-1">{residenteSeleccionado.carrera || 'Ingeniería en Sistemas Computacionales'}</p>
                          <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-2 border border-indigo-100">Matrícula: {residenteSeleccionado.numero_control || 'N/A'}</p>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
                          <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Contacto Directo</p>
                              <p className="text-sm font-medium text-slate-700 break-all mb-1">📧 {residenteSeleccionado.correo_institucional}</p>
                              {residenteSeleccionado.telefono ? (
                                  <a href={`https://wa.me/52${residenteSeleccionado.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md transition-colors mt-1">
                                      WhatsApp
                                  </a>
                              ) : (
                                  <p className="text-sm font-medium text-slate-400">📱 Sin teléfono registrado</p>
                              )}
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Habilidades Técnicas</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{residenteSeleccionado.habilidades || 'No especificadas.'}</p>
                          </div>

                          {residenteSeleccionado.enlaces_profesionales && (
                              <div className="pt-3 border-t border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Portafolio / Enlaces</p>
                                  <a href={residenteSeleccionado.enlaces_profesionales} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline break-all">
                                      {residenteSeleccionado.enlaces_profesionales}
                                  </a>
                              </div>
                          )}
                      </div>
                      <div className="mt-6 flex justify-end">
                          <button onClick={() => setIsResidenteModalOpen(false)} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm w-full">Cerrar Expediente</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}