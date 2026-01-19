import { useState } from 'react';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export const RegisterForm = ({ onSubmit, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email, password, username);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm leading-relaxed">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-gray-300 text-sm font-medium">
          Nombre de Usuario
        </label>
        <div className="relative group">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text"
            placeholder="Ej: GordonFreeman"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-[#316282] border border-transparent rounded-lg pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-gray-300 text-sm font-medium">
          Correo Electrónico
        </label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="email"
            placeholder="nombre@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#316282] border border-transparent rounded-lg pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-gray-300 text-sm font-medium">
          Contraseña
        </label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
            className="w-full bg-[#316282] border border-transparent rounded-lg pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'Cargando...' : 'Continuar'}
      </button>
    </form>
  );
};