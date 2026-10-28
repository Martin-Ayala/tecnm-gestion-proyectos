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

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [yaPostulado, setYaPostulado] = useState(null); 
  const [postulando, setPostulando] = useState(false);

  // Estados para Modal de Postulacion
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [kardexUrl, setKardexUrl] = useState('');

  // Estados para Entregables ajustados a las columnas reales
  const [entregables, setEntregables] = useState([]);
  const [tituloTarea, setTituloTarea] = useState('');
  const [archivoAdjuntoUrl, setArchivoAdjuntoUrl] = useState('');
  const [subiendoTarea, setSubiendoTarea] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      // 1. Cargar Proyecto
      const { data: dataProyecto, error: errorProyecto } = await supabase
        .from('proyectos')
        .select('*, investigador:usuarios!investigador_id(nombre_completo)')
        .eq('id', id)
        .single();

      if (errorProyecto) console.error("Error al cargar proyecto:", errorProyecto);
      else setProyecto(dataProyecto);

      // 2. Cargar estado de postulacion del estudiante
      if (user?.rol === 'Estudiante') {
        const { data: dataPostulacion } = await supabase
          .from('postulaciones')
          .select('id, estado')
          .eq('id_proyecto', id)
          .eq('id_estudiante', user.id)
          .single();

        if (dataPostulacion) setYaPostulado(dataPostulacion.estado); 
      }

      // 3. Cargar Entregables usando creado_en para ordenar
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

  const abrirModalPostulacion = () => {
    if (!user) {
      alert("Debes iniciar sesion con tu cuenta de estudiante para poder postularte.");
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const confirmarPostulacion = async (e) => {
    e.preventDefault();
    setPostulando(true);
    
    // 1. Guardar la postulación
    const { error } = await supabase.from('postulaciones').insert([
      { 
        id_proyecto: id, 
        id_estudiante: user.id,
        mensaje_estudiante: mensaje,
        documento_kardex_url: kardexUrl,
        estado: 'Pendiente'
      }
    ]);

    if (error) {
      alert("Error al procesar tu postulación.");
      console.error(error);
    } else {
      // 2. Enviar notificación al investigador responsable
      if (proyecto?.investigador_id) {
        await supabase.from('notificaciones').insert([
          {
            usuario_id: proyecto.investigador_id,
            tipo: 'postulacion',
            mensaje: `El alumno ${user?.nombre_completo || 'un estudiante'} se ha postulado a tu proyecto: "${proyecto.titulo}".`
          }
        ]);
      }

      alert("Postulación enviada con éxito.");
      setYaPostulado('Pendiente'); 
      setIsModalOpen(false); 
    }
    setPostulando(false);
  };

  // Funcion de insercion con nombres de columnas actualizados
  const handleSubirTarea = async (e) => {
    e.preventDefault();
    setSubiendoTarea(true);

    const { data, error } = await supabase.from('tareas_entregables').insert([
      {
        id_proyecto: id,
        id_estudiante: user.id,
        titulo_tarea: tituloTarea,
        archivo_adjunto_url: archivoAdjuntoUrl,
        estado: 'Entregado'
      }
    ]).select('*, estudiante:usuarios!id_estudiante(nombre_completo)').single();

    if (error) {
      alert("Error al subir entregable.");
      console.error(error);
    } else {
      alert("Entregable enviado con exito.");
      setEntregables([data, ...entregables]);
      setTituloTarea('');
      setArchivoAdjuntoUrl('');
    }
    setSubiendoTarea(false);
  };
  
  const handleCalificarTarea = async (tareaId, nuevoEstado, observaciones) => {
    const tarea = entregables.find(t => t.id === tareaId);

    const { error } = await supabase
      .from('tareas_entregables')
      .update({
        estado: nuevoEstado,
        observaciones_retroalimentacion: observaciones
      })
      .eq('id', tareaId);

    if (error) {
      alert("Error al actualizar la revisión.");
      console.error(error);
    } else {
      setEntregables(entregables.map(t => 
        t.id === tareaId 
          ? { ...t, estado: nuevoEstado, observaciones_retroalimentacion: observaciones } 
          : t
      ));

      // Inserta notificación para el alumno de la tarea
      if (tarea?.id_estudiante) {
        await supabase.from('notificaciones').insert([
          {
            usuario_id: tarea.id_estudiante,
            tipo: 'revision',
            mensaje: `Tu entrega "${tarea.titulo_tarea}" fue marcada como: ${nuevoEstado}. Retroalimentación: "${observaciones}"`
          }
        ]);
      }
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center">Cargando detalles...</div>;
  if (!proyecto) return <div className="min-h-screen flex justify-center items-center">Proyecto no encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative">
      <div className="max-w-5xl mx-auto space-y-8">
        
{/* CAJA PRINCIPAL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-start gap-4 flex-wrap md:flex-nowrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
              {proyecto.titulo}
            </h1>
            <div className="flex items-center gap-3 flex-shrink-0">
              <NotificacionesBell />
              <button 
                onClick={() => navigate(-1)} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
              >
                ← Regresar
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-100 p-4 rounded-t-lg border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Detalle de la Propuesta de Verano</h2>
            </div>

            <div className="border border-t-0 border-slate-200 rounded-b-lg p-6 space-y-4">
              <InfoBox titulo="Descripcion" texto={proyecto.descripcion} />
              <InfoBox titulo="Objetivo" texto={proyecto.objetivo} />
              <InfoBox titulo="Pre-requisitos" texto={proyecto.pre_requisitos} />
              <InfoBox titulo="Requisitos" texto={proyecto.requisitos} />
              
              <div className="mt-8 pt-4 border-t border-slate-100 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  Investigador responsable: <span className="font-semibold text-slate-700 uppercase">{proyecto.investigador?.nombre_completo}</span>
                </div>
                
                {user?.rol === 'Estudiante' && proyecto.estado?.toLowerCase() !== 'finalizado' && (
                  <div>
                    {yaPostulado === 'Aceptado' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Postulacion Aceptada
                      </span>
                    ) : yaPostulado === 'Rechazado' ? (
                      <span className="bg-red-100 text-red-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        Postulacion Rechazada
                      </span>
                    ) : yaPostulado === 'Pendiente' ? (
                      <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Postulacion en Revision
                      </span>
                    ) : (
                      <button onClick={abrirModalPostulacion} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-semibold transition-colors shadow-sm">
                        Postularme a este proyecto
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ESPACIO DE TRABAJO Y ENTREGABLES */}
        {(yaPostulado === 'Aceptado' || user?.id === proyecto.investigador_id) && (
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  Espacio de Trabajo / Entregables
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {user?.rol === 'Estudiante' ? 'Sube aqui tus reportes y avances del proyecto.' : 'Revisa los avances de tus alumnos aceptados.'}
                </p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Formulario para Estudiantes */}
              {user?.rol === 'Estudiante' && (
                <div className="lg:col-span-1 bg-slate-800 p-5 rounded-lg border border-slate-700 h-fit">
                  <h3 className="text-white font-semibold mb-4">Enviar nuevo entregable</h3>
                  <form onSubmit={handleSubirTarea} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Titulo de la entrega (Ej. Reporte Semanal 1)</label>
                      <input 
                        type="text" 
                        required 
                        value={tituloTarea} 
                        onChange={(e) => setTituloTarea(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Enlace del documento (Drive, GitHub, PDF)</label>
                      <input 
                        type="url" 
                        required 
                        value={archivoAdjuntoUrl} 
                        onChange={(e) => setArchivoAdjuntoUrl(e.target.value)} 
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 outline-none" 
                        placeholder="https://" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={subiendoTarea} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      {subiendoTarea ? 'Enviando...' : 'Subir Entregable'}
                    </button>
                  </form>
                </div>
              )}

              {/* Listado de Entregas */}
              <div className={`lg:col-span-${user?.rol === 'Estudiante' ? '2' : '3'} space-y-3`}>
                <h3 className="text-white font-semibold mb-4">Historial de Entregas</h3>
                
                {entregables.length === 0 ? (
                  <div className="text-slate-500 text-center py-8 bg-slate-800 rounded-lg border border-slate-700 border-dashed">
                    No hay entregables registrados aún.
                  </div>
                ) : (
                  entregables.map((tarea) => (
                    <div key={tarea.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-blue-400 font-bold">{tarea.titulo_tarea}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              tarea.estado === 'Aprobado' ? 'bg-emerald-900 text-emerald-200 border border-emerald-700' :
                              tarea.estado === 'Corregir' ? 'bg-red-900 text-red-200 border border-red-700' :
                              'bg-amber-900 text-amber-200 border border-amber-700'
                            }`}>
                              {tarea.estado || 'Pendiente'}
                            </span>
                          </div>
                          {user?.rol === 'Investigador' && (
                            <p className="text-xs text-slate-300 mt-0.5">
                              Estudiante: <span className="font-semibold uppercase text-slate-100">{tarea.estudiante?.nombre_completo}</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            Fecha: {tarea.creado_en ? new Date(tarea.creado_en).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                          </p>
                        </div>

                        <a 
                          href={tarea.archivo_adjunto_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 self-start md:self-auto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          Ver Archivo
                        </a>
                      </div>

                      {/* Observaciones visibles */}
                      {tarea.observaciones_retroalimentacion && (
                        <div className="bg-slate-900/70 p-2.5 rounded border border-slate-700/60 text-xs">
                          <span className="font-semibold text-slate-400 block mb-0.5">Retroalimentación del docente:</span>
                          <p className="text-slate-300 italic">{tarea.observaciones_retroalimentacion}</p>
                        </div>
                      )}

                      {/* Acciones para el docente */}
                      {user?.id === proyecto.investigador_id && (
                        <div className="flex gap-2 pt-2 border-t border-slate-700/50 justify-end">
                          <button
                            onClick={() => {
                              const obs = prompt("Comentarios o correcciones:", tarea.observaciones_retroalimentacion || "");
                              if (obs !== null) handleCalificarTarea(tarea.id, 'Corregir', obs);
                            }}
                            className="text-xs bg-red-950 text-red-300 hover:bg-red-900 px-2.5 py-1 rounded transition-colors"
                          >
                            Pedir Corrección
                          </button>
                          <button
                            onClick={() => {
                              const obs = prompt("Comentarios de aprobación:", tarea.observaciones_retroalimentacion || "Excelente trabajo.");
                              if (obs !== null) handleCalificarTarea(tarea.id, 'Aprobado', obs);
                            }}
                            className="text-xs bg-emerald-950 text-emerald-300 hover:bg-emerald-900 px-2.5 py-1 rounded transition-colors"
                          >
                            Aprobar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
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
              <h3 className="text-lg font-bold text-slate-800">Formulario de Postulacion</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">x</button>
            </div>
            
            <form onSubmit={confirmarPostulacion} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carta de Motivos</label>
                <p className="text-xs text-slate-500 mb-2">Explicale al investigador por que te interesa participar en este proyecto y que habilidades puedes aportar.</p>
                <textarea required rows="4" value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Estimado investigador..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enlace al Kardex / Historial Academico</label>
                <p className="text-xs text-slate-500 mb-2">Pega aqui un enlace publico donde el profesor pueda ver tu Kardex.</p>
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