import { useState, useEffect } from 'react';
import { getAuditLogs, getLogsAdmin, getLogsDesarrolladores, getLogsComunidad } from '../services/adminAuthService';

const ResumenPanel = () => {
  const [activeTab, setActiveTab] = useState('sistema');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, [activeTab]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      let data;
      switch(activeTab) {
        case 'sistema':
          data = await getAuditLogs(20, 0);
          break;
        case 'admin':
          data = await getLogsAdmin(20, 0);
          break;
        case 'desarrolladores':
          data = await getLogsDesarrolladores(20, 0);
          break;
        case 'comunidad':
          data = await getLogsComunidad(20, 0);
          break;
        default:
          data = [];
      }
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('es-ES');
  };

  const getLogDate = (log) => {
    // logs_comunidad usa timestamp, los demás created_at, logs_desarrolladores no tiene fecha
    if (activeTab === 'comunidad') return log.timestamp;
    if (activeTab === 'desarrolladores') return null; // No tiene fecha
    return log.created_at;
  };

  const getLogAction = (log) => {
    // audit_logs y audit_logs_admin usan 'action', los demás 'accion'
    return log.action || log.accion || 'N/A';
  };

  const getLogUserId = (log) => {
    // logs_auditoria_desarrolladores usa 'desarrollador_id', los demás 'user_id' o 'admin_id'
    if (activeTab === 'desarrolladores') {
      return log.desarrollador_id || 'Sistema';
    }
    if (activeTab === 'admin') {
      return log.admin_id || 'Sistema';
    }
    return log.user_id || 'Sistema';
  };

  const getLogResultado = (log) => {
    // Algunas tablas tienen campo 'resultado'
    return log.resultado || 'Registrado';
  };

  if (loading) {
    return (
      <div style={{ color: '#c7d5e0', textAlign: 'center', padding: '2rem' }}>
        Cargando logs de auditoría...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#dc3545', padding: '1rem', backgroundColor: '#dc354520', borderRadius: '4px' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#66c0f4', margin: 0 }}>
          Acciones Recientes del Sistema
        </h2>
        <button
          onClick={loadLogs}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#66c0f4',
            color: '#1b2838',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Refrescar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #2a475e' }}>
        <button
          onClick={() => setActiveTab('sistema')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'sistema' ? '#66c0f4' : '#8f98a0',
            border: 'none',
            borderBottom: activeTab === 'sistema' ? '2px solid #66c0f4' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Logs Sistema
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'admin' ? '#66c0f4' : '#8f98a0',
            border: 'none',
            borderBottom: activeTab === 'admin' ? '2px solid #66c0f4' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Logs Admin
        </button>
        <button
          onClick={() => setActiveTab('desarrolladores')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'desarrolladores' ? '#66c0f4' : '#8f98a0',
            border: 'none',
            borderBottom: activeTab === 'desarrolladores' ? '2px solid #66c0f4' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Logs Desarrolladores
        </button>
        <button
          onClick={() => setActiveTab('comunidad')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'comunidad' ? '#66c0f4' : '#8f98a0',
            border: 'none',
            borderBottom: activeTab === 'comunidad' ? '2px solid #66c0f4' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Logs Comunidad
        </button>
      </div>

      <div style={{ backgroundColor: '#16202d', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e2a38', borderBottom: '2px solid #2a475e' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0', fontSize: '0.875rem' }}>
                Fecha
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0', fontSize: '0.875rem' }}>
                Acción
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0', fontSize: '0.875rem' }}>
                Usuario
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0', fontSize: '0.875rem' }}>
                Estado
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0', fontSize: '0.875rem' }}>
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#8f98a0' }}>
                  No hay logs recientes
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const userId = getLogUserId(log);
                const displayUserId = userId === 'Sistema' ? 'Sistema' : (userId.substring(0, 8) + '...');
                
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #2a475e' }}>
                    <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem' }}>
                      {formatDate(getLogDate(log))}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#c7d5e0', fontSize: '0.875rem' }}>
                      {getLogAction(log)}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem' }}>
                      {displayUserId}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      <span style={{
                        color: getLogResultado(log) === 'exito' || getLogResultado(log) === 'exitoso' ? '#28a745' : '#ffc107',
                        fontWeight: 'bold'
                      }}>
                        {getLogResultado(log)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResumenPanel;
