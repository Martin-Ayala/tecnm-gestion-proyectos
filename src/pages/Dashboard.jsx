import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [proyectos, setProyectos] = useState([]);
  const [loadingProyectos, setLoadingProyectos] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Estados para Modal de CREAR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para Modal de EDITAR (UPDATE)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editEstado, setEditEstado] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Función READ
  useEffect(() => {
    const fetchProyectos = async () => {
      setLoadingProyectos(true);
      const { data, error } = await supabase
        .from('proyectos')
        .select('*, investigador:usuarios(nombre_completo)')
        .order('fecha_creacion', { ascending: false });

      if (error) console.error("Error cargando:", error);
      else setProyectos(data);
      
      setLoadingProyectos(false);
    };
    fetchProyectos();
  }, [refresh]);

  // Función CREATE
  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('proyectos').insert([
      { titulo: nuevoTitulo, descripcion: nuevaDescripcion, investigador_id: user.id }
    ]);

    if (error) {
      alert("Hubo un error al crear.");
    } else {
      setIsModalOpen(false);
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setRefresh((prev) => prev + 1); 
    }
    setIsSubmitting(false);
  };

  // Función DELETE
  const handleEliminar = async (id) => {
    // Ventanita de confirmación nativa del navegador
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proyecto de forma permanente?")) return;

    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    
    if (error) {
      console.error("Error al eliminar:", error);
      alert("Error al intentar eliminar el proyecto.");
    } else {
      setRefresh((prev) => prev + 1); // Recargamos la lista
    }
  };

  // Preparar Modal de EDITAR
  const abrirModalEdicion = (proyecto) => {
    setProyectoEditando(proyecto.id);
    setEditTitulo(proyecto.titulo);
    setEditDescripcion(proyecto.descripcion || '');
    setEditEstado(proyecto.estado || 'Borrador');
    setIsEditModalOpen(true);
  };

  // Función UPDATE
  const handleActualizarProyecto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('proyectos')
      .update({
        titulo: editTitulo,
        descripcion: editDescripcion,
        estado: editEstado
      })
      .eq('id', proyectoEditando);

    if (error) {
      console.error("Error al actualizar:", error);
      alert("Error al guardar los cambios.");
    } else {
      setIsEditModalOpen(false);
      setRefresh((prev) => prev + 1);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-slate-200 relative z-10">
        <h1 className="text-xl font-bold text-blue-900">TecNM Gestión</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">
            {user?.nombre_completo} <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs ml-2">{user?.rol}</span>
          </span>
          <button onClick={handleLogout} className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-semibold transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Panel de Proyectos</h2>
          {user?.rol === 'Investigador' && (
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm">
              + Nuevo Proyecto
            </button>
          )}
        </div>

        {loadingProyectos ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
            Cargando proyectos...
          </div>
        ) : proyectos.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
            <div className="text-slate-400 mb-2 text-4xl">📂</div>
            <h3 className="text-lg font-medium text-slate-700">No hay proyectos activos</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((proyecto) => (
              <div key={proyecto.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{proyecto.titulo}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    proyecto.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    proyecto.estado === 'Finalizado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {proyecto.estado || 'Borrador'}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-grow">{proyecto.descripcion}</p>
                
                <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-auto">
                  <div className="text-xs text-slate-500">
                    Investigador: <span className="font-medium text-slate-700 block">{proyecto.investigador?.nombre_completo || 'No asignado'}</span>
                  </div>
                  
                  {/* Botones de UPDATE y DELETE (Solo visibles si eres el dueño) */}
                  {user?.id === proyecto.investigador_id && (
                    <div className="flex gap-3">
                      <button onClick={() => abrirModalEdicion(proyecto)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(proyecto.id)} className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">
                        Borrar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: CREAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Crear Nuevo Proyecto</h3>
            </div>
            <form onSubmit={handleCrearProyecto} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input type="text" required value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea required rows="4" value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Editar Proyecto</h3>
            </div>
            <form onSubmit={handleActualizarProyecto} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input type="text" required value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea required rows="4" value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado del Proyecto</label>
                <select value={editEstado} onChange={(e) => setEditEstado(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Borrador">Borrador</option>
                  <option value="Activo">Activo</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg disabled:opacity-50">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}