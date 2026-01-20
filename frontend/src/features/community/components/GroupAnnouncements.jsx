import { Megaphone, Plus, User, Calendar, MessageSquare, ThumbsUp } from 'lucide-react';

/**
 * Componente para mostrar la lista de anuncios de un grupo
 * @param {Object} props
 * @param {Array} props.announcements - Lista de anuncios del grupo
 * @param {boolean} props.isOwner - Si el usuario actual es dueño/admin del grupo
 * @param {Function} props.onCreateAnnouncement - Callback para crear anuncio (opcional)
 */
const GroupAnnouncements = ({ announcements = [], isOwner = false, onCreateAnnouncement }) => {
  
  // Formatear fecha de publicación
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffHrs < 1) return 'Hace un momento';
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone size={24} className="text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Anuncios del Grupo</h2>
        </div>
        
        {isOwner && (
          <button
            onClick={onCreateAnnouncement}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded transition-colors"
          >
            <Plus size={16} />
            Publicar Anuncio
          </button>
        )}
      </div>

      {/* Estado vacío */}
      {announcements.length === 0 ? (
        <div className="bg-[#16202d] rounded-xl border border-[#2a3f5f] p-12 text-center">
          <div className="w-16 h-16 bg-[#2a3f5f] rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone size={28} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No hay anuncios publicados
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            No hay anuncios publicados en este grupo aún. 
            {isOwner && ' Como administrador, puedes crear el primer anuncio para informar a los miembros.'}
          </p>
          
          {isOwner && (
            <button
              onClick={onCreateAnnouncement}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded transition-colors mx-auto"
            >
              <Plus size={18} />
              Crear Primer Anuncio
            </button>
          )}
        </div>
      ) : (
        /* Lista de anuncios */
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <article 
              key={announcement.id}
              className="bg-[#16202d] rounded-xl border border-[#2a3f5f] overflow-hidden hover:border-[#3a5070] transition-colors"
            >
              {/* Imagen del anuncio (si existe) */}
              {announcement.imagen_url && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={announcement.imagen_url} 
                    alt={announcement.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Contenido del anuncio */}
              <div className="p-6">
                {/* Header: Autor y fecha */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar del autor */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                      {announcement.profiles?.avatar_url ? (
                        <img 
                          src={announcement.profiles.avatar_url} 
                          alt={announcement.profiles.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={18} className="text-white" />
                      )}
                    </div>
                    
                    <div>
                      <p className="text-white font-medium text-sm">
                        {announcement.profiles?.username || 'Administrador'}
                      </p>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Calendar size={12} />
                        <span>{formatTimeAgo(announcement.fecha_publicacion || announcement.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge de fijado */}
                  {announcement.fijado && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded">
                      📌 Fijado
                    </span>
                  )}
                </div>

                {/* Título */}
                <h3 className="text-lg font-bold text-white mb-3 hover:text-cyan-400 transition-colors cursor-pointer">
                  {announcement.titulo}
                </h3>

                {/* Contenido/Preview */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  {announcement.contenido?.length > 300 
                    ? `${announcement.contenido.substring(0, 300)}...` 
                    : announcement.contenido
                  }
                </p>

                {/* Footer: Stats y acciones */}
                <div className="flex items-center justify-between pt-4 border-t border-[#2a3f5f]">
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    {/* Likes */}
                    <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                      <ThumbsUp size={14} />
                      <span>{announcement.likes || 0}</span>
                    </button>
                    
                    {/* Comentarios */}
                    <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                      <MessageSquare size={14} />
                      <span>{announcement.comments || announcement.comentarios || 0}</span>
                    </button>
                  </div>
                  
                  <button className="text-cyan-400 text-sm hover:underline">
                    Leer más →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupAnnouncements;
