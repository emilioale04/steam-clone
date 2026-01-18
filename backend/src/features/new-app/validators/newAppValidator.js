/**
 * Validadores para Nuevas Aplicaciones
 * Feature: Creación de Nueva Aplicación (RF-004)
 * 
 * Validaciones:
 * - Tamaño de archivos (C13: máximo 300 MB para build)
 * - Formato de archivos
 * - Campos obligatorios
 */

export const validarCrearAplicacion = (req, res, next) => {
  const { nombre_juego } = req.body;

  // Validar nombre del juego
  if (!nombre_juego || typeof nombre_juego !== 'string') {
    return res.status(400).json({
      success: false,
      mensaje: 'El nombre del juego es obligatorio'
    });
  }

  if (nombre_juego.trim().length < 3) {
    return res.status(400).json({
      success: false,
      mensaje: 'El nombre del juego debe tener al menos 3 caracteres'
    });
  }

  if (nombre_juego.length > 255) {
    return res.status(400).json({
      success: false,
      mensaje: 'El nombre del juego no puede exceder los 255 caracteres'
    });
  }

  // Validar descripción corta (opcional pero con límite)
  if (req.body.descripcion_corta && req.body.descripcion_corta.length > 500) {
    return res.status(400).json({
      success: false,
      mensaje: 'La descripción corta no puede exceder los 500 caracteres'
    });
  }

  // Validar categoria_id (obligatorio)
  if (!req.body.categoria_id) {
    return res.status(400).json({
      success: false,
      mensaje: 'La categoría es obligatoria'
    });
  }

  // Validar que categoria_id sea un UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(req.body.categoria_id)) {
    return res.status(400).json({
      success: false,
      mensaje: 'ID de categoría inválido'
    });
  }

  // C13: Validar tamaño de archivos
  if (req.files?.build_file) {
    const buildFile = req.files.build_file[0];
    const maxSizeBuild = 300 * 1024 * 1024; // 300 MB
    
    if (buildFile.size > maxSizeBuild) {
      return res.status(400).json({
        success: false,
        mensaje: 'El archivo de build no puede exceder los 300 MB',
        codigo: 'ARCHIVO_MUY_GRANDE'
      });
    }

    // Validar extensiones permitidas
    const extensionesPermitidas = ['.zip', '.rar', '.7z', '.exe'];
    const extension = buildFile.originalname.toLowerCase().slice(buildFile.originalname.lastIndexOf('.'));
    
    if (!extensionesPermitidas.includes(extension)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El archivo de build debe ser ZIP, RAR, 7Z o EXE',
        codigo: 'FORMATO_NO_SOPORTADO'
      });
    }
  }

  if (req.files?.portada_file) {
    const portadaFile = req.files.portada_file[0];
    const maxSizePortada = 5 * 1024 * 1024; // 5 MB
    
    if (portadaFile.size > maxSizePortada) {
      return res.status(400).json({
        success: false,
        mensaje: 'La imagen de portada no puede exceder los 5 MB',
        codigo: 'IMAGEN_MUY_GRANDE'
      });
    }

    // Validar formatos permitidos: PNG, JPG, GIF
    const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!formatosPermitidos.includes(portadaFile.mimetype.toLowerCase())) {
      return res.status(400).json({
        success: false,
        mensaje: 'La portada debe ser un archivo PNG, JPG o GIF',
        codigo: 'FORMATO_NO_SOPORTADO'
      });
    }
  }

  next();
};

export const validarActualizarAplicacion = (req, res, next) => {
  const { appId } = req.params;

  // Validar que appId sea un UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(appId)) {
    return res.status(400).json({
      success: false,
      mensaje: 'ID de aplicación inválido'
    });
  }

  // Si se actualiza el nombre, validarlo
  if (req.body.nombre_juego) {
    if (req.body.nombre_juego.trim().length < 3) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del juego debe tener al menos 3 caracteres'
      });
    }

    if (req.body.nombre_juego.length > 255) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del juego no puede exceder los 255 caracteres'
      });
    }
  }

  // Validar archivos si se envían
  if (req.files?.build_file) {
    const buildFile = req.files.build_file[0];
    const maxSizeBuild = 300 * 1024 * 1024; // 300 MB
    
    if (buildFile.size > maxSizeBuild) {
      return res.status(400).json({
        success: false,
        mensaje: 'El archivo de build no puede exceder los 300 MB'
      });
    }

    // Validar extensiones permitidas
    const extensionesPermitidas = ['.zip', '.rar', '.7z', '.exe'];
    const extension = buildFile.originalname.toLowerCase().slice(buildFile.originalname.lastIndexOf('.'));
    
    if (!extensionesPermitidas.includes(extension)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El archivo de build debe ser ZIP, RAR, 7Z o EXE'
      });
    }
  }

  if (req.files?.portada_file) {
    const portadaFile = req.files.portada_file[0];
    const maxSizePortada = 5 * 1024 * 1024; // 5 MB
    
    if (portadaFile.size > maxSizePortada) {
      return res.status(400).json({
        success: false,
        mensaje: 'La imagen de portada no puede exceder los 5 MB'
      });
    }

    // Validar formatos permitidos: PNG, JPG, GIF
    const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!formatosPermitidos.includes(portadaFile.mimetype.toLowerCase())) {
      return res.status(400).json({
        success: false,
        mensaje: 'La portada debe ser un archivo PNG, JPG o GIF'
      });
    }
  }

  next();
};

export const validarObtenerAplicacion = (req, res, next) => {
  const { appId } = req.params;

  // Validar que appId sea un UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(appId)) {
    return res.status(400).json({
      success: false,
      mensaje: 'ID de aplicación inválido'
    });
  }

  next();
};
