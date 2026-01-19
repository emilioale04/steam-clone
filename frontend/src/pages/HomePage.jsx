import { useState, useEffect } from 'react'
import { Search, User, ShoppingCart, Gamepad2, Star, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../shared/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { inventoryService } from '../features/inventory/services/inventoryService';
import NotificationBell from '../shared/components/NotificationBell';

const API_URL = 'http://localhost:3000/api';

export const HomePage = () => {
  const [featuredGame, setFeaturedGame] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuredRes, gamesRes] = await Promise.all([
        fetch(`${API_URL}/featured`),
        fetch(`${API_URL}/games`)
      ]);

      const featuredData = await featuredRes.json();
      const gamesData = await gamesRes.json();

      if (featuredData.success) {
        setFeaturedGame(featuredData.game);
      }
      if (gamesData.success) {
        setGames(gamesData.games);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setGames(data.games);
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleBuyGame = async (gameId, gameTitle) => {
    if (!user) {
      alert("Por favor, inicia sesión para comprar juegos.");
      return;
    }

    try {
      const result = await inventoryService.buyGame(user.id, gameId);
      
      if (result.success) {
        alert(`¡Éxito! "${gameTitle}" ha sido agregado a tu biblioteca.`);
      } else {
        alert(`Información: ${result.message}`);
      }
    } catch (error) {
      console.error("Error buying game:", error);
      alert("Hubo un error al procesar la compra.");
    }
  };

  const calculateDiscountedPrice = (price, discount) => {
    if (discount === 0) return price;
    return (price - (price * discount / 100)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1b2838] to-[#2a475e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <div className="text-white text-xl">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Header */}
      <header className="bg-[#171a21] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Gamepad2 className="text-white" size={24} />
              </div>
              <span className="text-white text-xl font-bold hidden sm:block">Steam Clone</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">Tienda</a>
              <Link to="/marketplace" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">Marketplace</Link>
              <Link to="/inventory" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">Biblioteca</Link>
              <Link to="/community" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">Grupos y Comunidad</Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar juegos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#316282] text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all w-56"
                />
              </form>
              
              {/* Notification Bell */}
              <NotificationBell />
              
              <button className="relative p-2 hover:bg-[#2a475e] rounded-lg transition-colors">
                <ShoppingCart className="text-white" size={22} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">0</span>
              </button>

              <Link 
                to="/profile" 
                className="flex items-center gap-2 bg-[#2a475e] px-3 py-2 rounded-lg hover:bg-[#3a5a7e] transition-colors"
                title="Ver perfil"
              >
                <User className="text-white" size={20} />
                <span className="text-white text-sm max-w-[120px] truncate">{user?.email}</span>
              </Link>

              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                title="Cerrar sesión"
              >
                <LogOut className="text-gray-300 group-hover:text-red-400" size={22} />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[#2a475e]">
              <form onSubmit={handleSearch} className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar juegos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#316282] text-white pl-10 pr-4 py-2 rounded-lg outline-none w-full"
                />
              </form>
              <nav className="flex flex-col gap-3 mb-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors py-2">Tienda</a>
                <Link to="/marketplace" className="text-gray-300 hover:text-white transition-colors py-2">Marketplace</Link>
                <Link to="/inventory" className="text-gray-300 hover:text-white transition-colors py-2">Biblioteca</Link>
                <Link to="/community" className="text-gray-300 hover:text-white transition-colors py-2">Grupos y Comunidad</Link>
              </nav>
              <div className="flex items-center justify-between pt-3 border-t border-[#2a475e]">
                <Link to="/profile" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <User className="text-white" size={20} />
                  <span className="text-white text-sm">{user?.email}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300"
                >
                  <LogOut size={22} />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Featured Game */}
      {featuredGame && (
        <section className="relative bg-gradient-to-br from-[#1b2838] via-[#2a475e] to-[#1b2838] overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
                <Star className="fill-white" size={16} />
                JUEGO DESTACADO
              </div>
              <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">{featuredGame.title}</h1>
              <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">{featuredGame.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center gap-2 bg-[#1b2838]/80 px-4 py-2 rounded-lg">
                  <Star className="fill-yellow-400 text-yellow-400" size={20} />
                  <span className="text-white font-semibold">{featuredGame.rating}</span>
                  <span className="text-gray-400 text-sm">Rating</span>
                </div>
                <div className="bg-[#1b2838]/80 px-4 py-2 rounded-lg">
                  <span className="text-blue-400 font-semibold">{featuredGame.genre}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-8">
                {featuredGame.discount > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                      -{featuredGame.discount}%
                    </span>
                    <div className="flex flex-col">
                      <span className="text-gray-400 line-through text-sm">${featuredGame.price}</span>
                      <span className="text-green-400 text-3xl font-bold">
                        ${calculateDiscountedPrice(featuredGame.price, featuredGame.discount)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-white text-3xl font-bold">${featuredGame.price}</span>
                )}
              </div>

              <button 
                onClick={() => handleBuyGame(featuredGame.id, featuredGame.title)}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
              >
                <ShoppingCart size={20} />
                {featuredGame.price === 0 ? "Jugar Gratis" : "Comprar Ahora"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Games Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-white text-2xl sm:text-3xl font-bold">Todos los Juegos</h2>
          <span className="text-gray-400 text-sm">{games.length} juegos disponibles</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="group bg-[#16202d] rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-500 shadow-lg hover:shadow-2xl"
            >
              <div className="relative h-48 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <Gamepad2 className="text-white/30 group-hover:text-white/40 transition-colors relative z-10" size={64} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center gap-2">
                    <Star className="fill-yellow-400 text-yellow-400" size={14} />
                    <span className="text-white text-sm font-semibold">{game.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 truncate group-hover:text-blue-400 transition-colors">{game.title}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gray-400 text-sm bg-[#1b2838] px-2 py-1 rounded">{game.genre}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#2a475e]">
                  <div className="flex items-center gap-2">
                    {game.discount > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-green-600 text-white px-2 py-1 text-xs font-bold rounded">
                          -{game.discount}%
                        </span>
                        <div className="flex flex-col">
                          <span className="text-gray-500 line-through text-xs">${game.price}</span>
                          <span className="text-green-400 font-bold text-lg">
                            ${calculateDiscountedPrice(game.price, game.discount)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white font-bold text-lg">${game.price}</span>
                    )}
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyGame(game.id, game.title);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors group-hover:scale-110 transform duration-200"
                  >
                    <ShoppingCart className="text-white" size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
