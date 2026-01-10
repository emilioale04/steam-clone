import { useState } from 'react';
import { ForgotPasswordForm } from '../components';
import { authService } from '../services/authService';

export const ForgotPasswordPage = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleForgotPassword = async (email) => {
    try {
      setError(null);
      setSuccess(null);
      await authService.forgotPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
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
        Remember your password? <a href="/login">Login</a>
      </p>
    </div>
  );
};
