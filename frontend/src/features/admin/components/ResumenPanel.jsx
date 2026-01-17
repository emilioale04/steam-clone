import { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/adminAuthService';

const ResumenPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs(20, 0);
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
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
      <h2 style={{ color: '#66c0f4', marginBottom: '1.5rem' }}>
        Acciones Recientes del Sistema
      </h2>

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
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #2a475e' }}>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem' }}>
                    {formatDate(log.created_at)}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#c7d5e0', fontSize: '0.875rem' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem' }}>
                    {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Sistema'}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}>
                      Registrado
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {log.ip_address || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button
          onClick={loadAuditLogs}
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
    </div>
  );
};

export default ResumenPanel;
