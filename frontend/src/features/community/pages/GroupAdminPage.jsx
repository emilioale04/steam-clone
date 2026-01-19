import { useState, useEffect, useRef } from 'react';
import { useParams, Link, NavLink } from 'react-router-dom';
import { 
  Search, 
  Users, 
  Settings,
  Shield,
  UserCog,
  Ban,
  ExternalLink,
  Upload,
  ImageIcon,
  Globe,
  Lock,
  EyeOff,
  Save,
  X,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ChevronRight,
  LogOut
} from 'lucide-react';

// ============================================
// MOCK DATA - Se usa cuando el backend falla
// ============================================
const generateMockGroupData = (groupId) => ({
  id: groupId,
  numericId: '839210',
  nombre: 'Steam Gamers',
  abreviatura: 'SG',
  custom_url: 'steamgamers_official',
  headline: 'The official community for serious gamers.',
  descripcion: 'Welcome to Steam Gamers! We are a community dedicated to competitive gaming, game reviews, and finding teammates.\n\nJoin our Discord server for daily events and giveaways. Please read the rules in the discussions tab before posting.',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  visibilidad: 'public',
  member_count: 12405
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const GroupAdminPage = () => {
  const { groupId } = useParams();
  const fileInputRef = useRef(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    abreviatura: '',
    custom_url: '',
    headline: '',
    descripcion: '',
    visibilidad: 'public'
  });
  
  // Estados de UI
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Estados de imagen
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Cargar datos del grupo
  useEffect(() => {
    const fetchGroupData = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(`http://localhost:3000/api/community/groups/${groupId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        setGroupInfo(data);
        setFormData({
          nombre: data.nombre || '',
          abreviatura: data.abreviatura || '',
          custom_url: data.custom_url || '',
          headline: data.headline || '',
          descripcion: data.descripcion || '',
          visibilidad: data.visibilidad || 'public'
        });
        setAvatarPreview(data.avatar_url);
        setIsUsingMockData(false);
        
      } catch (err) {
        console.warn('⚠️ Error al cargar datos reales, usando mock:', err.message);
        const mockData = generateMockGroupData(groupId);
        
        setGroupInfo(mockData);
        setFormData({
          nombre: mockData.nombre,
          abreviatura: mockData.abreviatura,
          custom_url: mockData.custom_url,
          headline: mockData.headline,
          descripcion: mockData.descripcion,
          visibilidad: mockData.visibilidad
        });
        setAvatarPreview(mockData.avatar_url);
        setIsUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  // Manejar cambio de visibilidad
  const handleVisibilityChange = (visibility) => {
    setFormData(prev => ({
      ...prev,
      visibilidad: visibility
    }));
    setHasChanges(true);
  };

  // Manejar carga de avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es muy grande. Máximo 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes.');
        return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  // Remover avatar
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setHasChanges(true);
  };

  // Guardar cambios
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/community/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      setSaveMessage({ type: 'success', text: '¡Cambios guardados exitosamente!' });
      setHasChanges(false);
      
    } catch (err) {
      console.warn('⚠️ Error al guardar, simulando guardado:', err.message);
      // Simulación de guardado exitoso
      setSaveMessage({ type: 'warning', text: 'Cambios guardados (Simulación - Backend no disponible)' });
      setHasChanges(false);
    } finally {
      setSaving(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Descartar cambios
  const handleDiscard = () => {
    if (groupInfo) {
      setFormData({
        nombre: groupInfo.nombre || '',
        abreviatura: groupInfo.abreviatura || '',
        custom_url: groupInfo.custom_url || '',
        headline: groupInfo.headline || '',
        descripcion: groupInfo.descripcion || '',
        visibilidad: groupInfo.visibilidad || 'public'
      });
      setAvatarPreview(groupInfo.avatar_url);
      setAvatarFile(null);
      setHasChanges(false);
    }
  };

  // Menú del sidebar
  const sidebarMenu = [
    { id: 'general', label: 'General Profile', icon: Settings },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'members', label: 'Member Management', icon: UserCog },
    { id: 'bans', label: 'Ban List', icon: Ban }
  ];

  // Opciones de visibilidad
  const visibilityOptions = [
    {
      id: 'public',
      label: 'Public',
      icon: Globe,
      description: 'Anyone can join and view the group page. Best for large communities.',
      color: 'cyan'
    },
    {
      id: 'restricted',
      label: 'Restricted',
      icon: Lock,
      description: 'Users must apply or be invited to join. Content is visible to everyone.',
      color: 'yellow'
    },
    {
      id: 'private',
      label: 'Private',
      icon: EyeOff,
      description: 'Invite only. Group content is hidden from non-members.',
      color: 'gray'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Mock Data Warning Banner */}
      {isUsingMockData && (
        <div className="bg-yellow-600/20 border-b border-yellow-600/50 px-4 py-2">
          <p className="text-yellow-400 text-sm text-center">
            ⚠️ Modo de demostración activo. Los cambios no se guardarán en el servidor.
          </p>
        </div>
      )}

      {/* Top Navigation */}
      <header className="bg-[#171a21] border-b border-[#2a3f5f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-6">
              <Link to="/community" className="flex items-center gap-2 text-white font-semibold">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center">
                  <Users size={14} />
                </div>
                <span>Community Hub</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-4 text-sm">
                <span className="text-gray-500">Discussions</span>
                <span className="text-gray-500">Workshop</span>
                <span className="text-gray-500">Market</span>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  className="pl-9 pr-4 py-1.5 bg-[#2a3f5f] border border-[#3a5070] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-48"
                />
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop" 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-48px)] bg-[#171a21] border-r border-[#2a3f5f] flex-shrink-0">
          {/* Group Info */}
          <div className="p-4 border-b border-[#2a3f5f]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-[#2a3f5f] overflow-hidden flex-shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={formData.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users size={20} className="text-gray-500" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{formData.nombre || 'Grupo'}</h3>
                <p className="text-gray-500 text-xs">ID: {groupInfo?.numericId || groupId}</p>
              </div>
            </div>
            
            <Link
              to={`/community/groups/${groupId}`}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded transition-colors"
            >
              View Public Page
              <ExternalLink size={14} />
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="p-2">
            <p className="px-3 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wide">Settings</p>
            {sidebarMenu.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSection === item.id
                      ? 'bg-cyan-600/20 text-cyan-400'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a3f5f]/50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="p-2 border-t border-[#2a3f5f] mt-auto">
            <p className="px-3 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wide">Actions</p>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
              <LogOut size={18} />
              <span>Leave Group</span>
            </button>
          </div>
        </aside>

        {/* Main Form Area */}
        <main className="flex-1 p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/community" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link to="/community" className="hover:text-white transition-colors">Groups</Link>
            <ChevronRight size={14} />
            <span className="text-cyan-400">Admin Settings</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">General Settings</h1>
              <p className="text-gray-400 text-sm">Manage your group's public appearance and fundamental details.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscard}
                disabled={!hasChanges}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  hasChanges
                    ? 'bg-[#2a3f5f] text-white hover:bg-[#3a5070]'
                    : 'bg-[#2a3f5f]/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
                  hasChanges && !saving
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'bg-cyan-600/50 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Save Message Toast */}
          {saveMessage && (
            <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-3 ${
              saveMessage.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
            }`}>
              <span>{saveMessage.text}</span>
            </div>
          )}

          {/* Form Sections */}
          <div className="space-y-6 max-w-3xl">
            {/* Group Avatar Section */}
            <section className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3f5f] flex items-center gap-3">
                <ImageIcon size={18} className="text-cyan-400" />
                <h2 className="text-white font-semibold">Group Avatar</h2>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-6">
                  {/* Avatar Preview */}
                  <div className="w-24 h-24 rounded-lg bg-[#2a3f5f] overflow-hidden flex-shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users size={32} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div>
                    <h3 className="text-white font-medium mb-1">Upload a new image</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Recommended size: 184x184px. Supported formats: JPG, PNG.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded transition-colors"
                      >
                        Choose File
                      </button>
                      {avatarPreview && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          Remove Avatar
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Group Identity Section */}
            <section className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3f5f] flex items-center gap-3">
                <Shield size={18} className="text-cyan-400" />
                <h2 className="text-white font-semibold">Group Identity</h2>
              </div>
              <div className="p-5 space-y-5">
                {/* Name and Abbreviation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Group Name</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3a5070] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Abbreviation</label>
                    <input
                      type="text"
                      name="abreviatura"
                      value={formData.abreviatura}
                      onChange={handleChange}
                      maxLength={5}
                      className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3a5070] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="e.g. SG"
                    />
                  </div>
                </div>

                {/* Custom URL */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Custom URL</label>
                  <div className="flex">
                    <span className="px-4 py-3 bg-[#1b2838] border border-r-0 border-[#3a5070] rounded-l-lg text-gray-500 text-sm">
                      steamcommunity.com/groups/
                    </span>
                    <input
                      type="text"
                      name="custom_url"
                      value={formData.custom_url}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 bg-[#2a3f5f] border border-[#3a5070] rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="your_group_url"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* About & Description Section */}
            <section className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3f5f] flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <h2 className="text-white font-semibold">About & Description</h2>
              </div>
              <div className="p-5 space-y-5">
                {/* Headline */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Headline</label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3a5070] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="A short tagline for your group"
                  />
                </div>

                {/* Summary with Toolbar */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Summary</label>
                  <div className="border border-[#3a5070] rounded-lg overflow-hidden focus-within:border-cyan-500 transition-colors">
                    {/* Markdown Toolbar */}
                    <div className="flex items-center gap-1 px-3 py-2 bg-[#1b2838] border-b border-[#3a5070]">
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a3f5f] rounded transition-colors">
                        <Bold size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a3f5f] rounded transition-colors">
                        <Italic size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a3f5f] rounded transition-colors">
                        <LinkIcon size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a3f5f] rounded transition-colors">
                        <List size={16} />
                      </button>
                    </div>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 bg-[#2a3f5f] text-white placeholder-gray-500 focus:outline-none resize-none"
                      placeholder="Write a detailed description of your group..."
                    />
                  </div>
                  <p className="text-right text-gray-500 text-xs mt-2">Markdown supported</p>
                </div>
              </div>
            </section>

            {/* Group Visibility Section */}
            <section className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3f5f] flex items-center gap-3">
                <Globe size={18} className="text-cyan-400" />
                <h2 className="text-white font-semibold">Group Visibility</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {visibilityOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.visibilidad === option.id;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVisibilityChange(option.id)}
                        className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? option.color === 'cyan'
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : option.color === 'yellow'
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-gray-500 bg-gray-500/10'
                            : 'border-[#3a5070] bg-[#2a3f5f] hover:border-[#4a6080]'
                        }`}
                      >
                        {/* Radio indicator */}
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? option.color === 'cyan'
                              ? 'border-cyan-500 bg-cyan-500'
                              : option.color === 'yellow'
                              ? 'border-yellow-500 bg-yellow-500'
                              : 'border-gray-500 bg-gray-500'
                            : 'border-gray-500'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>

                        <Icon size={24} className={`mb-3 ${
                          isSelected
                            ? option.color === 'cyan'
                              ? 'text-cyan-400'
                              : option.color === 'yellow'
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                            : 'text-gray-400'
                        }`} />
                        <h3 className="text-white font-semibold mb-1">{option.label}</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-[#2a3f5f] text-center text-gray-500 text-xs">
            © 2026 Community Hub. All rights reserved.
          </div>
        </main>
      </div>
    </div>
  );
};

export default GroupAdminPage;
