import { useState } from 'react';
import { reviewValidator } from '../../../shared/utils/validators';

export const ReviewForm = ({ appId, onSubmit, onCancel, loading = false }) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Validar rating
    if (rating < 1 || rating > 5) {
      errors.rating = 'Rating debe ser entre 1 y 5 estrellas';
    }

    // Validar review
    if (!review.trim()) {
      errors.review = 'Reseña es requerida';
    } else if (!reviewValidator.test(review)) {
      errors.review = reviewValidator.message;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        appId,
        rating,
        review: reviewValidator.clean(review)
      });
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleReviewChange = (e) => {
    const value = e.target.value;
    if (value.length <= reviewValidator.maxLength) {
      setReview(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3>Escribir Reseña</h3>

      {/* Rating */}
      <div style={styles.field}>
        <label style={styles.label}>Rating:</label>
        <div style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                ...styles.starButton,
                color: star <= rating ? '#ffd700' : '#ddd'
              }}
            >
              ★
            </button>
          ))}
          <span style={styles.ratingText}>{rating} estrella{rating !== 1 ? 's' : ''}</span>
        </div>
        {validationErrors.rating && (
          <div style={styles.fieldError}>{validationErrors.rating}</div>
        )}
      </div>

      {/* Review Text */}
      <div style={styles.field}>
        <label style={styles.label}>Reseña:</label>
        <textarea
          value={review}
          onChange={handleReviewChange}
          onBlur={validateForm}
          placeholder="Escribe tu reseña aquí..."
          rows={4}
          style={{
            ...styles.textarea,
            borderColor: validationErrors.review ? '#c00' : '#ccc'
          }}
        />
        <div style={styles.charCount}>
          {review.length}/{reviewValidator.maxLength} caracteres
        </div>
        {validationErrors.review && (
          <div style={styles.fieldError}>{validationErrors.review}</div>
        )}
      </div>

      {/* Buttons */}
      <div style={styles.buttonContainer}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={styles.cancelButton}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          style={styles.submitButton}
        >
          {loading ? 'Enviando...' : 'Enviar Reseña'}
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '1.5rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff'
  },
  field: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: '#333'
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.25rem'
  },
  ratingText: {
    fontSize: '0.9rem',
    color: '#666'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  charCount: {
    fontSize: '0.8rem',
    color: '#666',
    textAlign: 'right',
    marginTop: '0.25rem'
  },
  fieldError: {
    color: '#c00',
    fontSize: '0.875rem',
    marginTop: '0.25rem'
  },
  buttonContainer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
