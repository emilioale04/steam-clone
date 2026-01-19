import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResetPasswordForm } from '../../auth/components';
import { developerAuthService } from '../services/developerAuthService';

const ACCESS_TOKEN_KEY = 'dev_reset_access_token';
const REFRESH_TOKEN_KEY = 'dev_reset_refresh_token';

export const ResetPasswordDesarrolladorPage = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      setLoading(false);
    } else if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
      setLoading(false);
    } else {
      setError(
        'Link invalido o expirado. Por favor solicita un nuevo link de recuperacion.',
      );
      setLoading(false);
    }
  }, []);

  const handleResetPassword = async (password) => {
    try {
      setError(null);
      const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        throw new Error(
          'Sesion expirada. Por favor solicita un nuevo link de recuperacion.',
        );
      }

      await developerAuthService.resetPassword(
        password,
        accessToken,
        refreshToken,
      );

      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);

      alert('Contrasena actualizada exitosamente.');
      navigate('/steamworks/login');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#1b2838',
        }}
      >
        <div style={{ color: 'white' }}>Verificando sesion...</div>
      </div>
    );
  }

  return (
    <div>
      <ResetPasswordForm onSubmit={handleResetPassword} error={error} />
    </div>
  );
};
