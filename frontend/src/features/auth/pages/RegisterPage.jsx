import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components';
import { useAuth } from '../../../shared/context/AuthContext';

export const RegisterPage = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (email, password, username) => {
    try {
      await register(email, password, username);
      navigate('/');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div>
      <RegisterForm onSubmit={handleRegister} error={error} />
      <p style={{ textAlign: 'center' }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};
