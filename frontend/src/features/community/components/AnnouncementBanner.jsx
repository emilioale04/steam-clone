export default function AnnouncementBanner({ announcement }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isExpiringSoon = (expirationDate) => {
        if (!expirationDate) return false;
        const daysUntilExpiration = Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiration <= 3 && daysUntilExpiration > 0;
    };

    return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-lg font-semibold text-blue-900">
                        {announcement.titulo}
                    </h3>
                    <p className="mt-2 text-sm text-blue-800 whitespace-pre-wrap">
                        {announcement.contenido}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-blue-600">
                        <span>Por {announcement.profiles?.username || 'Moderador'}</span>
                        <span>•</span>
                        <span>{formatDate(announcement.fecha_publicacion)}</span>
                        {announcement.fecha_expiracion && (
                            <>
                                <span>•</span>
                                <span className={isExpiringSoon(announcement.fecha_expiracion) ? 'font-semibold' : ''}>
                                    Expira: {formatDate(announcement.fecha_expiracion)}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
