import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Repeat, Search, DollarSign, Filter, Package, X, ArrowLeft } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../../../shared/context/AuthContext';
import { useInventory } from '../hooks/useInventory';

export const MarketplacePage = () => {
  const { user } = useAuth();
  const { inventory } = useInventory(user?.id);

  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'trading'
  const [marketItems, setMarketItems] = useState([]);
  const [tradeOffers, setTradeOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Venta
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedSellItem, setSelectedSellItem] = useState(null);
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const marketRes = await inventoryService.getMarketListings();
      const tradesRes = await inventoryService.getActiveTrades();
      
      if (marketRes.success) setMarketItems(marketRes.listings);
      if (tradesRes.success) setTradeOffers(tradesRes.trades);
    } catch (error) {
      console.error("Error fetching marketplace data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyItem = (itemName, price) => {
    alert(`Has comprado "${itemName}" por $${price}. (Mock)`);
  };

  const handleTradeOffer = (offerId) => {
    alert(`Has enviado una propuesta para el intercambio #${offerId}. (Mock)`);
  };

  const handleCancelListing = async (listingId) => {
    if(!confirm("¿Estás seguro de que quieres cancelar esta venta? El item volverá a tu inventario.")) return;

    try {
      await inventoryService.cancelListing(listingId);
      // Eliminar de la lista local
      setMarketItems(prevItems => prevItems.filter(i => i.id !== listingId));
      alert("Venta cancelada exitosamente.");
    } catch (error) {
      console.error("Error cancelling listing:", error);
      alert("Error al cancelar la venta: " + error.message);
    }
  };

  const handleSellItem = () => {
    setShowSellModal(true);
    setSelectedSellItem(null);
    setSellPrice('');
  };

  const handleConfirmSell = async () => {
    if (!selectedSellItem || !sellPrice) {
      alert("Por favor selecciona un item y define un precio.");
      return;
    }

    try {
      const result = await inventoryService.sellItem(user.id, selectedSellItem, sellPrice);
      if (result.success) {
        // Actualizar lista local
        setMarketItems([result.listing, ...marketItems]);
        setShowSellModal(false);
        alert(`Has puesto a la venta "${selectedSellItem.name || selectedSellItem.title}" por $${sellPrice}.`);
      }
    } catch (error) {
      console.error("Error selling item:", error);
      alert("Hubo un error al publicar el item.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1b2838] text-white">
      {/* Page Header */}
      <div className="bg-[#171a21] py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <Link to="/inventory" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
              <span>Volver al Inventario</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <DollarSign className="text-green-500" size={32} />
            Mercado de la Comunidad
          </h1>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-[#1b2838] p-1 rounded-lg inline-flex">
            <button
              onClick={() => setActiveTab('market')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'market' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingCart size={18} />
              Compra y Venta
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'trading' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Repeat size={18} />
              Intercambios
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {/* Market Section */}
            {activeTab === 'market' && (
              <div className="space-y-6">
                <div className="bg-[#16202d] p-6 rounded-xl border border-[#2a475e]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Items Populares</h2>
                    <div className="flex gap-2">
                       <button 
                         onClick={handleSellItem}
                         className="bg-[#2a475e] hover:bg-[#3d5f7a] px-4 py-2 rounded text-sm transition"
                       >
                         Vender un item
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {marketItems.map((item) => (
                      <div key={item.id} className="bg-[#1b2838] border border-gray-700 p-4 rounded-lg hover:border-blue-500 transition cursor-pointer group">
                        <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-md mb-3 flex items-center justify-center">
                            <Package className="text-gray-500 group-hover:text-blue-400 transition" size={48} />
                        </div>
                        <h3 className="font-semibold text-blue-300 truncate">{item.name || item.itemName || `Item #${item.steam_item_id}`}</h3>
                        <p className="text-xs text-gray-400 mb-2">{item.game || "Steam"}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-green-400 font-bold text-lg">
                            ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}
                          </span>
                          
                          {/* Botón condicional: Cancelar si soy dueño (por ID o nombre), Comprar si es otro */}
                          {(item.seller_id === user?.id || item.seller === user?.username) ? (
                              <button 
                                onClick={() => handleCancelListing(item.id)}
                                className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm font-medium transition"
                              >
                                Cancelar
                              </button>
                          ) : (
                              <button 
                                onClick={() => handleBuyItem(item.name || item.itemName, item.price)}
                                className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm font-medium transition"
                              >
                                Comprar
                              </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 text-right">
                          Vendedor: {item.seller}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trading Section */}
            {activeTab === 'trading' && (
              <div className="bg-[#16202d] rounded-xl overflow-hidden border border-[#2a475e]">
                <div className="p-6 border-b border-[#2a475e] flex justify-between items-center">
                    <h2 className="text-xl font-bold">Ofertas de Intercambio Activas</h2>
                    <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm transition">
                        Nueva Oferta
                    </button>
                </div>
                
                <div className="divide-y divide-[#2a475e]">
                  {tradeOffers.map((trade) => (
                    <div key={trade.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[#1b2838] transition">
                      
                      <div className="flex items-center gap-6 flex-1">
                        <div className="text-center w-32">
                            <div className="w-12 h-12 bg-blue-900 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                                {trade.initiator.charAt(0)}
                            </div>
                            <span className="text-blue-300 font-medium text-sm">{trade.initiator}</span>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center md:justify-start gap-8">
                            <div className="text-center bg-black/20 p-3 rounded w-full max-w-[150px]">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Ofrece</span>
                                <div className="text-green-400 font-semibold mt-1">{trade.offering}</div>
                            </div>
                            
                            <Repeat className="text-gray-500" />
                            
                            <div className="text-center bg-black/20 p-3 rounded w-full max-w-[150px]">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Pide</span>
                                <div className="text-blue-400 font-semibold mt-1">{trade.requesting}</div>
                            </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                         <button 
                            onClick={() => handleTradeOffer(trade.id)}
                            className="bg-[#2a475e] hover:bg-blue-600 px-6 py-3 rounded font-medium transition w-full md:w-auto"
                         >
                            Intercambiar
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b2838] rounded-xl shadow-2xl max-w-2xl w-full border border-[#2a475e] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2a475e] flex justify-between items-center bg-[#171a21] rounded-t-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="text-green-500" /> Vender un Item
              </h2>
              <button onClick={() => setShowSellModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <h3 className="text-gray-300 font-semibold mb-4">Selecciona un item de tu inventario:</h3>
              
              {inventory?.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
                  {inventory.filter(i => i.is_marketable && !i.is_locked).map(item => (
                    <div 
                      key={item.steam_item_id || item.id}
                      onClick={() => setSelectedSellItem(item)}
                      className={`cursor-pointer bg-[#16202d] rounded-lg p-2 border-2 transition relative group
                        ${selectedSellItem?.id === item.id ? 'border-green-500 bg-[#16202d]' : 'border-transparent hover:border-blue-500'}
                      `}
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded flex items-center justify-center mb-2">
                        <Package className={selectedSellItem?.id === item.id ? 'text-green-400' : 'text-gray-500'} size={32} />
                      </div>
                      <div className="text-xs text-center truncate text-gray-300">{item.name || item.title}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-[#16202d] rounded-lg border border-dashed border-gray-700">
                  No tienes items vendibles en tu inventario.
                </div>
              )}

              {selectedSellItem && (
                <div className="bg-[#16202d] p-4 rounded-lg border border-[#2a475e] animate-fade-in">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">Item seleccionado:</div>
                      <div className="font-bold text-lg text-white">{selectedSellItem.name || selectedSellItem.title}</div>
                    </div>
                    
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="text-sm text-gray-400 mb-1 block">Precio de venta ($):</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input 
                          type="number" 
                          min="0.01" 
                          step="0.01"
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          className="w-full bg-[#1b2838] border border-[#2a475e] rounded px-3 pl-7 py-2 text-white focus:outline-none focus:border-green-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Steam cobra una comisión del 5% (Mock). Recibirás: <span className="text-green-400 font-bold">${(sellPrice * 0.95).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#2a475e] bg-[#171a21] rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setShowSellModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmSell}
                disabled={!selectedSellItem || !sellPrice}
                className={`px-6 py-2 rounded font-bold transition flex items-center gap-2
                  ${!selectedSellItem || !sellPrice 
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                    : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'}
                `}
              >
                <DollarSign size={18} />
                Publicar Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
