import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeveloperAuth } from '../../developer-auth/hooks/useDeveloperAuth';
import { gameKeysService } from '../services/gameKeysService';
import { developerAuthService } from '../../developer-auth/services/developerAuthService';
import {
  HeaderDashboard,
  Notificacion,
  SelectorJuegos,
  FormularioGenerarLlaves,
  ListaLlaves,
  ModalDesactivarLlave
} from '../components';

export const GestionLlavesPage = ({ mostrarHeader = true }) => {
  const navigate = useNavigate();
  const { desarrollador, logout } = useDeveloperAuth();
  
  const [juegos, setJuegos] = useState([]);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState(null);
  const [llaves, setLlaves] = useState([]);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  const [modalDesactivar, setModalDesactivar] = useState(false);
  const [llaveADesactivar, setLlaveADesactivar] = useState(null);
  const [motivoDesactivacion, setMotivoDesactivacion] = useState('');

  useEffect(() => {
    cargarJuegos();
  }, []);

  useEffect(() => {
    if (juegoSeleccionado) {
      cargarLlaves(juegoSeleccionado);
    }
  }, [juegoSeleccionado]);

  const cargarJuegos = async () => {
    try {
      setLoading(true);

      const response = await developerAuthService.obtenerAplicaciones();
      
      if (!Array.isArray(response.data)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      const aplicacionesFormateadas = response.data
        .filter(app => app.id && app.nombre_juego)
        .map(app => ({
          id: app.id,
          nombre: app.nombre_juego,
          llaves_activas: 0,
          llaves_maximas: 5,
          estado_revision: app.estado_revision || 'pendiente',
          fecha_creacion: app.fecha_creacion
        }));

      // Cargar las llaves de cada juego para mostrar el conteo real
      const juegosConLlaves = await Promise.all(
        aplicacionesFormateadas.map(async (juego) => {
          try {
            const data = await gameKeysService.listarLlaves(juego.id);
            const llaves = data?.llaves || [];
            return {
              ...juego,
              llaves_activas: llaves.length
            };
          } catch (error) {
            console.error(`Error al cargar llaves del juego ${juego.id}:`, error);
            return juego; // Mantener con 0 si falla
          }
        })
      );

      setJuegos(juegosConLlaves);
      
      if (juegosConLlaves.length === 0) {
        mostrarMensaje('No tienes aplicaciones aprobadas. Las aplicaciones deben ser aprobadas por un administrador antes de generar llaves.', 'info');
      } else if (juegosConLlaves.length > 0) {
        setJuegoSeleccionado(juegosConLlaves[0].id);
      }
    } catch (error) {
      console.error('Error al cargar juegos:', error);
      mostrarMensaje('Error al cargar aplicaciones. Por favor, intenta nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarLlaves = async (juegoId) => {
    try {
      setLoading(true);
      const data = await gameKeysService.listarLlaves(juegoId);
      const llaves = data?.llaves || [];
      setLlaves(llaves);
      
      setJuegos(prevJuegos => 
        prevJuegos.map(juego => 
          juego.id === juegoId 
            ? { ...juego, llaves_activas: llaves.length, llaves_maximas: 5 }
            : juego
        )
      );
    } catch (error) {
      mostrarMensaje(error.message || 'Error al cargar llaves', 'error');
      setLlaves([]);
    } finally {
      setLoading(false);
    }
  };

  const generarLlaves = async () => {
    if (!juegoSeleccionado) {
      mostrarMensaje('Selecciona un juego primero', 'error');
      return;
    }

    const juegoActual = juegos.find(j => j.id === juegoSeleccionado);
    const llavesRestantes = juegoActual ? (juegoActual.llaves_maximas || 5) - (juegoActual.llaves_activas || 0) : 5;

    if (cantidad < 1 || cantidad > llavesRestantes) {
      mostrarMensaje(`La cantidad debe estar entre 1 y ${llavesRestantes}`, 'error');
      return;
    }

    try {
      setLoading(true);
      const data = await gameKeysService.generarLlaves(juegoSeleccionado, cantidad);
      mostrarMensaje(`Llave(s) generada(s) exitosamente`, 'success');
      setCantidad(1);
      await cargarLlaves(juegoSeleccionado);
    } catch (error) {
      mostrarMensaje(error.message || 'Error al generar llaves', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copiarLlave = (llave) => {
    navigator.clipboard.writeText(llave);
    mostrarMensaje('Llave copiada al portapapeles', 'success');
  };

  const abrirModalDesactivar = (llaveId) => {
    setLlaveADesactivar(llaveId);
    setMotivoDesactivacion('');
    setModalDesactivar(true);
  };

  const cerrarModalDesactivar = () => {
    setModalDesactivar(false);
    setLlaveADesactivar(null);
    setMotivoDesactivacion('');
  };

  const confirmarDesactivar = async () => {
    if (!motivoDesactivacion.trim()) {
      mostrarMensaje('El motivo es requerido', 'error');
      return;
    }

    try {
      setLoading(true);
      await gameKeysService.desactivarLlave(llaveADesactivar, motivoDesactivacion);
      mostrarMensaje('Llave desactivada exitosamente', 'success');
      cerrarModalDesactivar();
      await cargarLlaves(juegoSeleccionado);
    } catch (error) {
      mostrarMensaje(error.message || 'Error al desactivar llave', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/steamworks/login');
    } catch (err) {
      console.error('Error en logout:', err);
    }
  };

  const juegoActual = juegos.find(j => j.id === juegoSeleccionado);
  const llavesRestantes = juegoActual ? (juegoActual.llaves_maximas || 5) - (juegoActual.llaves_activas || 0) : 5;

  return (
    <div className={mostrarHeader ? "min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]" : ""}>
      {mostrarHeader && (
        <HeaderDashboard 
          nombreDesarrollador={desarrollador?.nombre_legal || 'Desarrollador'}
          onLogout={handleLogout}
        />
      )}

      {mensaje && (
        <div className={mostrarHeader ? "max-w-7xl mx-auto px-4 pt-4" : "mb-4"}>
          <Notificacion 
            texto={mensaje.texto}
            tipo={mensaje.tipo}
          />
        </div>
      )}

      <main className={mostrarHeader ? "max-w-7xl mx-auto px-4 py-8" : ""}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <SelectorJuegos 
              juegos={juegos}
              juegoSeleccionado={juegoSeleccionado}
              onSeleccionar={setJuegoSeleccionado}
            />

            {juegoSeleccionado && (
              <FormularioGenerarLlaves 
                llavesDisponibles={llavesRestantes}
                cantidad={cantidad}
                onCantidadChange={setCantidad}
                onGenerar={generarLlaves}
                loading={loading}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <ListaLlaves 
              llaves={llaves}
              juegoActual={juegoActual}
              loading={loading}
              onCopiar={copiarLlave}
              onDesactivar={abrirModalDesactivar}
            />
          </div>
        </div>
      </main>

      {modalDesactivar && (
        <ModalDesactivarLlave 
          isOpen={modalDesactivar}
          motivo={motivoDesactivacion}
          onMotivoChange={setMotivoDesactivacion}
          onConfirm={confirmarDesactivar}
          onClose={cerrarModalDesactivar}
          loading={loading}
        />
      )}
    </div>
  );
};
