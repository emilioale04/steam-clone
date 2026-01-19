import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RegisterForm } from '../components';
import { useAuth } from '../../../shared/context/AuthContext';
import { Mail, CheckCircle2, Shield, Gamepad2 } from 'lucide-react';

export const RegisterPage = () => {
  const { register, error, emailVerificationPending, pendingEmail, clearEmailVerificationPending } = useAuth();
  const navigate = useNavigate();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegisterAttempt = (email, password, username) => {
    setTempData({ email, password, username });
    setShowConsentModal(true);
  };

  const confirmRegistration = async () => {
    const { email, password, username } = tempData;
    setLoading(true);
    try {
      const result = await register(email, password, username);
      setShowConsentModal(false);
      if (result.data?.emailVerificationPending) {
        setRegisteredEmail(email);
        setShowVerificationMessage(true);
      }
    } catch (err) {
      setShowConsentModal(false);
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de Verificación de Email
  if (showVerificationMessage || emailVerificationPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2838] to-[#2a475e] flex items-center justify-center p-6 text-white font-sans">
        <div className="bg-[#16202d] border border-blue-500 shadow-2xl rounded-xl p-12 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="text-blue-400 mb-8 flex justify-center">
            <div className="relative">
              <Mail className="w-24 h-24" strokeWidth={1.5} />
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg animate-in zoom-in duration-300 delay-200">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-4 tracking-tight">
            Verifica tu correo
          </h2>
          
          <p className="text-gray-300 mb-3 text-base">
            Hemos enviado un enlace de verificación a:
          </p>
          
          <div className="bg-[#1b2838] border border-[#2a475e] rounded-lg p-4 mb-8">
            <p className="text-blue-400 font-mono font-bold text-base break-all">
              {registeredEmail || pendingEmail}
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8 text-left">
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <p className="text-gray-400 text-xs">
              💡 Si no ves el correo, revisa tu carpeta de spam.
            </p>
          </div>
          
          <Link 
            to="/login" 
            onClick={clearEmailVerificationPending}
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2838] to-[#2a475e] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">

      {/* CONTENEDOR DEL REGISTRO */}
      <div className="w-full max-w-md bg-[#16202d] border border-transparent rounded-xl p-10 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 shadow-lg">
            <Gamepad2 className="text-white" size={32} />
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">
            Crear Cuenta
          </h1>
          <p className="text-gray-400 text-sm">
            Únete a Steam Clone
          </p>
        </div>
        
        {/* Formulario de Registro */}
        <RegisterForm onSubmit={handleRegisterAttempt} error={error} />
        
        <div className="mt-8 pt-6 border-t border-[#2a475e] text-center">
          <p className="text-gray-400 text-sm">
            ¿Ya tienes una cuenta? {' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors font-semibold">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

{/* MODAL DE CONSENTIMIENTO DE PRIVACIDAD */}
{showConsentModal && (
  <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-[#1b2838] border border-[#2a475e] shadow-2xl rounded-lg p-8 max-w-lg w-full animate-in zoom-in-95 duration-300">
      
      {/* Encabezado Directo */}
      <div className="mb-6">
        <h2 className="text-white text-xl font-bold uppercase tracking-tight">Consentimiento de Privacidad</h2>
        <p className="text-blue-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Tratamiento de Datos Personales</p>
      </div>
      
      {/* Cuerpo Objetivo */}
      <div className="text-gray-300 space-y-6 text-sm">
        <p className="text-xs border-l-2 border-blue-500 pl-3">
          Para habilitar las funciones del <strong>Steam Clone (Marketplace)</strong>, procesaremos su información bajo los siguientes criterios:
        </p>

        {/* Lista de Datos y Finalidades */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="text-blue-500 font-mono text-lg">01</div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase">Gestión de Perfil</h4>
              <p className="text-gray-400 text-xs mt-1">Uso de <strong>email y username</strong> para autenticación y envío de comprobantes.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-blue-500 font-mono text-lg">02</div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase">Seguridad Operativa</h4>
              <p className="text-gray-400 text-xs mt-1">Registro de <strong>dirección IP</strong> para prevención de fraude y auditoría de accesos.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-blue-500 font-mono text-lg">03</div>
            <div>
              <h4 className="text-white font-bold text-xs uppercase">Historial Transaccional</h4>
              <p className="text-gray-400 text-xs mt-1">Almacenamiento de <strong>saldos e intercambios</strong> para asegurar la integridad de sus activos.</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded text-[11px] text-gray-400 leading-tight">
          Su información está protegida mediante cifrado y puede ejercer sus derechos de acceso o eliminación en cualquier momento. El consentimiento es obligatorio para operar en la plataforma.
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3 mt-8">
        <button 
          onClick={() => setShowConsentModal(false)} 
          className="px-6 py-2.5 bg-[#2a475e] hover:bg-[#3a5a7e] text-white rounded text-xs font-bold uppercase transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={confirmRegistration} 
          className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#47bfff] to-[#1a44c2] hover:brightness-110 text-white rounded text-xs font-bold uppercase shadow-lg transition-all"
        >
          Aceptar y Crear Cuenta
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};  