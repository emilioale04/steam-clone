import { useEffect, useState, useCallback } from 'react';
import { fetchMyApps, updateAppPrice } from '../services/pricingService';

export function usePricesFeature() {
  const [apps, setApps] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar aplicaciones del desarrollador al montar
  const loadApps = useCallback(async () => {
    try {
      setLoadingApps(true);
      setError(null);
      const appsData = await fetchMyApps();
      setApps(appsData);
    } catch (err) {
      setError(err.message || 'Error al cargar aplicaciones');
      setApps([]);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Actualizar juego seleccionado cuando cambia la selección
  useEffect(() => {
    const game = apps.find(app => app.id === selectedGameId);
    setSelectedGame(game || null);
    setPrice(game ? game.precio_base_usd : '');
  }, [selectedGameId, apps]);

  // Limpiar mensajes SOLO cuando cambia el juego seleccionado (no cuando cambian apps)
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [selectedGameId]);

  const handleUpdatePrice = async (mfaCode) => {
    if (!selectedGameId || !price) {
      const errorMsg = 'Selecciona un juego y un precio válido';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Validar que el precio sea diferente al actual
    const priceValue = Number(price);
    if (selectedGame && Number(selectedGame.precio_base_usd) === priceValue) {
      const errorMsg = 'El nuevo precio debe ser diferente al precio actual';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateAppPrice(selectedGameId, price, mfaCode);
      setSuccess(`✅ ¡Precio actualizado exitosamente a $${Number(price).toFixed(2)} USD!`);
      
      // Actualizar el precio en la lista local después de 3 segundos
      setTimeout(() => {
        setApps(prevApps => 
          prevApps.map(app => 
            app.id === selectedGameId 
              ? { ...app, precio_base_usd: Number(price), updated_at: new Date().toISOString(), can_update_price: false }
              : app
          )
        );
        setSuccess(null); // Limpiar mensaje después de actualizar
      }, 3000);
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar el precio';
      setError(errorMsg);
      throw new Error(errorMsg); // Propagar error para que el modal lo muestre
    } finally {
      setLoading(false);
    }
  };

  return {
    apps,
    selectedGameId,
    setSelectedGameId,
    selectedGame,
    price,
    setPrice,
    loading,
    loadingApps,
    error,
    success,
    handleUpdatePrice,
    refreshApps: loadApps
  };
}
