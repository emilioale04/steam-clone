import { useState } from 'react';
import { ForgotPasswordForm } from '../../auth/components';
import { developerAuthService } from '../services/developerAuthService';

export const ForgotPasswordDesarrolladorPage = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleForgotPassword = async (email) => {
    try {
      setError(null);
      setSuccess(null);
      await developerAuthService.forgotPassword(email);
      setSuccess(
        'Si el email existe, recibiras instrucciones para restablecer tu contrasena.',
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <ForgotPasswordForm
        onSubmit={handleForgotPassword}
        error={error}
        success={success}
      />
      <p style={{ textAlign: 'center' }}>
        Ya recordaste tu contrasena? <a href="/steamworks/login">Login</a>
      </p>
    </div>
  );
};
