import { useState } from 'react';
import { 
  emailValidator, 
  usernameValidator, 
  passwordValidator 
} from '../../../shared/utils/validators';

export const RegisterForm = ({ onSubmit, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Validar username
    if (!username.trim()) {
      errors.username = 'Username es requerido';
    } else if (!usernameValidator.test(username)) {
      errors.username = usernameValidator.message;
    }

    // Validar email
    if (!email.trim()) {
      errors.email = 'Email es requerido';
    } else if (!emailValidator.test(email)) {
      errors.email = emailValidator.message;
    }

    // Validar contraseña
    if (!password) {
      errors.password = 'Contraseña es requerida';
    } else if (!passwordValidator.test(password)) {
      errors.password = passwordValidator.message;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email, password, username);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Register</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={validateForm}
          required
          style={{...styles.input, borderColor: validationErrors.username ? '#c00' : '#ccc'}}
        />
        {validationErrors.username && (
          <div style={styles.fieldError}>{validationErrors.username}</div>
        )}
      </div>
      
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validateForm}
          required
          style={{...styles.input, borderColor: validationErrors.email ? '#c00' : '#ccc'}}
        />
        {validationErrors.email && (
          <div style={styles.fieldError}>{validationErrors.email}</div>
        )}
      </div>
      
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={validateForm}
          required
          style={{...styles.input, borderColor: validationErrors.password ? '#c00' : '#ccc'}}
        />
        {validationErrors.password && (
          <div style={styles.fieldError}>{validationErrors.password}</div>
        )}
      </div>
      
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Loading...' : 'Register'}
      </button>
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '400px',
    margin: '0 auto',
    padding: '2rem'
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box'
  },
  fieldError: {
    color: '#c00',
    fontSize: '0.875rem',
    marginTop: '0.25rem'
  },
  button: {
    padding: '0.75rem',
    fontSize: '1rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    padding: '0.75rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px'
  }
};
