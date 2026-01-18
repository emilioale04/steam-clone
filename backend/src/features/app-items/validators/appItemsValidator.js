import { body, param, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      mensaje: 'Errores de validacion',
      errores: errors.array().map((err) => ({
        campo: err.path,
        mensaje: err.msg,
        valor: err.value,
      })),
    });
  }

  next();
};

const validarAppId = param('appId')
  .notEmpty()
  .withMessage('El ID de la aplicacion es requerido')
  .isUUID()
  .withMessage('El ID de la aplicacion debe ser un UUID valido');

const validarItemId = param('itemId')
  .notEmpty()
  .withMessage('El ID del item es requerido')
  .isUUID()
  .withMessage('El ID del item debe ser un UUID valido');

export const validarListarItems = [validarAppId, handleValidationErrors];

export const validarCrearItem = [
  validarAppId,
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 120 })
    .withMessage('El nombre debe tener entre 3 y 120 caracteres'),
  body('is_tradeable')
    .optional()
    .isBoolean()
    .withMessage('is_tradeable debe ser booleano')
    .toBoolean(),
  body('is_marketable')
    .optional()
    .isBoolean()
    .withMessage('is_marketable debe ser booleano')
    .toBoolean(),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('activo debe ser booleano')
    .toBoolean(),
  handleValidationErrors,
];

export const validarActualizarItem = [
  validarItemId,
  body().custom((value, { req }) => {
    const { nombre, is_tradeable, is_marketable, activo } = req.body;
    const tieneCampos =
      nombre !== undefined ||
      is_tradeable !== undefined ||
      is_marketable !== undefined ||
      activo !== undefined;

    if (!tieneCampos) {
      throw new Error('Debe enviar al menos un campo para actualizar');
    }

    return true;
  }),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('El nombre debe tener entre 3 y 120 caracteres'),
  body('is_tradeable')
    .optional()
    .isBoolean()
    .withMessage('is_tradeable debe ser booleano')
    .toBoolean(),
  body('is_marketable')
    .optional()
    .isBoolean()
    .withMessage('is_marketable debe ser booleano')
    .toBoolean(),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('activo debe ser booleano')
    .toBoolean(),
  handleValidationErrors,
];

export const validarEliminarItem = [validarItemId, handleValidationErrors];
