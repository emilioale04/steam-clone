import { useState, useEffect } from 'react'
import { Search, User, ShoppingCart, Gamepad2, Star } from 'lucide-react'

const API_URL = 'http://localhost:3000/api';

function App() {
  const [featuredGame, setFeaturedGame] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const calculateDiscountedPrice = (price, discount) => {
    if (discount === 0) return price;
    return (price - (price * discount / 100)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Header */}
      <header className="bg-[#171a21] border-b border-[#2a475e]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Gamepad2 className="text-white" size={32} />
                <span className="text-white text-2xl font-bold">Steam Clone</span>
              </div>
              <nav className="hidden md:flex gap-6 text-gray-300">
                <a href="#" className="hover:text-white transition">Tienda</a>
                <a href="#" className="hover:text-white transition">Comunidad</a>
                <a href="#" className="hover:text-white transition">Biblioteca</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="hidden md:flex items-center bg-[#316282] rounded px-3 py-2">
                <Search className="text-gray-300" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar juegos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white ml-2 w-48"
                />
              </form>
              <ShoppingCart className="text-white cursor-pointer hover:text-blue-400 transition" size={24} />
              <User className="text-white cursor-pointer hover:text-blue-400 transition" size={24} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Game */}
        {featuredGame && (
          <div className="mb-12 relative rounded-lg overflow-hidden group cursor-pointer">
            <img 
              src={featuredGame.image} 
              alt={featuredGame.title}
              className="w-full h-100 object-cover brightness-75 group-hover:brightness-90 transition"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-8">
              <h2 className="text-white text-4xl font-bold mb-2">{featuredGame.title}</h2>
              <p className="text-gray-300 mb-4">{featuredGame.description}</p>
              <div className="flex items-center gap-4">
                {featuredGame.discount > 0 && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded font-bold text-lg">
                    -{featuredGame.discount}%
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {featuredGame.discount > 0 && (
                    <span className="text-gray-400 line-through text-lg">
                      ${featuredGame.price}
                    </span>
                  )}
                  <span className="text-white text-2xl font-bold">
                    ${calculateDiscountedPrice(featuredGame.price, featuredGame.discount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Games Grid */}
        <div>
          <h3 className="text-white text-2xl font-bold mb-6">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Juegos Destacados'}
          </h3>
          {games.length === 0 ? (
            <div className="text-gray-400 text-center py-12">
              No se encontraron juegos
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <div 
                  key={game.id}
                  className="bg-[#16202d] rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="h-48 bg-linear-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                    <Gamepad2 className="text-white/30" size={64} />
                  </div>
                  <div className="p-4">
                    <h4 className="text-white font-bold text-lg mb-1">{game.title}</h4>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{game.description}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 text-xs">{game.genre}</span>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star size={16} fill="currentColor" />
                        <span className="text-sm">{game.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {game.discount > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                            -{game.discount}%
                          </span>
                          <div className="flex flex-col">
                            <span className="text-gray-400 line-through text-xs">${game.price}</span>
                            <span className="text-green-400 font-bold">
                              ${calculateDiscountedPrice(game.price, game.discount)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-green-400 font-bold">
                          {game.price === 0 ? "Gratis" : `$${game.price}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#171a21] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© 2026 Steam Clone - Proyecto de ejemplo</p>
        </div>
      </footer>
    </div>
  )
}

export default App
