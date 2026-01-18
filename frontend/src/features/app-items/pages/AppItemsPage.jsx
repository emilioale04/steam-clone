import { useEffect, useState } from 'react';
import { developerAuthService } from '../../developer-auth/services/developerAuthService';
import { appItemsService } from '../services/appItemsService';

const initialForm = {
  nombre: '',
  is_tradeable: true,
  is_marketable: true,
  activo: true,
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
};

export const AppItemsPage = () => {
  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [editingItemId, setEditingItemId] = useState(null);

  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const cargarAplicaciones = async () => {
      try {
        setLoadingApps(true);
        const response = await developerAuthService.obtenerAplicaciones();

        if (!Array.isArray(response.data)) {
          throw new Error('Formato de respuesta invalido');
        }

        setApps(response.data);

        if (response.data.length > 0) {
          setSelectedAppId((prev) => prev || response.data[0].id);
        }
      } catch (error) {
        console.error('Error al cargar aplicaciones:', error);
        mostrarMensaje('Error al cargar aplicaciones', 'error');
        setApps([]);
      } finally {
        setLoadingApps(false);
      }
    };

    cargarAplicaciones();
  }, []);

  useEffect(() => {
    if (!selectedAppId) {
      setItems([]);
      return;
    }

    const cargarItems = async () => {
      try {
        setLoadingItems(true);
        const data = await appItemsService.listarItems(selectedAppId);
        setItems(data?.items || []);
      } catch (error) {
        console.error('Error al cargar items:', error);
        mostrarMensaje(error.message || 'Error al cargar items', 'error');
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    cargarItems();
  }, [selectedAppId]);

  const mostrarMensaje = (texto, tipo) => {
    setFeedback({ texto, tipo });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCrearItem = async () => {
    if (!selectedAppId) {
      mostrarMensaje('Selecciona una aplicacion primero', 'error');
      return;
    }

    const nombre = formData.nombre.trim();
    if (!nombre || nombre.length < 3) {
      mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
      return;
    }

    try {
      setSaving(true);
      const nuevoItem = await appItemsService.crearItem(selectedAppId, {
        nombre,
        is_tradeable: formData.is_tradeable,
        is_marketable: formData.is_marketable,
        activo: formData.activo,
      });

      setItems((prev) => [nuevoItem, ...prev]);
      setFormData((prev) => ({
        ...prev,
        nombre: '',
      }));
      mostrarMensaje('Item creado correctamente', 'success');
    } catch (error) {
      console.error('Error al crear item:', error);
      mostrarMensaje(error.message || 'Error al crear item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditForm({
      nombre: item.nombre || '',
      is_tradeable: Boolean(item.is_tradeable),
      is_marketable: Boolean(item.is_marketable),
      activo: Boolean(item.activo),
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditForm(initialForm);
  };

  const handleGuardarEdicion = async (itemId) => {
    const nombre = editForm.nombre.trim();
    if (!nombre || nombre.length < 3) {
      mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
      return;
    }

    try {
      setUpdatingItemId(itemId);
      const itemActualizado = await appItemsService.actualizarItem(itemId, {
        nombre,
        is_tradeable: editForm.is_tradeable,
        is_marketable: editForm.is_marketable,
        activo: editForm.activo,
      });

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? itemActualizado : item)),
      );
      setEditingItemId(null);
      mostrarMensaje('Item actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error al actualizar item:', error);
      mostrarMensaje(error.message || 'Error al actualizar item', 'error');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const selectedApp = apps.find((app) => app.id === selectedAppId);

  return (
    <div className="space-y-6">
      <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Objetos Marketplace</h2>
            <p className="text-sm text-gray-400">
              Crea y administra los items que aparecen en el marketplace.
            </p>
          </div>
          <div className="min-w-[260px]">
            <label className="block text-xs text-gray-400 mb-2">
              Aplicacion
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              disabled={loadingApps}
              className="w-full bg-[#0f1923] text-white px-3 py-2 rounded border border-[#2a3f5f] focus:outline-none focus:border-[#66c0f4]"
            >
              <option value="">
                {loadingApps ? 'Cargando aplicaciones...' : 'Selecciona...'}
              </option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.nombre_juego}
                </option>
              ))}
            </select>
            {selectedApp && (
              <p className="text-xs text-gray-500 mt-2">
                Estado: {selectedApp.estado_revision || 'pendiente'}
              </p>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`border rounded-lg p-4 ${
            feedback.tipo === 'success'
              ? 'bg-green-900/20 border-green-500/40 text-green-300'
              : feedback.tipo === 'error'
                ? 'bg-red-900/20 border-red-500/40 text-red-300'
                : 'bg-yellow-900/20 border-yellow-500/40 text-yellow-300'
          }`}
        >
          {feedback.texto}
        </div>
      )}

      {apps.length === 0 && !loadingApps ? (
        <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6 text-center text-gray-400">
          No tienes aplicaciones registradas. Crea una aplicacion primero.
        </div>
      ) : (
        <>
          <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Crear nuevo item
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Nombre del item
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  placeholder="Ej: Skin Dorada"
                  className="w-full bg-[#0f1923] text-white px-3 py-2 rounded border border-[#2a3f5f] focus:outline-none focus:border-[#66c0f4]"
                  maxLength={120}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCrearItem}
                  disabled={saving || loadingApps || !selectedAppId}
                  className="w-full px-4 py-2 bg-[#66c0f4] text-white rounded hover:bg-[#5bb1e3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creando...' : 'Crear item'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm text-gray-300">
              <label className="flex items-center gap-2 bg-[#0f1923] border border-[#2a3f5f] rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.is_tradeable}
                  onChange={(e) =>
                    handleFormChange('is_tradeable', e.target.checked)
                  }
                  className="accent-[#66c0f4]"
                />
                Intercambiable
              </label>
              <label className="flex items-center gap-2 bg-[#0f1923] border border-[#2a3f5f] rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.is_marketable}
                  onChange={(e) =>
                    handleFormChange('is_marketable', e.target.checked)
                  }
                  className="accent-[#66c0f4]"
                />
                Vendible
              </label>
              <label className="flex items-center gap-2 bg-[#0f1923] border border-[#2a3f5f] rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => handleFormChange('activo', e.target.checked)}
                  className="accent-[#66c0f4]"
                />
                Activo
              </label>
            </div>
          </div>

          <div className="bg-[#1e2a38] border border-[#2a3f5f] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Items de la aplicacion
              </h3>
              <span className="text-sm text-gray-400">
                {loadingItems ? 'Cargando...' : `${items.length} items`}
              </span>
            </div>

            {loadingItems ? (
              <div className="text-center text-gray-400 py-8">
                Cargando items...
              </div>
            ) : items.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No hay items creados para esta aplicacion.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const isEditing = editingItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="border border-[#2a3f5f] rounded-lg p-4 bg-[#18222f]"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.nombre}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  nombre: e.target.value,
                                }))
                              }
                              className="w-full bg-[#0f1923] text-white px-3 py-2 rounded border border-[#2a3f5f] focus:outline-none focus:border-[#66c0f4]"
                              maxLength={120}
                            />
                          ) : (
                            <h4 className="text-white font-semibold">
                              {item.nombre}
                            </h4>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Actualizado: {formatDate(item.updated_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleGuardarEdicion(item.id)}
                                disabled={updatingItemId === item.id}
                                className="px-3 py-1 bg-green-600/80 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-60"
                              >
                                {updatingItemId === item.id
                                  ? 'Guardando...'
                                  : 'Guardar'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-600/80 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="px-3 py-1 bg-[#2a3f5f] text-white rounded hover:bg-[#3d5a80] transition-colors"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
                        <div className="bg-[#0f1923] border border-[#2a3f5f] rounded p-3">
                          <div className="text-xs text-gray-500 mb-2">
                            Intercambiable
                          </div>
                          {isEditing ? (
                            <label className="flex items-center gap-2 text-gray-200">
                              <input
                                type="checkbox"
                                checked={editForm.is_tradeable}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    is_tradeable: e.target.checked,
                                  }))
                                }
                                className="accent-[#66c0f4]"
                              />
                              {editForm.is_tradeable ? 'Si' : 'No'}
                            </label>
                          ) : (
                            <div className="text-gray-200">
                              {item.is_tradeable ? 'Si' : 'No'}
                            </div>
                          )}
                        </div>

                        <div className="bg-[#0f1923] border border-[#2a3f5f] rounded p-3">
                          <div className="text-xs text-gray-500 mb-2">
                            Vendible
                          </div>
                          {isEditing ? (
                            <label className="flex items-center gap-2 text-gray-200">
                              <input
                                type="checkbox"
                                checked={editForm.is_marketable}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    is_marketable: e.target.checked,
                                  }))
                                }
                                className="accent-[#66c0f4]"
                              />
                              {editForm.is_marketable ? 'Si' : 'No'}
                            </label>
                          ) : (
                            <div className="text-gray-200">
                              {item.is_marketable ? 'Si' : 'No'}
                            </div>
                          )}
                        </div>

                        <div className="bg-[#0f1923] border border-[#2a3f5f] rounded p-3">
                          <div className="text-xs text-gray-500 mb-2">
                            Activo
                          </div>
                          {isEditing ? (
                            <label className="flex items-center gap-2 text-gray-200">
                              <input
                                type="checkbox"
                                checked={editForm.activo}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    activo: e.target.checked,
                                  }))
                                }
                                className="accent-[#66c0f4]"
                              />
                              {editForm.activo ? 'Si' : 'No'}
                            </label>
                          ) : (
                            <div className="text-gray-200">
                              {item.activo ? 'Si' : 'No'}
                            </div>
                          )}
                        </div>

                        <div className="bg-[#0f1923] border border-[#2a3f5f] rounded p-3">
                          <div className="text-xs text-gray-500 mb-2">
                            Creado
                          </div>
                          <div className="text-gray-200">
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
