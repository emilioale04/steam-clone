import { useState, useEffect } from 'react';
import {
  getRevisionesJuegos,
  aprobarJuego,
  rechazarJuego,
  verifyMFACode,
  getInfoJuegoRevision
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

  // Estados para modal de información del juego
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [juegoInfo, setJuegoInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

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

  const handleVerInfo = async (idJuego) => {
    try {
      setLoadingInfo(true);
      setShowInfoModal(true);
      const info = await getInfoJuegoRevision(idJuego);
      setJuegoInfo(info);
    } catch (err) {
      alert(err.message || 'Error al cargar información del juego');
      setShowInfoModal(false);
    } finally {
      setLoadingInfo(false);
    }
  };

  const cerrarInfoModal = () => {
    setShowInfoModal(false);
    setJuegoInfo(null);
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
      let notificationMessage = '';
      
      if (pendingAction.type === 'aprobar') {
        const result = await aprobarJuego(pendingAction.revisionId, pendingAction.comentarios);
        
        // Construir mensaje con estado de notificaciones
        const messages = [];
        
        if (result.notificationSent) {
          messages.push('Notificación WebSocket enviada');
        } else if (result.notificationSaved) {
          messages.push('Notificación guardada (desarrollador desconectado)');
        }
        
        if (result.emailSent) {
          messages.push('Email enviado');
        }
        
        notificationMessage = messages.length > 0 
          ? ' ' + messages.join('. ') + '.'
          : '';
        
        alert('Juego aprobado exitosamente.' + notificationMessage);
      } else if (pendingAction.type === 'rechazar') {
        const result = await rechazarJuego(pendingAction.revisionId, pendingAction.comentarios);
        
        const emailMsg = result.emailSent ? ' Email enviado al desarrollador.' : '';
        alert('Juego rechazado exitosamente.' + emailMsg);
      }
      
      setComentarios('');
      setAccionActual(null);
      await loadRevisiones();
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
                          onClick={() => handleVerInfo(revision.id_juego)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#1e88e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Ver Info
                        </button>
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
      
      {/* Modal de información del juego */}
      {showInfoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflow: 'auto',
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: '#171a21',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            border: '1px solid #2a475e'
          }}>
            {/* Header del modal */}
            <div style={{
              background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
              padding: '1.5rem 2rem',
              borderBottom: '2px solid #66c0f4'
            }}>
              <h3 style={{ 
                color: '#66c0f4', 
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.75rem' }}>🎮</span>
                Información del Juego
              </h3>
            </div>
            
            {/* Contenido del modal */}
            <div style={{
              padding: '2rem',
              maxHeight: 'calc(90vh - 180px)',
              overflow: 'auto',
              paddingBottom: '1rem'
            }}>
              {loadingInfo ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem', 
                  color: '#c7d5e0',
                  fontSize: '1.1rem'
                }}>
                  <div style={{ 
                    fontSize: '2rem', 
                    marginBottom: '1rem',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}>⏳</div>
                  Cargando información...
                </div>
              ) : juegoInfo ? (
                <div style={{ color: '#c7d5e0' }}>
                  {/* Layout principal: Imagen a la izquierda, info a la derecha */}
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: juegoInfo.portada_image_path ? '280px 1fr' : '1fr',
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    {/* Columna izquierda: Portada */}
                    {juegoInfo.portada_image_path && (
                      <div style={{ 
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        height: 'fit-content',
                        maxHeight: '400px'
                      }}>
                        <img 
                          src={juegoInfo.portada_image_path} 
                          alt={juegoInfo.nombre_juego}
                          style={{ 
                            width: '100%', 
                            height: '100%',
                            display: 'block',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.parentElement.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Columna derecha: Información */}
                    <div>
                      {/* Título del juego destacado */}
                      <div style={{
                        backgroundColor: '#1e2a38',
                        padding: '1.25rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        borderLeft: '4px solid #66c0f4'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          color: '#ffffff',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {juegoInfo.nombre_juego}
                        </h4>
                      </div>

                      {/* Grid de información básica */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '1rem', 
                        marginBottom: '1.5rem' 
                      }}>
                        <div style={{
                          backgroundColor: '#1e2a38',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #2a475e'
                        }}>
                          <div style={{ 
                            color: '#66c0f4', 
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.5px'
                          }}>
                            App ID
                          </div>
                          <div style={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            color: '#ffffff',
                            wordBreak: 'break-all'
                          }}>
                            {juegoInfo.app_id}
                          </div>
                        </div>

                        <div style={{
                          backgroundColor: '#1e2a38',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #2a475e'
                        }}>
                          <div style={{ 
                            color: '#66c0f4', 
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.5px'
                          }}>
                            Precio Base
                          </div>
                          <div style={{ 
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#5cb85c'
                          }}>
                            ${juegoInfo.precio_base_usd ? Number(juegoInfo.precio_base_usd).toFixed(2) : '0.00'} USD
                          </div>
                        </div>

                        <div style={{
                          backgroundColor: '#1e2a38',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #2a475e'
                        }}>
                          <div style={{ 
                            color: '#66c0f4', 
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.5px'
                          }}>
                            Estado
                          </div>
                          <div style={{ 
                            fontSize: '0.95rem',
                            textTransform: 'capitalize',
                            fontWeight: '600',
                            color: juegoInfo.estado_revision === 'aprobado' ? '#5cb85c' : 
                                   juegoInfo.estado_revision === 'rechazado' ? '#d9534f' : '#f0ad4e'
                          }}>
                            {juegoInfo.estado_revision}
                          </div>
                        </div>

                        <div style={{
                          backgroundColor: '#1e2a38',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #2a475e'
                        }}>
                          <div style={{ 
                            color: '#66c0f4', 
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.5px'
                          }}>
                            Pago Registro
                          </div>
                          <div style={{ 
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: juegoInfo.pago_registro_completado ? '#5cb85c' : '#d9534f'
                          }}>
                            {juegoInfo.pago_registro_completado ? '✓ Completado' : '✗ Pendiente'}
                          </div>
                        </div>
                      </div>

                      {/* Descripción corta */}
                      {juegoInfo.descripcion_corta && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{ 
                            color: '#66c0f4', 
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.75rem',
                            letterSpacing: '0.5px'
                          }}>
                            📝 Descripción Corta
                          </div>
                          <div style={{ 
                            padding: '1rem',
                            backgroundColor: '#1e2a38',
                            borderRadius: '8px',
                            lineHeight: '1.6',
                            border: '1px solid #2a475e'
                          }}>
                            {juegoInfo.descripcion_corta}
                          </div>
                        </div>
                      )}

                      {/* Etiquetas */}
                      {juegoInfo.etiquetas && juegoInfo.etiquetas.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{ 
                            color: '#66c0f4', 
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            marginBottom: '0.75rem',
                            letterSpacing: '0.5px'
                          }}>
                            🏷️ Etiquetas
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {juegoInfo.etiquetas.map((etiqueta, index) => (
                              <span 
                                key={index}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#66c0f4',
                                  color: '#171a21',
                                  borderRadius: '20px',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  boxShadow: '0 2px 4px rgba(102, 192, 244, 0.3)'
                                }}
                              >
                                {etiqueta}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descripción larga (ancho completo) */}
                  {juegoInfo.descripcion_larga && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ 
                        color: '#66c0f4', 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        📋 Descripción Detallada
                      </div>
                      <div style={{ 
                        padding: '1rem',
                        backgroundColor: '#1e2a38',
                        borderRadius: '8px',
                        lineHeight: '1.6',
                        maxHeight: '200px',
                        overflow: 'auto',
                        border: '1px solid #2a475e'
                      }}>
                        {juegoInfo.descripcion_larga}
                      </div>
                    </div>
                  )}

                  {/* Información de pago detallada */}
                  {juegoInfo.pago_registro_completado && (
                    <div style={{ 
                      marginBottom: '1.5rem', 
                      padding: '1.25rem', 
                      backgroundColor: '#1e2a38', 
                      borderRadius: '8px',
                      border: '1px solid #2a475e'
                    }}>
                      <div style={{ 
                        color: '#66c0f4', 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        💳 Detalles del Pago de Registro
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {juegoInfo.monto_pago_registro && (
                          <div>
                            <div style={{ color: '#8f98a0', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                              Monto Pagado
                            </div>
                            <div style={{ color: '#5cb85c', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              ${Number(juegoInfo.monto_pago_registro).toFixed(2)}
                            </div>
                          </div>
                        )}
                        {juegoInfo.fecha_pago_registro && (
                          <div>
                            <div style={{ color: '#8f98a0', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                              Fecha de Pago
                            </div>
                            <div style={{ color: '#ffffff', fontWeight: '600' }}>
                              {formatDate(juegoInfo.fecha_pago_registro)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notas de revisión previas */}
                  {juegoInfo.notas_revision && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ 
                        color: '#66c0f4', 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        📌 Notas de Revisión Anteriores
                      </div>
                      <div style={{ 
                        padding: '1rem',
                        backgroundColor: '#1e2a38',
                        borderRadius: '8px',
                        lineHeight: '1.6',
                        border: '1px solid #2a475e',
                        fontStyle: 'italic'
                      }}>
                        {juegoInfo.notas_revision}
                      </div>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: '#1e2a38',
                    borderRadius: '8px',
                    border: '1px solid #2a475e'
                  }}>
                    <div>
                      <div style={{ color: '#8f98a0', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Desarrollador ID
                      </div>
                      <div style={{ fontFamily: 'monospace', color: '#ffffff', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                        {juegoInfo.desarrollador_id}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#8f98a0', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Categoría ID
                      </div>
                      <div style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                        {juegoInfo.categoria_id || 'No especificada'}
                      </div>
                    </div>
                    {juegoInfo.fecha_aprobacion && (
                      <div>
                        <div style={{ color: '#8f98a0', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          Fecha de Aprobación
                        </div>
                        <div style={{ color: '#5cb85c', fontSize: '0.9rem', fontWeight: '600' }}>
                          {formatDate(juegoInfo.fecha_aprobacion)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem', 
                  color: '#d9534f',
                  fontSize: '1.1rem'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
                  Error al cargar la información del juego
                </div>
              )}
            </div>
            
            {/* Footer del modal */}
            <div style={{ 
              padding: '1rem 2rem',
              backgroundColor: '#1b2838',
              borderTop: '1px solid #2a475e',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cerrarInfoModal}
                style={{
                  padding: '0.75rem 2.5rem',
                  backgroundColor: '#66c0f4',
                  color: '#171a21',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(102, 192, 244, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#5cb3e6';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 192, 244, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#66c0f4';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 192, 244, 0.4)';
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
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
