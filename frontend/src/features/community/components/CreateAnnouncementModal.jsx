import { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateAnnouncementModal({ isOpen, onClose, onSubmit, loading }) {
    const [titulo, setTitulo] = useState('');
    const [contenido, setContenido] = useState('');
    const [fechaHora, setFechaHora] = useState('');
    const [fijado, setFijado] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!titulo.trim() || !contenido.trim() || !fechaHora) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            // Convertir la fecha local a ISO con zona horaria
            const localDate = new Date(fechaHora);
            const isoDateWithTimezone = localDate.toISOString();
            
            await onSubmit({ 
                titulo, 
                contenido, 
                fecha_expiracion: isoDateWithTimezone,
                fijado 
            });
            setTitulo('');
            setContenido('');
            setFechaHora('');
            setFijado(false);
            onClose();
        } catch (error) {
            alert(error.message || 'Error al crear el anuncio');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-lg w-full max-w-2xl">
                <div className="flex items-center justify-between p-6 border-b border-[#2a475e]">
                    <h2 className="text-2xl font-bold text-white">Crear Anuncio</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-300 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full px-4 py-2 bg-[#2a475e] border border-[#3a576e] rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            placeholder="Título del anuncio"
                            maxLength={100}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">{titulo.length}/100</p>
                    </div>

                    <div>
                        <label htmlFor="contenido" className="block text-sm font-medium text-gray-300 mb-2">
                            Contenido *
                        </label>
                        <textarea
                            id="contenido"
                            value={contenido}
                            onChange={(e) => setContenido(e.target.value)}
                            className="w-full px-4 py-2 bg-[#2a475e] border border-[#3a576e] rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-[150px]"
                            placeholder="Escribe el contenido del anuncio..."
                            maxLength={1000}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">{contenido.length}/1000</p>
                    </div>

                    <div>
                        <label htmlFor="fechaHora" className="block text-sm font-medium text-gray-300 mb-2">
                            Fecha y Hora *
                        </label>
                        <input
                            type="datetime-local"
                            id="fechaHora"
                            value={fechaHora}
                            onChange={(e) => setFechaHora(e.target.value)}
                            className="w-full px-4 py-2 bg-[#2a475e] border border-[#3a576e] rounded text-white focus:outline-none focus:border-blue-500"
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            El anuncio expirará automáticamente en esta fecha
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-[#2a475e] rounded border border-[#3a576e]">
                        <input
                            type="checkbox"
                            id="fijado"
                            checked={fijado}
                            onChange={(e) => setFijado(e.target.checked)}
                            className="w-5 h-5 bg-[#1b2838] border border-[#3a576e] rounded focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <label htmlFor="fijado" className="text-sm text-gray-300 flex-1">
                            <span className="font-semibold text-white">Fijar en la parte superior del grupo</span>
                            <p className="text-xs text-gray-400 mt-1">
                                Solo puede haber un anuncio fijado a la vez. Se mostrará en la parte superior hasta que expire.
                            </p>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-[#2a475e] hover:bg-[#3a576e] text-white rounded transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Creando...' : 'Crear Anuncio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
