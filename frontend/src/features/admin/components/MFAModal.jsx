import { useState } from 'react';

/**
 * Modal de verificación MFA para operaciones sensibles
 */
const MFAModal = ({ isOpen, onClose, onVerify, operationType = 'operación' }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onVerify(code);
      setCode('');
      onClose();
    } catch (err) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: '#1e2a38',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          border: '1px solid #2a475e'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ 
          color: '#66c0f4', 
          marginBottom: '0.5rem',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Verificación de Seguridad
        </h2>
        
        <p style={{ 
          color: '#c7d5e0', 
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          Esta {operationType} requiere verificación MFA. Ingresa el código de tu aplicación autenticadora.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#dc354520',
            border: '1px solid #dc3545',
            color: '#dc3545',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="mfa-code" 
              style={{ 
                display: 'block', 
                color: '#c7d5e0', 
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              Código de Autenticación
            </label>
            <input
              id="mfa-code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength="6"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a475e',
                border: '1px solid #3d5a80',
                borderRadius: '4px',
                color: 'white',
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                outline: 'none'
              }}
            />
            <p style={{ 
              color: '#8f98a0', 
              fontSize: '0.75rem', 
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
              Ingresa el código de 6 dígitos
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#2a475e',
                color: '#c7d5e0',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: code.length === 6 ? '#66c0f4' : '#2a475e',
                color: code.length === 6 ? '#1b2838' : '#8f98a0',
                border: 'none',
                borderRadius: '4px',
                cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: (loading || code.length !== 6) ? 0.5 : 1
              }}
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MFAModal;
