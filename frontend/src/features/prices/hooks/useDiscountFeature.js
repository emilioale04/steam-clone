import { useEffect, useState, useCallback } from 'react';
import { fetchMyApps, updateAppDiscount } from '../services/pricingService';

export function useDiscountFeature() {
  const [apps, setApps] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [discount, setDiscount] = useState('');
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
    setDiscount(game ? (game.descuento || 0) : '');
  }, [selectedGameId, apps]);

  // Limpiar mensajes SOLO cuando cambia el juego seleccionado (no cuando cambian apps)
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [selectedGameId]);

  const handleUpdateDiscount = async (mfaCode) => {
    if (!selectedGameId) {
      const errorMsg = 'Selecciona un juego';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    const discountValue = Number(discount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 1) {
      const errorMsg = 'El descuento debe estar entre 0 y 1 (ej: 0.25 = 25%)';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Validar que el descuento sea diferente al actual
    const currentDiscount = selectedGame ? Number(selectedGame.descuento || 0) : 0;
    if (currentDiscount === discountValue) {
      const errorMsg = 'El nuevo descuento debe ser diferente al descuento actual';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateAppDiscount(selectedGameId, discountValue, mfaCode);
      setSuccess(`✅ ¡Descuento actualizado exitosamente a ${(discountValue * 100).toFixed(0)}%!`);
      
      // Actualizar el descuento en la lista local después de 3 segundos
      setTimeout(() => {
        setApps(prevApps => 
          prevApps.map(app => 
            app.id === selectedGameId 
              ? { ...app, descuento: discountValue }
              : app
          )
        );
        setSuccess(null); // Limpiar mensaje después de actualizar
      }, 3000);
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar el descuento';
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
    discount,
    setDiscount,
    loading,
    loadingApps,
    error,
    success,
    handleUpdateDiscount,
    refreshApps: loadApps
  };
}
