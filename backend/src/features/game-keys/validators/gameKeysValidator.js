
import { param, validationResult } from 'express-validator';


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      mensaje: 'Errores de validación',
      errores: errors.array().map(err => ({
        campo: err.path,
        mensaje: err.msg,
        valor: err.value
      }))
    });
  }
  
  next();
};


export const validarCrearLlave = [
  param('juegoId')
    .notEmpty()
    .withMessage('El ID del juego es requerido')
    .isUUID()
    .withMessage('El ID del juego debe ser un UUID válido'),
  
  handleValidationErrors
];


export const validarListarLlaves = [
  param('juegoId')
    .notEmpty()
    .withMessage('El ID del juego es requerido')
    .isUUID()
    .withMessage('El ID del juego debe ser un UUID válido'),
  
  handleValidationErrors
];


export const validarDesactivarLlave = [
  param('llaveId')
    .notEmpty()
    .withMessage('El ID de la llave es requerido')
    .isUUID()
    .withMessage('El ID de la llave debe ser un UUID válido'),
  
  handleValidationErrors
];
