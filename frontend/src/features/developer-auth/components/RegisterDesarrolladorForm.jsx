/**
 * Formulario de Registro para Desarrolladores (Steamworks)
 * Cumple con RF-001: Registro con datos personales, bancarios y aceptación de términos
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

export const RegisterDesarrolladorForm = ({ onSubmit, error }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Datos de cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Datos personales (RF-001)
  const [nombreLegal, setNombreLegal] = useState('');
  const [pais, setPais] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  
  // Información bancaria (RF-001)
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titularCuenta, setTitularCuenta] = useState('');
  
  // Información fiscal
  const [nifCif, setNifCif] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  
  // Términos
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  const [formError, setFormError] = useState('');

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      setFormError('Todos los campos son requeridos');
      return false;
    }
    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return false;
    }
    setFormError('');
    return true;
  };

  const validateStep2 = () => {
    if (!nombreLegal || !pais) {
      setFormError('Nombre legal y país son requeridos');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setFormError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!aceptoTerminos) {
      setFormError('Debe aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        email,
        password,
        nombre_legal: nombreLegal,
        pais,
        telefono,
        direccion,
        banco,
        numero_cuenta: numeroCuenta,
        titular_cuenta: titularCuenta,
        nif_cif: nifCif,
        razon_social: razonSocial,
        acepto_terminos: aceptoTerminos
      });
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || formError;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header Steamworks */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-[#66c0f4]">Steam</span>works
          </h1>
          <p className="text-gray-400 text-sm">
            Registro de Desarrollador
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s
                      ? 'bg-[#66c0f4] text-white'
                      : 'bg-[#2a3f5f] text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-1 ml-2 ${
                      step > s ? 'bg-[#66c0f4]' : 'bg-[#2a3f5f]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-[#1e2a38] rounded-lg shadow-xl p-8 border border-[#2a3f5f]">
          <h2 className="text-lg font-semibold text-white mb-4">
            {step === 1 && 'Paso 1: Datos de Cuenta'}
            {step === 2 && 'Paso 2: Información Personal'}
            {step === 3 && 'Paso 3: Información Bancaria y Términos'}
          </h2>

          {displayError && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
              {displayError}
            </div>
          )}

          {/* Step 1: Cuenta */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Contraseña * (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {/* Step 2: Información Personal */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Nombre Legal Completo *
                </label>
                <input
                  type="text"
                  value={nombreLegal}
                  onChange={(e) => setNombreLegal(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="Juan Pérez García"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  País *
                </label>
                <select
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white focus:outline-none focus:border-[#66c0f4]"
                >
                  <option value="">Seleccionar país</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="México">México</option>
                  <option value="España">España</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Chile">Chile</option>
                  <option value="Perú">Perú</option>
                  <option value="Estados Unidos">Estados Unidos</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="+593 99 999 9999"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Dirección
                </label>
                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4] resize-none"
                  rows={2}
                  placeholder="Calle, ciudad, código postal"
                />
              </div>
            </div>
          )}

          {/* Step 3: Información Bancaria y Términos */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-[#2a3f5f]/50 rounded border border-[#3d5a80]">
                <p className="text-gray-400 text-xs">
                  La información bancaria es requerida para recibir pagos por ventas de tus juegos.
                </p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="Nombre del banco"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="Número de cuenta bancaria"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={titularCuenta}
                  onChange={(e) => setTitularCuenta(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                  placeholder="Nombre del titular"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    NIF/CIF
                  </label>
                  <input
                    type="text"
                    value={nifCif}
                    onChange={(e) => setNifCif(e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                    placeholder="ID fiscal"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full px-4 py-3 bg-[#2a3f5f] border border-[#3d5a80] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#66c0f4]"
                    placeholder="Si aplica"
                  />
                </div>
              </div>

              {/* Términos y Condiciones */}
              <div className="mt-6 p-4 bg-[#16213e] rounded border border-[#3d5a80]">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptoTerminos}
                    onChange={(e) => setAceptoTerminos(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-600 bg-[#2a3f5f] text-[#66c0f4] focus:ring-[#66c0f4]"
                  />
                  <span className="text-gray-300 text-sm">
                    Acepto los{' '}
                    <a href="#" className="text-[#66c0f4] hover:underline">
                      Términos y Condiciones
                    </a>{' '}
                    del Programa de Desarrolladores de Steamworks, incluyendo el
                    Acuerdo de Distribución y las Políticas de Contenido. *
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="mt-6 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-[#2a3f5f] text-gray-300 rounded hover:bg-[#3d5a80] transition-colors"
              >
                Anterior
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !aceptoTerminos}
                className="px-6 py-3 bg-gradient-to-r from-[#4c6ef5] to-[#66c0f4] text-white font-semibold rounded hover:from-[#5c7cfa] hover:to-[#74c8f4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : 'Completar Registro'}
              </button>
            )}
          </div>

          <div className="mt-6 text-center text-gray-400 text-sm">
            ¿Ya tienes cuenta de desarrollador?{' '}
            <Link
              to="/steamworks/login"
              className="text-[#66c0f4] hover:text-[#8ad0f8] font-medium"
            >
              Iniciar Sesión
            </Link>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>© 2026 Steam Clone - Componente Steamworks</p>
          <p className="mt-1">
            <Link to="/" className="text-[#66c0f4] hover:underline">
              Volver a Steam
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
