import { useState, useEffect } from 'react';
import {
  getBloqueoPaises,
  createBloqueoPais,
  updateBloqueoPais,
  deleteBloqueoPais,
  verifyMFACode
} from '../services/adminAuthService';
import { getCountries } from '@yusifaliyevpro/countries';
import MFAModal from './MFAModal';

const BloqueoPais = () => {
  const [bloqueos, setBloqueos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    codigo_pais: '',
    estado: 'bloqueado',
    motivo_politico: ''
  });
  const [editingId, setEditingId] = useState(null);
  
  // Estados para MFA Modal
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [mfaOperationType, setMfaOperationType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bloqueosData, paisesData] = await Promise.all([
        getBloqueoPaises(),
        fetchPaises()
      ]);
      setBloqueos(bloqueosData);
      setPaises(paisesData);
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaises = async () => {
    try {
      const countries = await getCountries({
        fields: ['name', 'cca2', 'flag']
      });
      
      return countries.map(country => ({
        code: country.cca2,
        name: country.name.common,
        flag: country.flag
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error al cargar países:', error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mostrar modal MFA antes de ejecutar la acción
    const operationType = editingId ? 'actualización de bloqueo' : 'creación de bloqueo';
    setMfaOperationType(operationType);
    setPendingAction({
      type: 'submit',
      data: { ...formData },
      editingId
    });
    setShowMFAModal(true);
  };

  const executeSubmit = async () => {
    try {
      if (pendingAction.editingId) {
        await updateBloqueoPais(pendingAction.editingId, pendingAction.data);
      } else {
        await createBloqueoPais(pendingAction.data);
      }
      setShowForm(false);
      setFormData({ codigo_pais: '', estado: 'bloqueado', motivo_politico: '' });
      setEditingId(null);
      await loadData();
      alert('Operación realizada exitosamente');
    } catch (err) {
      alert(err.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    // Mostrar modal MFA antes de desbloquear
    setMfaOperationType('desbloqueo de país');
    setPendingAction({
      type: 'delete',
      id
    });
    setShowMFAModal(true);
  };

  const executeDelete = async () => {
    try {
      await deleteBloqueoPais(pendingAction.id);
      await loadData();
      alert('País desbloqueado exitosamente');
    } catch (err) {
      alert(err.message || 'Error al desbloquear');
    }
  };

  const handleMFAVerify = async (code) => {
    // Verificar el código MFA
    await verifyMFACode(code);
    
    // Si la verificación es exitosa, ejecutar la acción pendiente
    if (pendingAction.type === 'submit') {
      await executeSubmit();
    } else if (pendingAction.type === 'delete') {
      await executeDelete();
    }
    
    // Limpiar estado
    setPendingAction(null);
    setMfaOperationType('');
  };

  const getPaisName = (codigo) => {
    const pais = paises.find(p => p.code === codigo);
    return pais ? `${pais.flag} ${pais.code} - ${pais.name}` : codigo;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'bloqueado': return '#dc3545';
      case 'permitido': return '#28a745';
      default: return '#8f98a0';
    }
  };

  if (loading) {
    return <div style={{ color: '#c7d5e0' }}>Cargando...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#66c0f4', margin: 0 }}>
          Bloqueo por País
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ codigo_pais: '', estado: 'bloqueado', motivo_politico: '' });
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancelar' : 'Nuevo Bloqueo'}
        </button>
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
              País
            </label>
            <select
              value={formData.codigo_pais}
              onChange={(e) => setFormData({ ...formData, codigo_pais: e.target.value })}
              required
              disabled={editingId !== null}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#2a475e',
                color: '#c7d5e0',
                border: '1px solid #3d5a80',
                borderRadius: '4px'
              }}
            >
              <option value="">Seleccionar país</option>
              {paises.map(pais => (
                <option key={pais.code} value={pais.code}>
                  {pais.flag} {pais.code} - {pais.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#c7d5e0', marginBottom: '0.5rem' }}>
              Estado
            </label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#2a475e',
                color: '#c7d5e0',
                border: '1px solid #3d5a80',
                borderRadius: '4px'
              }}
            >
              <option value="bloqueado">Bloqueado</option>
              <option value="permitido">Permitido</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#c7d5e0', marginBottom: '0.5rem' }}>
              Motivo Político
            </label>
            <textarea
              value={formData.motivo_politico}
              onChange={(e) => setFormData({ ...formData, motivo_politico: e.target.value })}
              rows="3"
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
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      <div style={{ backgroundColor: '#16202d', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e2a38', borderBottom: '2px solid #2a475e' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>País</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Motivo</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bloqueos.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#8f98a0' }}>
                  No hay bloqueos registrados
                </td>
              </tr>
            ) : (
              bloqueos.map((bloqueo) => (
                <tr key={bloqueo.id} style={{ borderBottom: '1px solid #2a475e' }}>
                  <td style={{ padding: '0.75rem', color: '#c7d5e0' }}>
                    {getPaisName(bloqueo.codigo_pais)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      color: getEstadoColor(bloqueo.estado),
                      fontWeight: 'bold'
                    }}>
                      {bloqueo.estado}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem' }}>
                    {bloqueo.motivo_politico || 'Sin motivo especificado'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(bloqueo.id)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Desbloquear
                    </button>
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
        }}
        onVerify={handleMFAVerify}
        operationType={mfaOperationType}
      />
    </div>
  );
};

export default BloqueoPais;
