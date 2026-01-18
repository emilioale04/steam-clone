import { useState, useEffect } from 'react';
import { newAppService } from '../services/newAppService';

/**
 * Formulario para crear una nueva aplicación en Steamworks
 * RF-004: Creación de Aplicación
 * 
 * Campos requeridos:
 * - nombre_juego
 * - descripcion_corta
 * - descripcion_larga
 * - build_storage_path (archivo ZIP del build)
 * - portada_image_path (imagen de portada)
 */
export const NuevaAppForm = () => {
  const [formData, setFormData] = useState({
    nombre_juego: '',
    descripcion_corta: '',
    descripcion_larga: '',
    categoria_id: '',
  });

  const [buildFile, setBuildFile] = useState(null);
  const [portadaFile, setPortadaFile] = useState(null);
  const [categorias, setCategorias] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setLoadingCategorias(true);
        const categoriasData = await newAppService.obtenerCategorias();
        setCategorias(categoriasData);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        setError('No se pudieron cargar las categorías');
      } finally {
        setLoadingCategorias(false);
      }
    };
    
    cargarCategorias();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBuildFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar formatos permitidos: ZIP, RAR, 7Z, EXE
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const extensionesPermitidas = ['.zip', '.rar', '.7z', '.exe'];
      if (!extensionesPermitidas.includes(extension)) {
        setError('El archivo de build debe ser ZIP, RAR, 7Z o EXE');
        e.target.value = '';
        return;
      }
      // Validar tamaño máximo 300 MB (C13)
      const maxSize = 300 * 1024 * 1024; // 300 MB
      if (file.size > maxSize) {
        setError('El archivo de build no puede exceder los 300 MB');
        e.target.value = '';
        return;
      }
      setBuildFile(file);
    }
  };

  const handlePortadaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar formatos permitidos: PNG, JPG, GIF
      const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!formatosPermitidos.includes(file.type.toLowerCase())) {
        setError('La portada debe ser un archivo PNG, JPG o GIF');
        e.target.value = '';
        return;
      }
      // Validar tamaño máximo 5 MB
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        setError('La imagen de portada no puede exceder los 5 MB');
        e.target.value = '';
        return;
      }
      setPortadaFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones del frontend
    if (!formData.nombre_juego.trim()) {
      setError('El nombre del juego es obligatorio');
      return;
    }

    if (formData.nombre_juego.length < 3) {
      setError('El nombre del juego debe tener al menos 3 caracteres');
      return;
    }

    if (!formData.descripcion_corta.trim()) {
      setError('La descripción corta es obligatoria');
      return;
    }

    if (!formData.categoria_id) {
      setError('Debes seleccionar una categoría');
      return;
    }

    if (!buildFile) {
      setError('Debes subir el archivo de build de tu juego');
      return;
    }

    if (!portadaFile) {
      setError('Debes subir una imagen de portada');
      return;
    }

    try {
      setLoading(true);

      // Crear FormData para enviar archivos
      const data = new FormData();
      data.append('nombre_juego', formData.nombre_juego.trim());
      data.append('descripcion_corta', formData.descripcion_corta.trim());
      data.append('descripcion_larga', formData.descripcion_larga.trim());
      data.append('categoria_id', formData.categoria_id);
      data.append('build_file', buildFile);
      data.append('portada_file', portadaFile);

      const resultado = await newAppService.crearAplicacion(data);

      setSuccess(`¡Aplicación creada exitosamente! AppID: ${resultado.app_id}`);
      
      // Limpiar formulario
      setFormData({
        nombre_juego: '',
        descripcion_corta: '',
        descripcion_larga: '',
        categoria_id: '',
      });
      setBuildFile(null);
      setPortadaFile(null);
      
      // Limpiar inputs de archivo
      document.querySelector('input[name="build_file"]').value = '';
      document.querySelector('input[name="portada_file"]').value = '';

    } catch (err) {
      console.error('Error al crear aplicación:', err);
      setError(err.message || 'Error al crear la aplicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nueva-app-form-container">
      <p className="form-description">
        Completa el formulario para registrar una nueva aplicación.
      </p>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="nueva-app-form">
        <div className="form-group">
          <label htmlFor="nombre_juego">
            Nombre del Juego <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nombre_juego"
            name="nombre_juego"
            value={formData.nombre_juego}
            onChange={handleInputChange}
            placeholder="Ej: Space Explorer"
            maxLength="255"
            required
            disabled={loading}
          />
          <small className="form-help">Máximo 255 caracteres</small>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion_corta">
            Descripción Corta <span className="required">*</span>
          </label>
          <textarea
            id="descripcion_corta"
            name="descripcion_corta"
            value={formData.descripcion_corta}
            onChange={handleInputChange}
            placeholder="Una breve descripción de tu juego (aparecerá en listados)"
            rows="3"
            maxLength="500"
            required
            disabled={loading}
          />
          <small className="form-help">Máximo 500 caracteres</small>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion_larga">
            Descripción Larga
          </label>
          <textarea
            id="descripcion_larga"
            name="descripcion_larga"
            value={formData.descripcion_larga}
            onChange={handleInputChange}
            placeholder="Descripción detallada de tu juego, características, historia, etc."
            rows="8"
            disabled={loading}
          />
          {/*<small className="form-help">Opcional. Puedes editarla más tarde.</small>*/}
        </div>

        <div className="form-group">
          <label htmlFor="categoria_id">
            Categoría <span className="required">*</span>
          </label>
          <select
            id="categoria_id"
            name="categoria_id"
            value={formData.categoria_id}
            onChange={handleInputChange}
            required
            disabled={loading || loadingCategorias}
          >
            <option value="">Selecciona una categoría...</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre_categoria}
              </option>
            ))}
          </select>
          <small className="form-help">
            {loadingCategorias ? 'Cargando categorías...' : 'Selecciona la categoría que mejor describe tu juego'}
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="build_file">
            Archivo ejecutable del juego <span className="required">*</span>
          </label>
          <input
            type="file"
            id="build_file"
            name="build_file"
            onChange={handleBuildFileChange}
            accept=".zip,.rar,.7z,.exe"
            required
            disabled={loading}
          />
          <small className="form-help">
            Formatos aceptados: ZIP, RAR, 7Z, EXE. Tamaño máximo: 300 MB
          </small>
          {buildFile && (
            <div className="file-selected">
              ✓ Archivo seleccionado: {buildFile.name} ({(buildFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="portada_file">
            Imagen de Portada <span className="required">*</span>
          </label>
          <input
            type="file"
            id="portada_file"
            name="portada_file"
            onChange={handlePortadaFileChange}
            accept="image/png,image/jpeg,image/jpg,image/gif"
            required
            disabled={loading}
          />
          <small className="form-help">
            Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5 MB.
          </small>
          {portadaFile && (
            <div className="file-selected">
              ✓ Imagen seleccionada: {portadaFile.name} ({(portadaFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        {/*<div className="form-info-box">
          <h4>Información importante</h4>
          <ul>
            <li>Se requiere un pago único de <strong>$100 USD</strong> para activar tu aplicación</li>
            <li>Una vez creada, se asignará un <strong>AppID único</strong> a tu aplicación</li>
            <li>El estado inicial será <strong>"Borrador"</strong></li>
            <li>Podrás enviar tu aplicación a revisión una vez completado el pago</li>
          </ul>
        </div>*/}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Crear Aplicación ($100 USD)'}
          </button>
        </div>
      </form>

      <style jsx="true">{`
        .nueva-app-form-container {
          max-width: 70%;
          margin: auto;
        }

        .form-description {
          color: #a6a6a6;
        }

        .alert {
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 4px;
        }

        .alert-error {
          background-color: #fee;
          border-left: 4px solid #c33;
          color: #c33;
        }

        .alert-success {
          background-color: #efe;
          border-left: 4px solid #3c3;
          color: #3c3;
        }

        .nueva-app-form {
          padding: 2rem;
          border-radius: 8px;
          text-align: left;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: white;
        }

        .required {
          color: #c33;
        }

        .form-group input[type="text"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
          background: white;
        }

        .form-group select {
          cursor: pointer;
        }

        input[type="file"] {
          border-radius: 4px;
          padding: 0.5rem;
          cursor: pointer;
          border: 2px solid #000000;
          border-radius: .2em;
          background-color: #aaddff;
          transition: 1s;
        }

        .form-group textarea {
          resize: vertical;
          background: white;
        }

        .form-help {
          display: block;
          margin-top: 0.25rem;
          color: #a6a6a6;
          font-size: 0.875rem;
          text-align: left;
        }

        .file-selected {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #e8f5e9;
          border-radius: 4px;
          color: #2e7d32;
          font-size: 0.875rem;
        }

        .form-info-box {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-info-box h4 {
          margin-top: 0;
          color: #856404;
        }

        .form-info-box ul {
          margin: 0.5rem 0 0 1.5rem;
          color: #856404;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #1976d2;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-secondary {
          background: #757575;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #616161;
        }
      `}</style>
    </div>
  );
}


