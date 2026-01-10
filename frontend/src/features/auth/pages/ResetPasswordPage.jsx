import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResetPasswordForm } from '../components';
import { authService } from '../services/authService';

export const ResetPasswordPage = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Capturar los tokens del hash URL que Supabase envía
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Guardar tokens para usarlos en el reset
      sessionStorage.setItem('reset_access_token', accessToken);
      sessionStorage.setItem('reset_refresh_token', refreshToken);
      setLoading(false);
    } else if (sessionStorage.getItem('reset_access_token')) {
      // Ya tenemos los tokens guardados
      setLoading(false);
    } else {
      setError('Link inválido o expirado. Por favor solicita un nuevo link de recuperación.');
      setLoading(false);
    }
  }, []);

  const handleResetPassword = async (password) => {
    try {
      setError(null);
      const accessToken = sessionStorage.getItem('reset_access_token');
      const refreshToken = sessionStorage.getItem('reset_refresh_token');
      
      if (!accessToken || !refreshToken) {
        throw new Error('Sesión expirada. Por favor solicita un nuevo link.');
      }

      await authService.resetPassword(password, accessToken, refreshToken);
      
      // Limpiar tokens
      sessionStorage.removeItem('reset_access_token');
      sessionStorage.removeItem('reset_refresh_token');
      
      alert('¡Contraseña actualizada exitosamente!');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#1b2838'
      }}>
        <div style={{ color: 'white' }}>Verificando sesión...</div>
      </div>
    );
  }

  return (
    <div>
      <ResetPasswordForm 
        onSubmit={handleResetPassword} 
        error={error}
      />
    </div>
  );
};
