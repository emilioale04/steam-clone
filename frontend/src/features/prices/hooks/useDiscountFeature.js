import { useEffect, useState } from 'react';
import { MOCK_APPS } from '../services/pricingService';

export function useDiscountFeature() {
  const [apps, setApps] = useState(MOCK_APPS);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);


  useEffect(() => {
    const game = apps.find(app => app.id === selectedGameId);
    setSelectedGame(game || null);
    setDiscount(game ? game.discount : '');
  }, [selectedGameId, apps]);

  const handleUpdateDiscount = async (mfaCode) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setTimeout(() => {
      setSuccess('Descuento actualizado correctamente (mock)');
      setLoading(false);
    }, 1000);
  };

  return {
    apps,
    selectedGameId,
    setSelectedGameId,
    selectedGame,
    discount,
    setDiscount,
    loading,
    error,
    success,
    handleUpdateDiscount
  };
}
