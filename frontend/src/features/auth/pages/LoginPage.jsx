import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components';
import { useAuth } from '../../../shared/context/AuthContext';

export const LoginPage = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div>
      <LoginForm onSubmit={handleLogin} error={error} />
      <p style={{ textAlign: 'center' }}>
        <a href="/forgot-password">Forgot password?</a>
      </p>
      <p style={{ textAlign: 'center' }}>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
};
