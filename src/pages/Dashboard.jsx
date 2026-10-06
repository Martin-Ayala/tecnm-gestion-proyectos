import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
// Importamos los componentes de la librería de gráficas
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

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
        .select('*, investigador:usuarios!investigador_id(nombre_completo)')
        .order('fecha_creacion', { ascending: false });

      if (error) console.error("Error cargando:", error);
      else setProyectos(data);
      
      setLoadingProyectos(false);
    };
    fetchProyectos();
  }, [refresh]);

  // Funciones CRUD (Mantienen la misma lógica segura)
  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('proyectos').insert([
      { titulo: nuevoTitulo, descripcion: nuevaDescripcion, investigador_id: user.id }
    ]);
    if (error) alert("Hubo un error al crear.");
    else {
      setIsModalOpen(false);
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setRefresh((prev) => prev + 1); 
    }
    setIsSubmitting(false);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proyecto de forma permanente?")) return;
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) alert("Error al intentar eliminar el proyecto.");
    else setRefresh((prev) => prev + 1);
  };

  const abrirModalEdicion = (proyecto) => {
    setProyectoEditando(proyecto.id);
    setEditTitulo(proyecto.titulo);
    setEditDescripcion(proyecto.descripcion || '');
    setEditEstado(proyecto.estado || 'Borrador');
    setIsEditModalOpen(true);
  };

  const handleActualizarProyecto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase
      .from('proyectos')
      .update({ titulo: editTitulo, descripcion: editDescripcion, estado: editEstado })
      .eq('id', proyectoEditando);
    if (error) alert("Error al guardar los cambios.");
    else {
      setIsEditModalOpen(false);
      setRefresh((prev) => prev + 1);
    }
    setIsSubmitting(false);
  };

  // ==========================================
  // LÓGICA DE MÉTRICAS PARA EL ENTREGABLE 3.4
  // ==========================================
  const totalProyectos = proyectos.length;
  const proyectosActivos = proyectos.filter(p => p.estado === 'Activo').length;
  const proyectosFinalizados = proyectos.filter(p => p.estado === 'Finalizado').length;
  const proyectosBorrador = proyectos.filter(p => p.estado === 'Borrador' || !p.estado).length;

  const datosGraficaEstado = [
    { name: 'Activos', cantidad: proyectosActivos, color: '#10b981' }, // Verde
    { name: 'Finalizados', cantidad: proyectosFinalizados, color: '#3b82f6' }, // Azul
    { name: 'Borradores', cantidad: proyectosBorrador, color: '#64748b' } // Gris
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-slate-200 relative z-10">
        <h1 className="text-xl font-bold text-blue-900">TecNM <span className="text-blue-600">Gestión Interna</span></h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">
            {user?.nombre_completo} <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs ml-2">{user?.rol}</span>
          </span>
          <button onClick={handleLogout} className="text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-semibold transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto relative z-10">
        
        {/* ENCABEZADO DEL DASHBOARD */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Analítico</h2>
            <p className="text-slate-500 text-sm mt-1">Métricas operativas del periodo 2026</p>
          </div>
          {user?.rol === 'Investigador' && (
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Nuevo Proyecto
            </button>
          )}
        </div>

        {/* SECCIÓN DE MÉTRICAS (KPIs) Y GRÁFICAS */}
        {!loadingProyectos && proyectos.length > 0 && (
          <div className="mb-12">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <span className="text-slate-500 text-sm font-medium mb-1">Total Registrados</span>
                <span className="text-3xl font-bold text-slate-800">{totalProyectos}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                <span className="text-emerald-600 text-sm font-medium mb-1">En Curso (Activos)</span>
                <span className="text-3xl font-bold text-emerald-700">{proyectosActivos}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
                <span className="text-blue-600 text-sm font-medium mb-1">Concluidos</span>
                <span className="text-3xl font-bold text-blue-700">{proyectosFinalizados}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <span className="text-slate-500 text-sm font-medium mb-1">En Preparación</span>
                <span className="text-3xl font-bold text-slate-600">{proyectosBorrador}</span>
              </div>
            </div>

            {/* Gráficas con Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfica de Anillo */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
                <h3 className="text-slate-700 font-semibold mb-4">Distribución por Estado</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={datosGraficaEstado} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="cantidad">
                        {datosGraficaEstado.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfica de Barras */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
                <h3 className="text-slate-700 font-semibold mb-4">Volumen de Proyectos</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosGraficaEstado} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                        {datosGraficaEstado.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN DE GESTIÓN (GRID DE PROYECTOS) */}
        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Gestión de Registros</h3>
        
        {loadingProyectos ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
            Cargando base de datos...
          </div>
        ) : proyectos.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
            <div className="text-slate-400 mb-2 text-4xl">📂</div>
            <h3 className="text-lg font-medium text-slate-700">El sistema está vacío</h3>
            <p className="text-sm text-slate-500 mt-1">Registra el primer proyecto para visualizar métricas.</p>
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
                    Investigador: <span className="font-medium text-slate-700 block uppercase">{proyecto.investigador?.nombre_completo || 'No asignado'}</span>
                  </div>
                  
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