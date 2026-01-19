import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Construction } from 'lucide-react';

export const ChatPage = () => {
  return (
    <div className="min-h-screen bg-[#1b2838] flex flex-col">
      {/* Header */}
      <header className="bg-[#171a21] border-b border-[#2a3f5f] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <h1 className="text-white font-semibold text-xl">Chat</h1>
          </div>
          <Link 
            to="/community" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Volver a Comunidad</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 bg-[#2a3f5f] rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction size={48} className="text-yellow-500" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">
            Módulo de Chat en Construcción
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Estamos trabajando en esta funcionalidad. Pronto podrás chatear con tus amigos y grupos en tiempo real.
          </p>
          <Link 
            to="/community"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            Explorar Comunidad
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
