import { useState, useCallback } from 'react';
import { gameKeysService } from '../services/gameKeysService';

export const useGameKeys = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [llaves, setLlaves] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState(null);

  const generarLlave = useCallback(async (juegoId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await gameKeysService.generarLlave(juegoId);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const listarLlaves = useCallback(async (juegoId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await gameKeysService.listarLlaves(juegoId);
      setLlaves(response.data.llaves);
      setEstadisticas(response.data.estadisticas);
      setJuegoSeleccionado(response.data.juego);
      return response.data;
    } catch (err) {
      setError(err.message);
      setLlaves([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const desactivarLlave = useCallback(async (llaveId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await gameKeysService.desactivarLlave(llaveId);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const obtenerEstadisticas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await gameKeysService.obtenerEstadisticas();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    llaves,
    estadisticas,
    juegoSeleccionado,
    generarLlave,
    listarLlaves,
    desactivarLlave,
    obtenerEstadisticas,
    setError
  };
};
