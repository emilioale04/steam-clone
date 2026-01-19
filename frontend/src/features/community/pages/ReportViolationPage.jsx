import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Flag,
  X,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Send,
  Shield,
  CheckCircle
} from 'lucide-react';

// ============================================================================
// MOCK DATA - Datos de ejemplo para el objeto reportado
// ============================================================================
const generateMockReportTarget = (targetId, type, authorName, groupName) => ({
  id: targetId,
  type: type || 'comment',
  author: authorName || 'User123',
  group: groupName || 'RPG Makers',
  preview: 'Best strategies for the upcoming raid event?',
  created_at: '2 hours ago'
});

const reportReasons = [
  {
    id: 'harassment',
    title: 'Harassment or Bullying',
    description: 'Insults, threats, or aggressive behavior towards others.'
  },
  {
    id: 'spam',
    title: 'Spam or Advertising',
    description: 'Repetitive messages, promotional links, or bots.'
  },
  {
    id: 'explicit',
    title: 'Explicit Content',
    description: 'Nudity, graphic violence, or other NSFW material.'
  },
  {
    id: 'hate',
    title: 'Hate Speech',
    description: 'Slurs, symbols of hate, or discriminatory language.'
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Any violation not listed above.'
  }
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const RadioOption = ({ reason, isSelected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(reason.id)}
    className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all text-left ${
      isSelected
        ? 'bg-cyan-600/10 border-cyan-500'
        : 'bg-[#1e2837] border-[#2a3f5f] hover:border-gray-500'
    }`}
  >
    {/* Radio Circle */}
    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
      isSelected
        ? 'border-cyan-500 bg-cyan-500'
        : 'border-gray-500'
    }`}>
      {isSelected && (
        <div className="w-2 h-2 bg-white rounded-full"></div>
      )}
    </div>

    {/* Content */}
    <div>
      <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
        {reason.title}
      </p>
      <p className="text-gray-500 text-sm mt-0.5">
        {reason.description}
      </p>
    </div>
  </button>
);

const CommunityGuidelinesCard = () => (
  <div className="bg-gradient-to-br from-[#1e2837] to-[#1a2535] rounded-lg border border-[#2a3f5f] p-5">
    {/* Icon */}
    <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
      <Shield size={20} className="text-cyan-400" />
    </div>

    <h3 className="text-lg font-semibold text-white mb-3">
      Community Guidelines
    </h3>
    
    <p className="text-gray-400 text-sm mb-4">
      We want this group to be a safe place for everyone. Please make sure your report aligns with our community standards.
    </p>

    {/* Warning Box */}
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-300 text-xs">
          False reporting may result in action against your account. Please review the Community Guidelines before submitting.
        </p>
      </div>
    </div>

    {/* Link */}
    <a 
      href="#"
      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1 transition-colors"
    >
      Read full guidelines
      <ExternalLink size={14} />
    </a>
  </div>
);

const NeedHelpCard = () => (
  <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] p-5 mt-4">
    <div className="flex items-start gap-3">
      <HelpCircle size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-white font-medium mb-2">Need help?</h4>
        <p className="text-gray-500 text-sm">
          If you are in immediate danger, please contact your local authorities. This reporting tool is for community moderation purposes only.
        </p>
      </div>
    </div>
  </div>
);

const SuccessModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-[#1e2837] rounded-lg border border-[#2a3f5f] p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        Report Submitted
      </h3>
      <p className="text-gray-400 mb-6">
        Thank you. Our moderators will review this report and take appropriate action if necessary.
      </p>
      <button
        onClick={onClose}
        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors"
      >
        Continue
      </button>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ReportViolationPage = () => {
  const { targetId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Obtener parámetros de la URL para contexto
  const targetType = searchParams.get('type') || 'comment';
  const authorName = searchParams.get('author') || 'User123';
  const groupName = searchParams.get('group') || 'RPG Makers';

  // Estados
  const [reportTarget, setReportTarget] = useState(null);
  const [selectedReason, setSelectedReason] = useState('harassment');
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const maxCommentLength = 500;

  // ========================================================================
  // CARGA DE DATOS (Híbrida: Real → Mock)
  // ========================================================================
  useEffect(() => {
    const fetchReportTarget = async () => {
      setIsLoading(true);

      try {
        // Intentar cargar datos reales del objetivo
        const response = await fetch(
          `http://localhost:3000/api/community/reports/target/${targetId}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Error al cargar datos del objetivo');
        }

        const data = await response.json();
        setReportTarget(data.data || data);
        console.log('✅ Datos reales del objetivo cargados');

      } catch (err) {
        console.warn('⚠️ Usando datos mock para el reporte:', err.message);
        setReportTarget(generateMockReportTarget(targetId, targetType, authorName, groupName));
      } finally {
        setIsLoading(false);
      }
    };

    if (targetId) {
      fetchReportTarget();
    }
  }, [targetId, targetType, authorName, groupName]);

  // ========================================================================
  // HANDLERS
  // ========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) return;

    setIsSubmitting(true);

    try {
      // Intentar enviar reporte real
      const response = await fetch(
        'http://localhost:3000/api/community/reports',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            target_id: targetId,
            target_type: reportTarget?.type || 'comment',
            reason: selectedReason,
            description: additionalComments
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error al enviar reporte');
      }

      console.log('✅ Reporte enviado exitosamente');

    } catch (err) {
      console.warn('⚠️ Simulando envío de reporte:', err.message);
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate(-1);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#171a21] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171a21] flex items-center justify-center p-4">
      {/* Success Modal */}
      {showSuccess && <SuccessModal onClose={handleSuccessClose} />}

      {/* Main Container (Modal-style) */}
      <div className="bg-[#1b2838] rounded-xl border border-[#2a3f5f] w-full max-w-4xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3f5f]">
          <div className="flex items-center gap-3">
            <Flag size={20} className="text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Report Violation</h1>
              <p className="text-gray-400 text-sm">
                You are reporting a {reportTarget?.type} by{' '}
                <span className="text-white font-medium">{reportTarget?.author}</span>
                {' '}in the group{' '}
                <span className="text-cyan-400">'{reportTarget?.group}'</span>.
              </p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a3f5f] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Column - Form */}
          <div className="flex-1 p-6">
            <form onSubmit={handleSubmit}>
              {/* Reason Selection */}
              <div className="mb-6">
                <h2 className="text-white font-semibold mb-4">
                  Select a reason for reporting
                </h2>
                <div className="space-y-3">
                  {reportReasons.map((reason) => (
                    <RadioOption
                      key={reason.id}
                      reason={reason}
                      isSelected={selectedReason === reason.id}
                      onSelect={setSelectedReason}
                    />
                  ))}
                </div>
              </div>

              {/* Additional Comments */}
              <div className="mb-6">
                <h2 className="text-white font-semibold mb-3">
                  Additional Comments (Optional)
                </h2>
                <div className="relative">
                  <textarea
                    value={additionalComments}
                    onChange={(e) => {
                      if (e.target.value.length <= maxCommentLength) {
                        setAdditionalComments(e.target.value);
                      }
                    }}
                    placeholder="Provide context to help moderators understand why this violates guidelines..."
                    rows={5}
                    className="w-full bg-[#1e2837] border border-[#2a3f5f] rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute bottom-3 right-3 text-gray-500 text-sm">
                    {additionalComments.length}/{maxCommentLength} characters
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full lg:w-80 p-6 lg:border-l border-t lg:border-t-0 border-[#2a3f5f] bg-[#171a21]/50">
            <CommunityGuidelinesCard />
            <NeedHelpCard />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-[#2a3f5f] bg-[#171a21]/30">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 text-gray-300 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                Submit Report
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportViolationPage;
