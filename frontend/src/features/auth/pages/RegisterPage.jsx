import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RegisterForm } from '../components';
import { useAuth } from '../../../shared/context/AuthContext';

export const RegisterPage = () => {
  const { register, error, emailVerificationPending, pendingEmail, clearEmailVerificationPending } = useAuth();
  const navigate = useNavigate();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegister = async (email, password, username) => {
    try {
      const result = await register(email, password, username);
      if (result.data?.emailVerificationPending) {
        setRegisteredEmail(email);
        setShowVerificationMessage(true);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  // Show verification pending message
  if (showVerificationMessage || emailVerificationPending) {
    return (
      <div style={styles.container}>
        <div style={styles.verificationBox}>
          <div style={styles.iconWrapper}>
            <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 style={styles.title}>¡Verifica tu correo electrónico!</h2>
          <p style={styles.message}>
            Hemos enviado un enlace de verificación a:
          </p>
          <p style={styles.email}>{registeredEmail || pendingEmail}</p>
          <p style={styles.instructions}>
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              💡 Si no ves el correo, revisa tu carpeta de spam o correo no deseado.
            </p>
          </div>
          <Link 
            to="/login" 
            style={styles.loginLink}
            onClick={clearEmailVerificationPending}
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <RegisterForm onSubmit={handleRegister} error={error} />
      <p style={{ textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    padding: '2rem'
  },
  verificationBox: {
    backgroundColor: '#1b2838',
    borderRadius: '8px',
    padding: '3rem',
    textAlign: 'center',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  iconWrapper: {
    marginBottom: '1.5rem'
  },
  icon: {
    width: '64px',
    height: '64px',
    color: '#66c0f4'
  },
  title: {
    color: '#ffffff',
    fontSize: '1.75rem',
    marginBottom: '1rem'
  },
  message: {
    color: '#c7d5e0',
    fontSize: '1rem',
    marginBottom: '0.5rem'
  },
  email: {
    color: '#66c0f4',
    fontSize: '1.125rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem'
  },
  instructions: {
    color: '#8f98a0',
    fontSize: '0.95rem',
    marginBottom: '1.5rem'
  },
  infoBox: {
    backgroundColor: 'rgba(102, 192, 244, 0.1)',
    borderRadius: '4px',
    padding: '1rem',
    marginBottom: '1.5rem'
  },
  infoText: {
    color: '#c7d5e0',
    fontSize: '0.875rem',
    margin: 0
  },
  loginLink: {
    display: 'inline-block',
    padding: '0.75rem 2rem',
    backgroundColor: '#66c0f4',
    color: '#1b2838',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  }
};
