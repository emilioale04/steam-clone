import { useState, useEffect } from 'react';
import {
  getCategorias,
  crearCategoria,
  updateCategoria,
  deleteCategoria
} from '../services/adminAuthService';

const GestionCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre_categoria: '',
    descripcion: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const data = await getCategorias();
      setCategorias(data);
    } catch (err) {
      setError(err.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategoria(editingId, formData);
      } else {
        await crearCategoria(formData);
      }
      setShowForm(false);
      setFormData({ nombre_categoria: '', descripcion: '' });
      setEditingId(null);
      await loadCategorias();
    } catch (err) {
      alert(err.message || 'Error al guardar categoría');
    }
  };

  const handleEdit = (categoria) => {
    setFormData({
      nombre_categoria: categoria.nombre_categoria,
      descripcion: categoria.descripcion || ''
    });
    setEditingId(categoria.id);
    setShowForm(true);
  };

  const handleToggleActive = async (categoria) => {
    try {
      await updateCategoria(categoria.id, { activa: !categoria.activa });
      await loadCategorias();
    } catch (err) {
      alert(err.message || 'Error al actualizar categoría');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta categoría? Los juegos asociados no se eliminarán.')) {
      try {
        await deleteCategoria(id);
        await loadCategorias();
      } catch (err) {
        alert(err.message || 'Error al eliminar categoría');
      }
    }
  };

  if (loading) {
    return <div style={{ color: '#c7d5e0' }}>Cargando categorías...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#66c0f4', margin: 0 }}>
          Gestión de Categorías
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ nombre_categoria: '', descripcion: '' });
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
          {showForm ? 'Cancelar' : 'Nueva Categoría'}
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
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              value={formData.nombre_categoria}
              onChange={(e) => setFormData({ ...formData, nombre_categoria: e.target.value })}
              required
              placeholder="Ej: Acción, Aventura, RPG..."
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
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              placeholder="Describe esta categoría..."
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
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Nombre</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#c7d5e0' }}>Descripción</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#c7d5e0' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#8f98a0' }}>
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id} style={{ borderBottom: '1px solid #2a475e' }}>
                  <td style={{ padding: '0.75rem', color: '#c7d5e0', fontWeight: 'bold' }}>
                    {categoria.nombre_categoria}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#8f98a0', fontSize: '0.875rem', maxWidth: '300px' }}>
                    {categoria.descripcion || 'Sin descripción'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(categoria)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: categoria.activa ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {categoria.activa ? 'ACTIVA' : 'INACTIVA'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(categoria)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#ffc107',
                        color: '#1b2838',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '0.5rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(categoria.id)}
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
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {categorias.length > 0 && (
        <div style={{ marginTop: '1rem', color: '#8f98a0', fontSize: '0.875rem' }}>
          Total de categorías: {categorias.length} ({categorias.filter(c => c.activa).length} activas)
        </div>
      )}
    </div>
  );
};

export default GestionCategorias;
