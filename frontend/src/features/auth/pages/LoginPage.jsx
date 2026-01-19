import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LoginForm } from '../components';
import { useAuth } from '../../../shared/context/AuthContext';
import { authService } from '../services/authService';
import { CheckCircle2, AlertTriangle, Gamepad2, Mail } from 'lucide-react';

export const LoginPage = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifiedMessage, setVerifiedMessage] = useState(false);
  const [emailNotVerifiedError, setEmailNotVerifiedError] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [geoBlockedError, setGeoBlockedError] = useState(false);

  useEffect(() => {
    // Check if user just verified their email
    if (searchParams.get('verified') === 'true') {
      setVerifiedMessage(true);
    }
  }, [searchParams]);

  const handleLogin = async (email, password) => {
    try {
      setEmailNotVerifiedError(false);
      setResendSuccess(false);
      setUnverifiedEmail('');
      setGeoBlockedError(false);
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Check if the error is about email not verified
      if (err.message.includes('verificar') || err.message.includes('EMAIL_NOT_VERIFIED') || err.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerifiedError(true);
        setUnverifiedEmail(email);
      } else if (err.code === 'GEO_BLOCKED') {
        setGeoBlockedError(true);
      }
      console.error('Login failed:', err);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await authService.resendVerificationEmail(unverifiedEmail);
      setResendSuccess(true);
    } catch (err) {
      console.error('Failed to resend verification:', err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b2838] to-[#2a475e] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Success Message - Email Verified */}
        {verifiedMessage && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500 shadow-lg">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-base">¡Correo verificado!</p>
              <p className="text-sm text-green-300/90 mt-1">
                Tu correo ha sido verificado correctamente. Ya puedes iniciar sesión.
              </p>
            </div>
          </div>
        )}
        
        {/* Warning Message - Email Not Verified */}
        {emailNotVerifiedError && (
          <div className="bg-orange-500/10 border border-orange-500/50 text-orange-400 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-base">Correo no verificado</p>
                <p className="text-sm text-orange-300/90 mt-1">
                  Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación antes de iniciar sesión.
                </p>
              </div>
            </div>
            
            {resendSuccess ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2 mt-3">
                <Mail className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm font-medium">
                  Correo de verificación reenviado. Revisa tu bandeja de entrada.
                </p>
              </div>
            ) : (
              <button 
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? 'Enviando...' : '¿No recibiste el correo? Reenviar verificación'}
              </button>
            )}
          </div>
        )}
        
        {/* Warning Message - Geo Blocked */}
        {geoBlockedError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-base">Acceso restringido</p>
              <p className="text-sm text-red-300/90 mt-1">
                El acceso desde tu país no está permitido.
              </p>
            </div>
          </div>
        )}

        {/* Login Form Container */}
        <div className="bg-[#16202d] border border-transparent rounded-xl p-10 shadow-2xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 shadow-lg">
              <Gamepad2 className="text-white" size={32} />
            </div>
            <h1 className="text-white text-3xl font-bold mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-gray-400 text-sm">
              Accede a Steam Clone
            </p>
          </div>

          {/* Login Form */}
          <LoginForm 
            onSubmit={handleLogin} 
            error={emailNotVerifiedError || geoBlockedError ? null : error} 
          />

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <Link 
              to="/forgot-password" 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium underline underline-offset-2 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-[#2a475e] text-center">
            <p className="text-gray-400 text-sm">
              ¿No tienes una cuenta? {' '}
              <Link 
                to="/register" 
                className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors font-semibold"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};