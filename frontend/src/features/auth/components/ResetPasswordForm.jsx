import { useState } from 'react';

export const ResetPasswordForm = ({ onSubmit, error }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Reset Password</h2>
      
      <p style={styles.description}>
        Enter your new password below.
      </p>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength="6"
        style={styles.input}
      />
      
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength="6"
        style={styles.input}
      />
      
      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Resetting...' : 'Reset Password'}
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
  }
};
