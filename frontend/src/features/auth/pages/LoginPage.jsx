import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LoginForm } from '../components';
import { useAuth } from '../../../shared/context/AuthContext';
import { authService } from '../services/authService';

export const LoginPage = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifiedMessage, setVerifiedMessage] = useState(false);
  const [emailNotVerifiedError, setEmailNotVerifiedError] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [geoBlockedError, setGeoBlockedError] = useState(false);

  useEffect(() => {
    // Check if user just verified their email
    if (searchParams.get('verified') === 'true') {
      setVerifiedMessage(true);
    }
  }, [searchParams]);

  const handleLogin = async (email, password) => {
    try {
      setEmailNotVerifiedError(false);
      setResendSuccess(false);
      setUnverifiedEmail('');
      setGeoBlockedError(false);
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Check if the error is about email not verified
      if (err.message.includes('verificar') || err.message.includes('EMAIL_NOT_VERIFIED') || err.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerifiedError(true);
        setUnverifiedEmail(email);
      } else if (err.code === 'GEO_BLOCKED') {
        setGeoBlockedError(true);
      }
      console.error('Login failed:', err);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await authService.resendVerificationEmail(unverifiedEmail);
      setResendSuccess(true);
    } catch (err) {
      console.error('Failed to resend verification:', err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div>
      {verifiedMessage && (
        <div style={styles.successMessage}>
          <svg style={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          ¡Tu correo ha sido verificado correctamente! Ya puedes iniciar sesión.
        </div>
      )}
      
      {emailNotVerifiedError && (
        <div style={styles.warningMessage}>
          <svg style={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div style={{ flex: 1 }}>
            <strong>Correo no verificado</strong>
            <p style={{ margin: '0.5rem 0' }}>
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación antes de iniciar sesión.
            </p>
            {resendSuccess ? (
              <p style={{ color: '#4CAF50', margin: '0.5rem 0 0 0' }}>
                ✓ Correo de verificación reenviado. Revisa tu bandeja de entrada.
              </p>
            ) : (
              <button 
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={styles.resendButton}
              >
                {resendLoading ? 'Enviando...' : '¿No recibiste el correo? Reenviar verificación'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {geoBlockedError && (
        <div style={styles.warningMessage}>
          <svg style={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div style={{ flex: 1 }}>
            <strong>Acceso restringido</strong>
            <p style={{ margin: '0.5rem 0' }}>
              El acceso desde tu país no está permitido.
            </p>
          </div>
        </div>
      )}

      <LoginForm onSubmit={handleLogin} error={emailNotVerifiedError || geoBlockedError ? null : error} />
      <p style={{ textAlign: 'center' }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p style={{ textAlign: 'center' }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

const styles = {
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    maxWidth: '400px',
    margin: '0 auto 1rem',
    padding: '1rem',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    border: '1px solid #4CAF50',
    borderRadius: '4px',
    color: '#4CAF50',
    fontWeight: '500'
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    flexShrink: 0
  },
  warningMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    maxWidth: '400px',
    margin: '0 auto 1rem',
    padding: '1rem',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    border: '1px solid #FF9800',
    borderRadius: '4px',
    color: '#FF9800'
  },
  warningIcon: {
    width: '24px',
    height: '24px',
    flexShrink: 0,
    marginTop: '2px'
  },
  resendButton: {
    background: 'none',
    border: 'none',
    color: '#66c0f4',
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.875rem',
    textDecoration: 'underline'
  }
};
