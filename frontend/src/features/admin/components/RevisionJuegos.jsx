import { useState, useEffect } from 'react';
import {
  getRevisionesJuegos,
  aprobarJuego,
  rechazarJuego,
  verifyMFACode
} from '../services/adminAuthService';
import MFAModal from './MFAModal';

const RevisionJuegos = () => {
  const [revisiones, setRevisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [comentarios, setComentarios] = useState('');
  const [accionActual, setAccionActual] = useState(null);
  
  // Estados para MFA Modal
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [mfaOperationType, setMfaOperationType] = useState('');

  useEffect(() => {
    loadRevisiones();
  }, [filtroEstado]);

  const loadRevisiones = async () => {
    try {
      setLoading(true);
      const data = await getRevisionesJuegos(filtroEstado || undefined);
      setRevisiones(data);
    } catch (err) {
      setError(err.message || 'Error al cargar revisiones');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (revision) => {
    setSelectedRevision(revision);
    setAccionActual('aprobar');
    setComentarios('');
  };

  const handleRechazar = async (revision) => {
    setSelectedRevision(revision);
    setAccionActual('rechazar');
    setComentarios('');
  };

  const confirmarAccion = async () => {
    if (!selectedRevision) return;

    // Validar comentarios si es rechazo
    if (accionActual === 'rechazar' && !comentarios.trim()) {
      alert('Los comentarios son obligatorios al rechazar un juego');
      return;
    }

    // Guardar la acción pendiente y mostrar modal MFA
    const operationType = accionActual === 'aprobar' ? 'aprobación de juego' : 'rechazo de juego';
    setMfaOperationType(operationType);
    setPendingAction({
      type: accionActual,
      revisionId: selectedRevision.id,
      comentarios
    });
    
    // Cerrar el modal de confirmación y abrir el modal MFA
    setSelectedRevision(null);
    setShowMFAModal(true);
  };

  const executeAction = async () => {
    try {
      if (pendingAction.type === 'aprobar') {
        await aprobarJuego(pendingAction.revisionId, pendingAction.comentarios);
      } else if (pendingAction.type === 'rechazar') {
        await rechazarJuego(pendingAction.revisionId, pendingAction.comentarios);
      }
      
      setComentarios('');
      setAccionActual(null);
      await loadRevisiones();
      alert('Operación realizada exitosamente');
    } catch (err) {
      alert(err.message || 'Error al procesar la acción');
    }
  };

  const handleMFAVerify = async (code) => {
    // Verificar el código MFA
    await verifyMFACode(code);
    
    // Si la verificación es exitosa, ejecutar la acción pendiente
    await executeAction();
    
    // Limpiar estado
    setPendingAction(null);
    setMfaOperationType('');
  };

  const cancelarAccion = () => {
    setSelectedRevision(null);
    setComentarios('');
    setAccionActual(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#ffc107';
      case 'aprobado': return '#28a745';
      case 'rechazado': return '#dc3545';
      default: return '#8f98a0';
    }
  };

  if (loading) {
    return <div style={{ color: '#c7d5e0' }}>Cargando revisiones...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#66c0f4', margin: 0 }}>
          Revisión de Juegos
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2a475e',
              color: '#c7d5e0',
              border: '1px solid #3d5a80',
              borderRadius: '4px'
            }}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendientes de revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ color: '#dc3545', padding: '1rem', backgroundColor: '#dc354520', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Modal para confirmar acción */}
      {selectedRevision && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e2a38',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ color: '#66c0f4', marginTop: 0 }}>
              {accionActual === 'aprobar' && 'Aprobar Juego'}
              {accionActual === 'rechazar' && 'Rechazar Juego'}
            </h3>
            <p style={{ color: '#c7d5e0', marginBottom: '1rem' }}>
              ID del juego: <strong>{selectedRevision.id_juego}</strong>
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#c7d5e0', marginBottom: '0.5rem' }}>
                Comentarios {accionActual === 'rechazar' ? '(obligatorios)' : '(opcionales)'}
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                rows="4"
                placeholder="Escribe tus comentarios aquí..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#2a475e',
                  color: '#c7d5e0',
                  border: '1px solid #3d5a80',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelarAccion}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAccion}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: accionActual === 'rechazar' ? '#dc3545' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#16202d', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e2a38', borderBottom: '2px solid #2a475e' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>ID Juego</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Comentarios</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Fecha</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {revisiones.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#8f98a0' }}>
                  No hay revisiones con el filtro seleccionado
                </td>
              </tr>
            ) : (
              revisiones.map((revision) => (
                <tr key={revision.id} style={{ borderBottom: '1px solid #2a475e' }}>
                  <td style={{ padding: '0.75rem', color: '#c7d5e0', fontFamily: 'monospace' }}>
                    {revision.id_juego.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      color: getEstadoColor(revision.estado),
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }}>
                      {revision.estado}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem', maxWidth: '300px' }}>
                    {revision.comentarios_retroalimentacion || 'Sin comentarios'}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem' }}>
                    {formatDate(revision.created_at)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {revision.estado === 'pendiente' && (
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleAprobar(revision)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(revision)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                    {revision.estado !== 'pendiente' && (
                      <span style={{ color: '#8f98a0', fontSize: '0.75rem' }}>
                        Procesado
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal de verificación MFA */}
      <MFAModal
        isOpen={showMFAModal}
        onClose={() => {
          setShowMFAModal(false);
          setPendingAction(null);
          setMfaOperationType('');
          // Restaurar el modal de confirmación si hay una revisión seleccionada
          if (pendingAction) {
            setComentarios(pendingAction.comentarios);
            setAccionActual(pendingAction.type);
          }
        }}
        onVerify={handleMFAVerify}
        operationType={mfaOperationType}
      />
    </div>
  );
};

export default RevisionJuegos;
