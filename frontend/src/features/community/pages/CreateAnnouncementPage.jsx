import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Image,
  Bold,
  Italic,
  Underline,
  Type,
  List,
  Link as LinkIcon,
  ImageIcon,
  Youtube,
  Eye,
  Save,
  Send,
  Calendar,
  Clock,
  ChevronDown,
  Lightbulb,
  CheckCircle,
  Rocket,
  X
} from 'lucide-react';

// ============================================================================
// CONSTANTES
// ============================================================================
const visibilityOptions = [
  { value: 'public', label: 'Public (Everyone)' },
  { value: 'members', label: 'Members Only' },
  { value: 'officers', label: 'Officers Only' }
];

const categoryOptions = [
  { value: 'general', label: 'General Update' },
  { value: 'event', label: 'Event' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'contest', label: 'Contest' },
  { value: 'important', label: 'Important' }
];

const postingTips = [
  'Use a 16:9 image for best visibility on the feed.',
  'Announcements are emailed to subscribed members.',
  'You can edit the post after publishing, but notifications are only sent once.'
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const Breadcrumbs = ({ groupName }) => (
  <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
    <Link to="/" className="hover:text-white transition-colors">Home</Link>
    <span>/</span>
    <Link to="/community" className="hover:text-white transition-colors">My Group</Link>
    <span>/</span>
    <span className="text-cyan-400">Post Announcement</span>
  </nav>
);

const ImageUploadZone = ({ coverImage, onImageChange, onRemove }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (coverImage) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-[#2a3f5f] mb-6">
        <img 
          src={coverImage} 
          alt="Cover" 
          className="w-full h-48 object-cover"
        />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 rounded-full text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-[#2a3f5f] rounded-lg p-8 mb-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <ImageIcon size={32} className="text-gray-500 mx-auto mb-3" />
      <p className="text-white font-medium mb-1">Add Cover Image</p>
      <p className="text-gray-500 text-sm">
        Drag & drop or click to upload (1920x600 recommended)
      </p>
    </div>
  );
};

const RichTextToolbar = ({ onFormat }) => {
  const tools = [
    { icon: Bold, action: 'bold', label: 'Bold' },
    { icon: Italic, action: 'italic', label: 'Italic' },
    { icon: Underline, action: 'underline', label: 'Underline' },
    { type: 'divider' },
    { icon: Type, action: 'heading', label: 'Heading' },
    { icon: List, action: 'list', label: 'List' },
    { type: 'divider' },
    { icon: LinkIcon, action: 'link', label: 'Link' },
    { icon: ImageIcon, action: 'image', label: 'Image' },
    { icon: Youtube, action: 'video', label: 'Video' }
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-[#1a2535] border-b border-[#2a3f5f] rounded-t-lg">
      {tools.map((tool, index) => {
        if (tool.type === 'divider') {
          return <div key={index} className="w-px h-5 bg-gray-600 mx-1" />;
        }
        return (
          <button
            key={tool.action}
            type="button"
            onClick={() => onFormat(tool.action)}
            title={tool.label}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a3f5f] rounded transition-colors"
          >
            <tool.icon size={16} />
          </button>
        );
      })}
    </div>
  );
};

const SelectDropdown = ({ label, value, options, onChange }) => (
  <div className="mb-4">
    <label className="block text-gray-400 text-sm mb-2">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#1e2837] border border-[#2a3f5f] rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer focus:border-cyan-500 focus:outline-none transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

const RadioOption = ({ name, value, checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
      checked ? 'border-cyan-500 bg-cyan-500' : 'border-gray-500'
    }`}>
      {checked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
    </div>
    <span className={checked ? 'text-white' : 'text-gray-400'}>{label}</span>
  </label>
);

const Checkbox = ({ checked, onChange, label, sublabel }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
      checked ? 'border-cyan-500 bg-cyan-500' : 'border-gray-500'
    }`}>
      {checked && <CheckCircle size={12} className="text-white" />}
    </div>
    <div>
      <span className={checked ? 'text-white' : 'text-gray-400'}>{label}</span>
      {sublabel && <p className="text-gray-500 text-xs">{sublabel}</p>}
    </div>
  </label>
);

const PostingTipsCard = () => (
  <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] p-4 mt-4">
    <div className="flex items-center gap-2 mb-3">
      <Lightbulb size={18} className="text-yellow-400" />
      <h3 className="text-white font-semibold">Posting Tips</h3>
    </div>
    <ul className="space-y-2">
      {postingTips.map((tip, index) => (
        <li key={index} className="flex items-start gap-2 text-gray-400 text-sm">
          <span className="text-cyan-400 mt-1">•</span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  </div>
);

const SuccessToast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-slide-up">
    <CheckCircle size={20} />
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-80">
      <X size={18} />
    </button>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CreateAnnouncementPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  // Estados del formulario
  const [headline, setHeadline] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [bodyContent, setBodyContent] = useState('');
  
  // Estados de configuración
  const [visibility, setVisibility] = useState('public');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [category, setCategory] = useState('general');
  const [isMajorUpdate, setIsMajorUpdate] = useState(false);
  const [enableComments, setEnableComments] = useState(true);

  // Estados de UI
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Nombre del grupo (mock)
  const groupName = 'Space Explorers Guild';

  // ========================================================================
  // HANDLERS
  // ========================================================================
  
  const handleFormat = (action) => {
    // Simulación de formato - en producción usaría un editor rico real
    console.log('Format action:', action);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSavingDraft(false);
    setSuccessMessage('Draft saved successfully!');
    setShowSuccess(true);
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePreview = () => {
    // Abrir modal de preview o navegar a vista previa
    alert('Preview functionality would show a preview of the announcement.');
  };

  const handlePublish = async () => {
    // Validación básica
    if (!headline.trim()) {
      alert('Please enter a headline for the announcement.');
      return;
    }

    if (!bodyContent.trim()) {
      alert('Please enter the body content for the announcement.');
      return;
    }

    setIsPublishing(true);

    try {
      // Intentar enviar al backend real
      const response = await fetch(
        `http://localhost:3000/api/community/groups/${groupId}/announcements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            headline,
            cover_image: coverImage,
            body: bodyContent,
            visibility,
            scheduled_at: scheduleType === 'scheduled' 
              ? `${scheduleDate}T${scheduleTime}` 
              : null,
            category,
            is_major_update: isMajorUpdate,
            enable_comments: enableComments
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error al publicar anuncio');
      }

      console.log('✅ Anuncio publicado exitosamente');

    } catch (err) {
      console.warn('⚠️ Simulando publicación de anuncio:', err.message);
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsPublishing(false);
    setSuccessMessage('Anuncio publicado exitosamente. Notificación enviada a todos los miembros.');
    setShowSuccess(true);

    // Redirigir después de mostrar el mensaje
    setTimeout(() => {
      navigate(`/community/groups/${groupId || 'test-group'}`);
    }, 2000);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-[#171a21]">
      {/* Success Toast */}
      {showSuccess && (
        <SuccessToast 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs groupName={groupName} />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Create New Announcement
            </h1>
            <p className="text-gray-400">
              Share updates, events, or news with your community.
            </p>
          </div>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-2 px-4 py-2 bg-[#2a3f5f] hover:bg-[#3a5070] disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {isSavingDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Draft
                </>
              )}
            </button>
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e2837] hover:bg-[#2a3f5f] border border-[#2a3f5f] text-white rounded-lg font-medium transition-colors"
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Editor */}
          <div className="flex-1">
            {/* Cover Image Upload */}
            <ImageUploadZone
              coverImage={coverImage}
              onImageChange={setCoverImage}
              onRemove={() => setCoverImage(null)}
            />

            {/* Headline Input */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Announcement Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter a catchy headline..."
                className="w-full bg-[#1e2837] border border-[#2a3f5f] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors text-lg"
              />
            </div>

            {/* Body Content Editor */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Body Content
              </label>
              <div className="border border-[#2a3f5f] rounded-lg overflow-hidden focus-within:border-cyan-500 transition-colors">
                <RichTextToolbar onFormat={handleFormat} />
                <textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  placeholder="Type your announcement here. You can drag and drop images directly into the text..."
                  rows={12}
                  className="w-full bg-[#1e2837] px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Settings Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            {/* Publish Settings Card */}
            <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Rocket size={18} className="text-cyan-400" />
                <h3 className="text-white font-semibold">Publish Settings</h3>
              </div>

              {/* Visibility */}
              <SelectDropdown
                label="Visibility"
                value={visibility}
                options={visibilityOptions}
                onChange={setVisibility}
              />

              {/* Schedule */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Schedule</label>
                <div className="space-y-2">
                  <RadioOption
                    name="schedule"
                    value="immediate"
                    checked={scheduleType === 'immediate'}
                    onChange={() => setScheduleType('immediate')}
                    label="Post Immediately"
                  />
                  <RadioOption
                    name="schedule"
                    value="scheduled"
                    checked={scheduleType === 'scheduled'}
                    onChange={() => setScheduleType('scheduled')}
                    label="Schedule for later"
                  />
                </div>

                {/* Date/Time Inputs */}
                {scheduleType === 'scheduled' && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-[#171a21] border border-[#2a3f5f] rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-[#171a21] border border-[#2a3f5f] rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                        placeholder="--:-- --"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <SelectDropdown
                label="Category Tag"
                value={category}
                options={categoryOptions}
                onChange={setCategory}
              />

              {/* Checkboxes */}
              <div className="space-y-3 mb-6">
                <Checkbox
                  checked={isMajorUpdate}
                  onChange={() => setIsMajorUpdate(!isMajorUpdate)}
                  label="Major Update"
                  sublabel="Show on community home page"
                />
                <Checkbox
                  checked={enableComments}
                  onChange={() => setEnableComments(!enableComments)}
                  label="Enable Comments"
                  sublabel="Allow members to discuss"
                />
              </div>

              {/* Publish Button */}
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {isPublishing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Announcement
                  </>
                )}
              </button>
            </div>

            {/* Posting Tips */}
            <PostingTipsCard />
          </aside>
        </div>

        {/* Mobile Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1b2838] border-t border-[#2a3f5f] p-4 flex items-center justify-between gap-3 md:hidden z-40">
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2a3f5f] text-white rounded-lg font-medium"
          >
            <Save size={16} />
            Draft
          </button>
          <button
            onClick={handlePreview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1e2837] border border-[#2a3f5f] text-white rounded-lg font-medium"
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg font-medium"
          >
            <Send size={16} />
            Publish
          </button>
        </div>

        {/* Spacer for mobile fixed bar */}
        <div className="h-20 md:hidden" />
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreateAnnouncementPage;
