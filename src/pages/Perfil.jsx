import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

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

                // Recorte centrado (1:1) para fotos rectangulares
                const menor = Math.min(img.width, img.height);
                const inicioX = (img.width - menor) / 2;
                const inicioY = (img.height - menor) / 2;

                // Dibujar en el canvas recortado y redimensionado
                ctx.drawImage(img, inicioX, inicioY, menor, menor, 0, 0, anchoMax, altoMax);

                // Convertir a blob WebP
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error('Error al procesar la imagen en el canvas'));
                    resolve(new File([blob], `avatar_${Date.now()}.webp`, { type: 'image/webp' }));
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

    // Estados para edición
    const [telefono, setTelefono] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [subiendoAvatar, setSubiendoAvatar] = useState(false);
    const [guardandoInfo, setGuardandoInfo] = useState(false);

    // Estados para contraseña
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cambiandoPassword, setCambiandoPassword] = useState(false);

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
            }
            setLoading(false);
        };
        cargarPerfil();
    }, [user]);

    const handleSubirAvatar = async (e) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            setSubiendoAvatar(true);

            const fileOriginal = e.target.files[0];
            
            // Limitamos que sea de tipo imagen
            if (!fileOriginal.type.startsWith('image/')) {
                alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, etc).");
                setSubiendoAvatar(false);
                return;
            }

            // 1. Comprimir imagen en el frontend
            const fileOptimizado = await comprimirImagen(fileOriginal, 400, 400, 0.85);
            
            // 2. Definir ruta en Supabase Storage (aseguramos .webp por la compresión)
            const filePath = `${user.id}/avatar_${Date.now()}.webp`;

            // 3. Subir la imagen comprimida al bucket 'avatares'
            const { error: uploadError } = await supabase.storage
                .from('avatares')
                .upload(filePath, fileOptimizado, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            // 4. Obtener la URL pública
            const { data: urlData } = supabase.storage
                .from('avatares')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            // 5. Actualizar la base de datos
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            alert('¡Foto de perfil actualizada y optimizada con éxito!');
            
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
            alert('Error al guardar datos: ' + error.message);
        } else {
            alert('Datos de contacto actualizados correctamente.');
        }
        setGuardandoInfo(false);
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

    // Obtener iniciales para el avatar por defecto
    const iniciales = perfil.nombre_completo
        ? perfil.nombre_completo.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'US';

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* Barra de navegación superior */}
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
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Mi Perfil</h2>
                    <p className="text-slate-500 mt-1">Administra tu información personal y credenciales de acceso</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* COLUMNA IZQUIERDA: Tarjeta de Identidad y Avatar */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 w-full h-28 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-t-xl"></div>

                            {/* Contenedor del Avatar y Botón */}
                            <div className="relative mt-8 mb-4 w-32 h-32 flex justify-center items-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md bg-white relative z-10" />
                                ) : (
                                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 z-10 relative">
                                        {iniciales}
                                    </div>
                                )}

                                {/* Botón flotante de cámara */}
                                <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors border-2 border-white z-20 flex items-center justify-center" title="Cambiar foto de perfil">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleSubirAvatar} disabled={subiendoAvatar} />
                                </label>
                            </div>

                            {subiendoAvatar && <p className="text-xs text-blue-600 mb-2 font-medium animate-pulse">Optimizando y subiendo...</p>}

                            <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{perfil.nombre_completo}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold mb-4 ${perfil.rol === 'Administrador' ? 'bg-amber-100 text-amber-800' : perfil.rol === 'Investigador' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                {perfil.rol}
                            </span>

                            <div className="w-full text-left space-y-3 mt-2 pt-5 border-t border-slate-100 text-sm">
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Correo Electrónico</p>
                                    <p className="font-medium text-slate-700 truncate">{perfil.correo_institucional}</p>
                                </div>
                                {perfil.rol === 'Estudiante' && (
                                    <>
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Número de Control</p>
                                            <p className="font-medium text-slate-700">{perfil.numero_control || 'No registrado'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Carrera</p>
                                            <p className="font-medium text-slate-700">{perfil.carrera || 'No registrada'}</p>
                                        </div>
                                    </>
                                )}
                                <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 mt-4">
                                    <p>Tus datos académicos oficiales son de <b>solo lectura</b>. Si hay un error, contacta a Servicios Escolares.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Formularios de Edición */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Tarjeta de Contacto */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
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
                                        {guardandoInfo ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Tarjeta de Seguridad */}
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
                </div>
            </main>
        </div>
    );
}