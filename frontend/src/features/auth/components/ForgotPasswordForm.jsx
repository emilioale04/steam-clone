import { useState } from 'react';

export const ForgotPasswordForm = ({ onSubmit, error, success }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Forgot Password</h2>
      
      <p style={styles.description}>
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={styles.input}
      />
      
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Sending...' : 'Send Reset Link'}
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
  description: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0'
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px'
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
  },
  success: {
    padding: '0.75rem',
    backgroundColor: '#efe',
    color: '#070',
    borderRadius: '4px'
  }
};
