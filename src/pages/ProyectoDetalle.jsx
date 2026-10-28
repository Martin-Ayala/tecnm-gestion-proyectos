import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NotificacionesBell from "../components/NotificacionesBell";

// 1. COMPONENTE InfoBox
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

// 2. COMPONENTE RenderizarEntregables (Maneja el renderizado de las tarjetas)
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
                    
                    {/* ETIQUETA VISUAL DEL TIPO DE DOCUMENTO */}
                    {tarea.tipo_entregable && tarea.tipo_entregable !== 'Avance Libre' && (
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                        tarea.tipo_entregable === 'Reporte Final' 
                          ? 'bg-orange-900/80 text-orange-300 border border-orange-700' 
                          : 'bg-purple-900/80 text-purple-300 border border-purple-700'
                      }`}>
                        {tarea.tipo_entregable}
                      </span>
                    )}

                    <span className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                      estaAprobado ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600' :
                      tarea.estado === 'Corregir' ? 'bg-red-900/80 text-red-300 border border-red-600' :
                      'bg-amber-900/80 text-amber-300 border border-amber-600'
                    }`}>
                      {tarea.estado || 'Pendiente'}
                    </span>
                    
                    {tarea.calificacion !== null && tarea.calificacion !== undefined && (
                      <span className="text-xs bg-blue-900 text-blue-200 border border-blue-700 px-2 py-0.5 rounded font-bold">
                        Calificación: {tarea.calificacion}/100
                      </span>
                    )}
                  </div>

                  {esDocente && tarea.estudiante && (
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      Alumno: <span className="font-semibold text-blue-300 uppercase">{tarea.estudiante.nombre_completo}</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enviado: {tarea.creado_en ? new Date(tarea.creado_en).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto mt-2 md:mt-0">
                  <a 
                    href={tarea.archivo_adjunto_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-600 shadow-sm"
                  >
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    Ver Documento
                  </a>

                  {/* BOTÓN DE ELIMINAR PARA EL ALUMNO O DOCENTE */}
                  {(esDueno || esDocente) && (
                    <button 
                      onClick={() => onEliminar(tarea)} 
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded transition-colors"
                      title="Eliminar archivo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </div>
              </div>

              {tarea.observaciones_retroalimentacion && (
                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/60 text-xs mt-1">
                  <span className="font-semibold text-slate-400 block mb-1">Retroalimentación del docente:</span>
                  <p className="text-slate-300 italic">{tarea.observaciones_retroalimentacion}</p>
                </div>
              )}

              {/* BOTONES DE REVISIÓN DEL DOCENTE */}
              {esDocente && (
                <div className="flex gap-2 pt-2 border-t border-slate-700/50 justify-end mt-1">
                  {!estaAprobado ? (
                    <>
                      <button onClick={() => onCalificar(tarea, 'Corregir')} className="text-xs bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-800 px-3 py-1.5 rounded transition-colors font-medium">
                        Pedir Corrección
                      </button>
                      <button onClick={() => onCalificar(tarea, 'Aprobado')} className="text-xs bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 px-3 py-1.5 rounded transition-colors font-medium">
                        Aprobar y Calificar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => onCalificar(tarea, 'Aprobado')} className="text-xs bg-slate-700/80 text-slate-300 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
                      ✏️ Reevaluar
                    </button>
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

// 3. COMPONENTE PRINCIPAL
export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [yaPostulado, setYaPostulado] = useState(null); 
  const [postulando, setPostulando] = useState(false);

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

  useEffect(() => {
    const fetchDatos = async () => {
      const { data: dataProyecto, error: errorProyecto } = await supabase
        .from('proyectos')
        .select('*, investigador:usuarios!investigador_id(nombre_completo)')
        .eq('id', id)
        .single();

      if (errorProyecto) console.error("Error al cargar proyecto:", errorProyecto);
      else setProyecto(dataProyecto);

      if (user?.rol === 'Estudiante') {
        const { data: dataPostulacion } = await supabase
          .from('postulaciones')
          .select('id, estado')
          .eq('id_proyecto', id)
          .eq('id_estudiante', user.id)
          .single();
        if (dataPostulacion) setYaPostulado(dataPostulacion.estado); 
      }

      if (user) {
        let query = supabase
          .from('tareas_entregables')
          .select('*, estudiante:usuarios!id_estudiante(nombre_completo)')
          .eq('id_proyecto', id)
          .order('creado_en', { ascending: false });
        
        if (user.rol === 'Estudiante') {
          query = query.eq('id_estudiante', user.id);
        }

        const { data: dataEntregables } = await query;
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
      <div class="datos-proyecto"><p><strong>Proyecto:</strong> ${proyecto.titulo}</p><p><strong>Objetivo:</strong> ${proyecto.objetivo || 'Desarrollo de investigación.'}</p><p><strong>Investigador Responsable:</strong> ${proyecto.investigador?.nombre_completo || 'Docente Titular Asignado'}</p></div>
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
    const { error } = await supabase.from('postulaciones').insert([{ 
        id_proyecto: id, id_estudiante: user.id, mensaje_estudiante: mensaje,
        documento_kardex_url: kardexUrl, estado: 'Pendiente'
      }]);
    if (error) { alert("Error al procesar tu postulación."); console.error(error); } 
    else {
      if (proyecto?.investigador_id) {
        await supabase.from('notificaciones').insert([{
            usuario_id: proyecto.investigador_id, tipo: 'postulacion',
            mensaje: `El alumno ${user?.nombre_completo || 'un estudiante'} se ha postulado a tu proyecto: "${proyecto.titulo}".`
          }]);
      }
      alert("Postulación enviada con éxito.");
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

    const { data, error } = await supabase.from('tareas_entregables').insert([{
        id_proyecto: id, id_estudiante: user.id, titulo_tarea: tituloTarea,
        archivo_adjunto_url: urlFinal, estado: 'Pendiente', tipo_entregable: tipoEntregable
      }]).select('*, estudiante:usuarios!id_estudiante(nombre_completo)').single();

    if (error) { alert("Error al registrar entregable en base de datos."); console.error(error); } 
    else {
      alert("Entregable enviado con éxito.");
      setEntregables([data, ...entregables]);
      setTituloTarea(''); setArchivoAdjuntoUrl(''); setArchivoFisico(null);
    }
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

    const { error } = await supabase.from('tareas_entregables').update({
        estado: nuevoEstado, observaciones_retroalimentacion: obs, calificacion: califNum
      }).eq('id', tarea.id);

    if (error) { alert("Error al actualizar la revisión."); console.error(error); } 
    else {
      setEntregables(entregables.map(t => t.id === tarea.id ? { ...t, estado: nuevoEstado, observaciones_retroalimentacion: obs, calificacion: califNum } : t));
      if (tarea.id_estudiante) {
        await supabase.from('notificaciones').insert([{
            usuario_id: tarea.id_estudiante, tipo: 'revision',
            mensaje: `Tu entrega "${tarea.titulo_tarea}" fue marcada como: ${nuevoEstado}. Retroalimentación: "${obs}"`
          }]);
      }
    }
  };

  // NUEVA FUNCIÓN: ELIMINAR TAREA Y ARCHIVO FÍSICO
  const handleEliminarTarea = async (tarea) => {
    if (!window.confirm(`¿Estás seguro de eliminar el entregable "${tarea.titulo_tarea}"? Esta acción no se puede deshacer.`)) return;

    // 1. Si el archivo está alojado en Supabase Storage, lo borramos primero
    if (tarea.archivo_adjunto_url && tarea.archivo_adjunto_url.includes('supabase.co/storage')) {
      const urlParts = tarea.archivo_adjunto_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      const { error: errStorage } = await supabase.storage.from('documentos').remove([`entregables/${fileName}`]);
      if (errStorage) console.error("Error al borrar archivo de Storage:", errStorage);
    }

    // 2. Borramos el registro de la base de datos
    const { error } = await supabase.from('tareas_entregables').delete().eq('id', tarea.id);
    
    if (error) {
      alert("Error al eliminar el entregable de la base de datos.");
      console.error(error);
    } else {
      setEntregables(entregables.filter(t => t.id !== tarea.id));
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Cargando detalles...</div>;
  if (!proyecto) return <div className="min-h-screen flex justify-center items-center">Proyecto no encontrado.</div>;

  const gridClassNames = user?.rol === 'Estudiante' ? 'lg:col-span-2 space-y-6' : 'lg:col-span-3 space-y-6';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CAJA PRINCIPAL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-start gap-4 flex-wrap md:flex-nowrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">{proyecto.titulo}</h1>
            <div className="flex items-center gap-3 flex-shrink-0">
              <NotificacionesBell />
              <button onClick={() => navigate(-1)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors">← Regresar</button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-100 p-4 rounded-t-lg border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Detalle de la Propuesta</h2>
            </div>
            <div className="border border-t-0 border-slate-200 rounded-b-lg p-6 space-y-4">
              <InfoBox titulo="Descripción" texto={proyecto.descripcion} />
              <InfoBox titulo="Objetivo" texto={proyecto.objetivo} />
              <InfoBox titulo="Pre-requisitos" texto={proyecto.pre_requisitos} />
              <InfoBox titulo="Requisitos" texto={proyecto.requisitos} />
              
              <div className="mt-8 pt-4 border-t border-slate-100 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-slate-500">Investigador responsable: <span className="font-semibold text-slate-700 uppercase">{proyecto.investigador?.nombre_completo}</span></div>
                
                {user?.rol === 'Estudiante' && proyecto.estado?.toLowerCase() !== 'finalizado' && (
                  <div>
                    {yaPostulado === 'Aceptado' ? (
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm text-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Aceptado
                        </span>
                        <button onClick={imprimirCartaAceptacion} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm flex items-center gap-2">
                          📄 Descargar Carta de Aceptación
                        </button>
                      </div>
                    ) : yaPostulado === 'Rechazado' ? (
                      <span className="bg-red-100 text-red-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> Rechazado</span>
                    ) : yaPostulado === 'Pendiente' ? (
                      <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> En Revisión</span>
                    ) : (
                      <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-semibold transition-colors shadow-sm">Postularme a este proyecto</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ESPACIO DE TRABAJO Y ENTREGABLES */}
        {(yaPostulado === 'Aceptado' || user?.id === proyecto.investigador_id || user?.rol === 'Administrador') && (
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Espacio de Trabajo y Seguimiento
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {user?.rol === 'Estudiante' 
                  ? "Sube tus reportes oficiales y bitácoras de avance." 
                  : "Revisa, retroalimenta y califica los avances y reportes de tus residentes."}
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulario para Estudiantes */}
              {user?.rol === 'Estudiante' && (
                <div className="lg:col-span-1 bg-slate-800 p-5 rounded-lg border border-slate-700 h-fit">
                  <h3 className="text-white font-semibold mb-4 border-b border-slate-700 pb-2">Subir Documento</h3>
                  
                  <div className="flex bg-slate-900 p-1 rounded-lg mb-4 border border-slate-700">
                    <button type="button" onClick={() => setMetodoSubida('archivo')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${metodoSubida === 'archivo' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>📄 Archivo PDF</button>
                    <button type="button" onClick={() => setMetodoSubida('enlace')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${metodoSubida === 'enlace' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>🔗 Enlace Externo</button>
                  </div>

                  <form onSubmit={handleSubirTarea} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Clasificación</label>
                      <select value={tipoEntregable} onChange={(e) => setTipoEntregable(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none">
                        <option value="Avance Libre">Avance / Tarea Semanal</option>
                        <option value="Reporte Preliminar">Reporte Preliminar Oficial</option>
                        <option value="Reporte Final">Reporte Final Oficial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Título de la entrega</label>
                      <input type="text" required value={tituloTarea} onChange={(e) => setTituloTarea(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none" placeholder="Ej. Reporte Semanal 1" />
                    </div>
                    
                    {metodoSubida === 'archivo' ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Archivo PDF (Max 10MB)</label>
                        <input type="file" accept=".pdf" onChange={(e) => setArchivoFisico(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Enlace (Drive, OneDrive)</label>
                        <input type="url" required value={archivoAdjuntoUrl} onChange={(e) => setArchivoAdjuntoUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none" placeholder="https://" />
                      </div>
                    )}
                    
                    <button type="submit" disabled={subiendoTarea} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50 mt-2">
                      {subiendoTarea ? 'Enviando...' : 'Subir Entregable'}
                    </button>
                  </form>
                </div>
              )}

              {/* Listado de Entregas Dividido */}
              <div className={gridClassNames}>
                <RenderizarEntregables 
                  lista={entregables.filter(t => t.tipo_entregable === 'Reporte Preliminar' || t.tipo_entregable === 'Reporte Final')} 
                  tituloLista="📑 Reportes Oficiales Institucionales" 
                  user={user}
                  investigadorId={proyecto.investigador_id}
                  onCalificar={handleCalificarTarea}
                  onEliminar={handleEliminarTarea}
                />
                <RenderizarEntregables 
                  lista={entregables.filter(t => t.tipo_entregable === 'Avance Libre' || !t.tipo_entregable)} 
                  tituloLista="📝 Bitácora de Avances y Tareas" 
                  user={user}
                  investigadorId={proyecto.investigador_id}
                  onCalificar={handleCalificarTarea}
                  onEliminar={handleEliminarTarea}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE POSTULACION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Formulario de Postulación</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">x</button>
            </div>
            <form onSubmit={confirmarPostulacion} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carta de Motivos</label>
                <textarea required rows="4" value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Estimado investigador..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enlace al Kardex / Historial Académico</label>
                <input type="url" required value={kardexUrl} onChange={(e) => setKardexUrl(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://drive.google.com/..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={postulando} className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm">
                  {postulando ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}