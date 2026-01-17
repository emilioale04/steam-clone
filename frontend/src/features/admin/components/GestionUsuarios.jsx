import { useState, useEffect } from 'react';
import {
  getSanciones,
  crearSancion,
  desactivarSancion,
  getReportesBan,
  aprobarReporteBan,
  rechazarReporteBan,
  verifyMFACode
} from '../services/adminAuthService';
import MFAModal from './MFAModal';

const GestionUsuarios = () => {
  const [sanciones, setSanciones] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReportes, setLoadingReportes] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filtroActiva, setFiltroActiva] = useState('true');
  const [filtroReportes, setFiltroReportes] = useState('pendiente');
  const [formData, setFormData] = useState({
    username: '',
    motivo: '',
    fecha_fin: ''
  });
  
  // Estados para MFA Modal
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [mfaOperationType, setMfaOperationType] = useState('');

  useEffect(() => {
    loadSanciones();
    loadReportes();
  }, [filtroActiva, filtroReportes]);

  const loadSanciones = async () => {
    try {
      setLoading(true);
      const data = await getSanciones(filtroActiva || undefined);
      setSanciones(data);
    } catch (err) {
      setError(err.message || 'Error al cargar sanciones');
    } finally {
      setLoading(false);
    }
  };

  const loadReportes = async () => {
    try {
      setLoadingReportes(true);
      const data = await getReportesBan(filtroReportes || undefined);
      setReportes(data);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    } finally {
      setLoadingReportes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mostrar modal MFA antes de ejecutar la acción
    setMfaOperationType('aplicación de ban');
    setPendingAction({
      type: 'crearBan',
      data: { ...formData }
    });
    setShowMFAModal(true);
  };

  const executeCrearBan = async () => {
    try {
      await crearSancion(pendingAction.data);
      setShowForm(false);
      setFormData({
        username: '',
        motivo: '',
        fecha_fin: ''
      });
      await loadSanciones();
      alert('Ban aplicado exitosamente');
    } catch (err) {
      alert(err.message || 'Error al crear sanción');
    }
  };

  const handleDesactivar = async (id) => {
    if (window.confirm('¿Desactivar esta sanción?')) {
      try {
        await desactivarSancion(id);
        await loadSanciones();
      } catch (err) {
        alert(err.message || 'Error al desactivar sanción');
      }
    }
  };

  const handleAprobarReporte = async (id) => {
    const duracion = prompt('¿Duración del ban en minutos? (por defecto 1)', '1');
    if (duracion === null) return;
    
    const comentarios = prompt('Comentarios (opcional):', '');
    
    // Mostrar modal MFA antes de aprobar
    setMfaOperationType('aprobación de reporte de ban');
    setPendingAction({
      type: 'aprobarReporte',
      id,
      comentarios,
      duracion: parseInt(duracion) || 1
    });
    setShowMFAModal(true);
  };

  const executeAprobarReporte = async () => {
    try {
      await aprobarReporteBan(
        pendingAction.id, 
        pendingAction.comentarios, 
        pendingAction.duracion
      );
      await loadReportes();
      await loadSanciones();
      alert('Reporte aprobado exitosamente');
    } catch (err) {
      alert(err.message || 'Error al aprobar reporte');
    }
  };

  const handleRechazarReporte = async (id) => {
    const comentarios = prompt('Motivo del rechazo:', '');
    if (comentarios === null) return;
    
    // Mostrar modal MFA antes de rechazar
    setMfaOperationType('rechazo de reporte de ban');
    setPendingAction({
      type: 'rechazarReporte',
      id,
      comentarios
    });
    setShowMFAModal(true);
  };

  const executeRechazarReporte = async () => {
    try {
      await rechazarReporteBan(pendingAction.id, pendingAction.comentarios);
      await loadReportes();
      alert('Reporte rechazado exitosamente');
    } catch (err) {
      alert(err.message || 'Error al rechazar reporte');
    }
  };

  const handleMFAVerify = async (code) => {
    // Verificar el código MFA
    await verifyMFACode(code);
    
    // Si la verificación es exitosa, ejecutar la acción pendiente
    if (pendingAction.type === 'crearBan') {
      await executeCrearBan();
    } else if (pendingAction.type === 'aprobarReporte') {
      await executeAprobarReporte();
    } else if (pendingAction.type === 'rechazarReporte') {
      await executeRechazarReporte();
    }
    
    // Limpiar estado
    setPendingAction(null);
    setMfaOperationType('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  };

  const getTipoColor = () => {
    return '#ff6b6b';
  };

  const getTipoLabel = () => {
    return 'Ban Temporal';
  };

  if (loading) {
    return <div style={{ color: '#c7d5e0' }}>Cargando sanciones...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#66c0f4', margin: 0 }}>
          Gestión de Usuarios - Ban Temporal
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={filtroActiva}
            onChange={(e) => setFiltroActiva(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2a475e',
              color: '#c7d5e0',
              border: '1px solid #3d5a80',
              borderRadius: '4px'
            }}
          >
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showForm ? 'Cancelar' : 'Aplicar Ban'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: '#dc3545', padding: '1rem', backgroundColor: '#dc354520', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#16202d',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#c7d5e0', marginBottom: '0.5rem' }}>
              Username del Usuario *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="username del jugador"
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#2a475e',
                color: '#c7d5e0',
                border: '1px solid #3d5a80',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#c7d5e0', marginBottom: '0.5rem' }}>
              Motivo *
            </label>
            <textarea
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              required
              rows="3"
              placeholder="Describe el motivo de la sanción..."
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#c7d5e0', marginBottom: '0.5rem' }}>
              Fecha de Fin (opcional - por defecto 1 minuto)
            </label>
            <input
              type="datetime-local"
              value={formData.fecha_fin}
              onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#2a475e',
                color: '#c7d5e0',
                border: '1px solid #3d5a80',
                borderRadius: '4px'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#66c0f4',
              color: '#1b2838',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Aplicar Ban Temporal
          </button>
        </form>
      )}

      <div style={{ backgroundColor: '#16202d', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e2a38', borderBottom: '2px solid #2a475e' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Username</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Tipo</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Motivo</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Inicio</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Fin</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sanciones.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#8f98a0' }}>
                  No hay sanciones con el filtro seleccionado
                </td>
              </tr>
            ) : (
              sanciones.map((sancion) => (
                <tr key={sancion.id} style={{ borderBottom: '1px solid #2a475e' }}>
                  <td style={{ padding: '0.75rem', color: '#c7d5e0', fontSize: '0.875rem' }}>
                    {sancion.username || 'Usuario desconocido'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      color: getTipoColor(sancion.tipo_sancion),
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}>
                      {getTipoLabel(sancion.tipo_sancion)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem', maxWidth: '250px' }}>
                    {sancion.motivo}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.75rem' }}>
                    {formatDate(sancion.fecha_inicio)}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.75rem' }}>
                    {formatDate(sancion.fecha_fin)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      color: sancion.activa ? '#28a745' : '#6c757d',
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}>
                      {sancion.activa ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {sancion.activa && (
                      <button
                        onClick={() => handleDesactivar(sancion.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#ffc107',
                          color: '#1b2838',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Desactivar
                      </button>
                    )}
                    {!sancion.activa && (
                      <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                        Completada
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Nueva sección: Reportes de Ban */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#66c0f4', margin: 0 }}>
            Reportes de Ban
          </h2>
          <select
            value={filtroReportes}
            onChange={(e) => setFiltroReportes(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2a475e',
              color: '#c7d5e0',
              border: '1px solid #3d5a80',
              borderRadius: '4px'
            }}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="resuelto">Resueltos</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>

        {loadingReportes ? (
          <div style={{ color: '#c7d5e0' }}>Cargando reportes...</div>
        ) : (
          <div style={{ backgroundColor: '#16202d', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e2a38', borderBottom: '2px solid #2a475e' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Reportante</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Usuario Reportado</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Motivo</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Fecha</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Estado</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportes.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#8f98a0' }}>
                      No hay reportes con el filtro seleccionado
                    </td>
                  </tr>
                ) : (
                  reportes.map((reporte) => (
                    <tr key={reporte.id} style={{ borderBottom: '1px solid #2a475e' }}>
                      <td style={{ padding: '0.75rem', color: '#c7d5e0', fontSize: '0.875rem' }}>
                        {reporte.username_reportante}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#c7d5e0', fontSize: '0.875rem' }}>
                        {reporte.username_reportado}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem', maxWidth: '300px' }}>
                        {reporte.motivo}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.75rem' }}>
                        {formatDate(reporte.created_at)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          color: reporte.estado === 'pendiente' ? '#ffc107' : 
                                reporte.estado === 'resuelto' ? '#28a745' : 
                                reporte.estado === 'rechazado' ? '#dc3545' : '#17a2b8',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase'
                        }}>
                          {reporte.estado}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {reporte.estado === 'pendiente' && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleAprobarReporte(reporte.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
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
                              onClick={() => handleRechazarReporte(reporte.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
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
                        {reporte.estado !== 'pendiente' && (
                          <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                            {reporte.estado === 'resuelto' ? 'Completado' : 'Procesado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de verificación MFA */}
      <MFAModal
        isOpen={showMFAModal}
        onClose={() => {
          setShowMFAModal(false);
          setPendingAction(null);
          setMfaOperationType('');
        }}
        onVerify={handleMFAVerify}
        operationType={mfaOperationType}
      />
    </div>
  );
};

export default GestionUsuarios;
