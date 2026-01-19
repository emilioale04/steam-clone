import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Globe, 
  Lock, 
  ShieldOff,
  ChevronRight,
  Search,
  User,
  X,
  ImageIcon
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';

const privacyOptions = [
  {
    id: 'public',
    label: 'Public',
    icon: Globe,
    description: 'Anyone can view and join the group instantly without approval.',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-500/10'
  },
  {
    id: 'restricted',
    label: 'Restricted',
    icon: Lock,
    description: 'Anyone can view, but users must apply and be approved to join.',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  {
    id: 'closed',
    label: 'Closed',
    icon: ShieldOff,
    description: 'Group is hidden. Membership is by invitation only.',
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-500/10'
  }
];

export const CreateGroupPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
    privacy: 'public',
    acceptTerms: false
  });
  
  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Process the selected file
  const processFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, avatar: 'Solo se permiten imágenes (JPG, PNG, GIF, WebP)' }));
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, avatar: 'La imagen no puede superar 2MB' }));
      return;
    }

    // Clear any previous errors
    if (errors.avatar) {
      setErrors(prev => ({ ...prev, avatar: '' }));
    }

    // Revoke previous preview URL to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL and set states
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  // Handle click on upload area
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle removing the selected image
  const handleRemoveImage = (e) => {
    e.stopPropagation(); // Prevent triggering the upload click
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Generate group link preview
  const groupLinkPreview = formData.name 
    ? `steamcommunity.com/groups/${formData.name.toLowerCase().replace(/\s+/g, '_')}`
    : 'steamcommunity.com/groups/group_name';

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del grupo es requerido';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.length > 60) {
      newErrors.name = 'El nombre no puede exceder 60 caracteres';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos para continuar';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== handleSubmit ejecutado ===' );
    console.log('Form data:', formData);
    
    // Verificar que el usuario esté logueado
    if (!user) {
      setSubmitError('Debes iniciar sesión para crear un grupo.');
      navigate('/login');
      return;
    }
    
    // Limpiar errores previos
    setSubmitError(null);
    
    // Validar formulario
    if (!validateForm()) {
      console.log('Validación fallida:', errors);
      return;
    }
    
    console.log('Validación exitosa, enviando al backend...');
    setIsSubmitting(true);

    try {
      // URL de avatar por defecto (bypass temporal mientras no hay Storage)
      const defaultAvatarUrl = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/b5/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg';
      
      // Preparar datos para enviar al backend
      const groupData = {
        nombre: formData.name.trim(),
        abreviatura: formData.abbreviation.trim() || null,
        descripcion: formData.description.trim(),
        avatar_url: defaultAvatarUrl, // Bypass: usar avatar por defecto
        visibilidad: formData.privacy.toLowerCase(), // Siempre en minúsculas
        consentimiento_datos: formData.acceptTerms
      };

      console.log('Datos a enviar:', groupData);
      
      if (selectedFile) {
        console.log('Archivo seleccionado (ignorado por ahora):', selectedFile.name);
      }

      // Enviar al backend con cookies httpOnly (credentials: 'include')
      // RUTA CORRECTA: /api/community/groups (según backend/src/features/community/index.js)
      const response = await fetch('http://localhost:3000/api/community/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Envía las cookies httpOnly automáticamente
        body: JSON.stringify(groupData)
      });

      // Debug: ver respuesta cruda del servidor
      const text = await response.text();
      console.log('Respuesta cruda del servidor:', text);
      
      // Parsear JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parseando JSON:', parseError);
        throw new Error('El servidor no devolvió JSON válido.');
      }
      
      console.log('Respuesta del servidor:', data);

      if (!response.ok) {
        // Mensaje amigable para usuarios limitados
        const errorMsg = data.error || data.message || 'Error al crear el grupo';
        if (errorMsg.toLowerCase().includes('limitad')) {
          throw new Error('Tu cuenta es limitada. Realiza una compra en la Store para habilitar esta función.');
        }
        throw new Error(errorMsg);
      }

      // Éxito
      console.log('Grupo creado exitosamente:', data);
      setSubmitSuccess(true);
      
      // Redirigir a la comunidad después de un breve delay para mostrar éxito
      setTimeout(() => navigate('/community'), 1500);
      
    } catch (error) {
      console.error('Error al crear grupo:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/community');
  };

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Header */}
      <header className="bg-[#171a21] border-b border-[#2a3f5f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Nav */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-white font-semibold hidden sm:block">Steam Community</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/store" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Store
                </Link>
                <Link to="/community" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Community
                </Link>
                <Link to="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                  About
                </Link>
                <Link to="/support" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Support
                </Link>
              </nav>
            </div>

            {/* Right side - Search and User */}
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-9 pr-4 py-1.5 bg-[#2a3f5f] border border-[#3a5070] rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-40"
                />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2a3f5f] flex items-center justify-center">
                <User size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Create a New Group</h1>
          <p className="text-gray-400">
            Start a community for you and your friends. Customize your identity and privacy.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-[#16202d] rounded-xl border border-[#2a3f5f] p-6 sm:p-8">
          {/* Top Section - Avatar and Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Avatar Upload */}
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
                Group Avatar
              </label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              
              <div className="relative">
                {/* Upload Area with Drag & Drop */}
                <div 
                  onClick={handleUploadClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-32 h-32 bg-[#1b2838] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                    isDragging 
                      ? 'border-cyan-400 bg-cyan-500/10' 
                      : previewUrl 
                        ? 'border-transparent' 
                        : 'border-[#3a5070] hover:border-cyan-500'
                  }`}
                >
                  {previewUrl ? (
                    <>
                      {/* Image Preview */}
                      <img 
                        src={previewUrl} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <span className="text-white text-xs font-medium">Cambiar</span>
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Upload Icon and Text */}
                      <Upload 
                        size={24} 
                        className={`mb-2 transition-colors ${
                          isDragging ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'
                        }`} 
                      />
                      <span className={`text-xs transition-colors ${
                        isDragging ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'
                      }`}>
                        {isDragging ? 'Suelta aquí' : 'Upload Image'}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Helper text */}
                <p className="text-gray-500 text-xs mt-2">
                  Recommended: 184px square. Max 2MB.
                </p>
                
                {/* Error message */}
                {errors.avatar && (
                  <p className="text-red-400 text-xs mt-1">{errors.avatar}</p>
                )}
              </div>
            </div>

            {/* Name and Abbreviation */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Group Name */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. The Midnight Raiders"
                    maxLength={60}
                    className={`w-full px-4 py-3 bg-[#1b2838] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                      errors.name ? 'border-red-500' : 'border-[#3a5070] focus:border-cyan-500'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
                    <p className="text-gray-500 text-xs ml-auto">{formData.name.length}/60</p>
                  </div>
                </div>

                {/* Abbreviation */}
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                    Abbreviation
                  </label>
                  <input
                    type="text"
                    name="abbreviation"
                    value={formData.abbreviation}
                    onChange={handleChange}
                    placeholder="e.g. TMR"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-[#1b2838] border border-[#3a5070] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Group Link Preview */}
              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                  Group Link Preview
                </label>
                <div className="px-4 py-3 bg-[#1b2838] border border-[#3a5070] rounded-lg">
                  <span className="text-gray-400">{groupLinkPreview}</span>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-1">About</label>
            <p className="text-gray-400 text-sm mb-3">Describe your group's purpose and rules.</p>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell people what your group is about..."
              rows={4}
              className={`w-full px-4 py-3 bg-[#1b2838] border rounded-lg text-white placeholder-gray-500 focus:outline-none resize-none transition-colors ${
                errors.description ? 'border-red-500' : 'border-[#3a5070] focus:border-cyan-500'
              }`}
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Privacy Settings */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-1">Privacy Settings</label>
            <p className="text-gray-400 text-sm mb-4">Control who can see and join your group.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.privacy === option.id;
                
                return (
                  <label
                    key={option.id}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      isSelected 
                        ? `${option.borderColor} ${option.bgColor}` 
                        : 'border-[#3a5070] hover:border-[#4a6080]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={option.id}
                      checked={isSelected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex flex-col">
                      <Icon 
                        size={20} 
                        className={isSelected ? 'text-white mb-3' : 'text-gray-400 mb-3'} 
                      />
                      <span className={`font-semibold mb-2 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-400 leading-relaxed">
                        {option.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Terms Checkbox (LOPDP Consent) */}
          <div className="mb-8 p-4 bg-[#1b2838] rounded-lg border border-[#3a5070]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-gray-500 bg-[#2a3f5f] text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
              />
              <div>
                <span className="text-gray-300 text-sm">
                  Acepto los{' '}
                  <Link to="/terms" className="text-cyan-400 hover:underline">
                    términos de uso
                  </Link>
                  {' '}y la{' '}
                  <Link to="/privacy" className="text-cyan-400 hover:underline">
                    política de privacidad
                  </Link>
                  . Autorizo el tratamiento de mis datos personales conforme a la LOPDP.
                </span>
                {errors.acceptTerms && (
                  <p className="text-red-400 text-xs mt-1">{errors.acceptTerms}</p>
                )}
              </div>
            </label>
          </div>

          {/* Submit Error Message */}
          {submitError && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#2a3f5f]">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-500"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  Create Group
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateGroupPage;
