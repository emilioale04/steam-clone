import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Repeat, Search, DollarSign, Filter, Package, X, ArrowLeft, Inbox, Check, Info, Send } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../../../shared/context/AuthContext';
import { useInventory } from '../hooks/useInventory';
import { tradeService } from '../services/tradeService';
import { useTrade } from '../hooks/useTrade';

export const MarketplacePage = () => {
  const { user } = useAuth();
  const { inventory } = useInventory(user?.id);
  const { tradesForMe, postTradeOffer, getOffersForTrade, acceptTrade } = useTrade(user?.id);
  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'trading'
  const [marketItems, setMarketItems] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Venta
  const [showSellModal, setShowSellModal] = useState(false);
  const [showTradeOfferModal, setShowTradeOfferModal] = useState(false);
  const [showTradeOfferForMeModal, setShowTradeOfferForMeModal] = useState(false);
  const [selectedSellItem, setSelectedSellItem] = useState(null);
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const marketRes = await inventoryService.getMarketListings();
      const tradesRes = await tradeService.getTradesActive();
     
      if (marketRes.success) setMarketItems(marketRes.listings);
      if (tradesRes.success) setTrades(tradesRes.data);
    } catch (error) {
      console.error("Error fetching marketplace data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyItem = (itemName, price) => {
    alert(`Has comprado "${itemName}" por $${price}. (Mock)`);
  };

  const handleTradeOffer = (tradeId, itemId) => {
    console.log("tradeId: ", tradeId, "Item: ", itemId)
    postTradeOffer(tradeId, itemId)
  };

  const handleAcceptOffer = (tradeId) => {
    console.log('Aceptar oferta:', tradeId);
    acceptTrade(tradeId);
  };

  const handleRejectOffer = (tradeId, itemId) => {
    console.log('Rechazar oferta:', tradeId, itemId);
    // Lógica para rechazar la oferta
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
               {trades.map((trade) => (
                  <div key={trade.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[#1b2838] transition">
                      
                      <div className="flex items-center gap-6 flex-1">
                          <div className="text-center w-32">
                              <div className="w-12 h-12 bg-blue-900 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-lg">
                                  {trade.offerer.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-blue-300 font-medium text-sm">{trade.offerer.username}</span>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center md:justify-start gap-8">
                              <div className="text-center bg-black/20 p-3 rounded w-full max-w-[150px]">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">Ofrece</span>
                                  <div className="text-green-400 font-semibold mt-1">{trade.item.name}</div>
                              </div>
                              
                              <Repeat className="text-gray-500" />
                              
                              <div className="text-center bg-black/20 p-3 rounded w-full max-w-[150px]">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">Pide</span>
                                  <div className="text-gray-400 italic mt-1">Cualquier item</div>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-4">
                          <span className="text-yellow-400 text-sm font-medium px-3 py-1 bg-yellow-900/20 rounded">
                              {trade.status}
                          </span>
                      </div>
                      {trade.offerer_id === user?.id && (
                        <button onClick={()=>{getOffersForTrade(trade.id)
                          setShowTradeOfferForMeModal(true);
                        }} className="bg-[#2a475e] hover:bg-blue-600 px-6 py-3 rounded font-medium transition">
                          Ver ofertas
                        </button>
                        )}

                      {trade.offerer_id === user?.id && (
                        <button onClick={()=>{getOffersForTrade(trade.id)
                          setShowTradeOfferForMeModal(true);
                        }} className="bg-[#2a475e] hover:bg-blue-600 px-6 py-3 rounded font-medium transition">
                          Cancelar Intercambio
                        </button>
                        )}
                        
                        {trade.offerer_id !== user?.id && (
                        <button 
                          onClick={() => setShowTradeOfferModal(true)}
                          className="bg-[#2a475e] hover:bg-blue-600 px-6 py-3 rounded font-medium transition"
                        >
                          Intercambiar
                        </button>
                        )}
                     {showTradeOfferModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                          <div className="bg-[#1b2838] rounded-xl shadow-2xl max-w-4xl w-full border border-[#2a475e] flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-[#2a475e] flex justify-between items-center bg-[#171a21] rounded-t-xl">
                              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Repeat className="text-gray-400" /> Mis items para Intercambio
                              </h2>
                              <button 
                                onClick={() => setShowTradeOfferModal(false)} 
                                className="text-gray-400 hover:text-white"
                              >
                                <X size={20} />
                              </button>
                            </div>
                            
                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                              {/* Header de selección */}
                              <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-medium text-white">Selecciona un item para intercambiar</h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                      Intercambiando con: <span className="text-[#66c0f4] font-medium">{trade.offerer.username || "Usuario"}</span>
                                    </p>
                                  </div>
                                  
                                  {selectedSellItem && (
                                    <div className="flex items-center gap-3">
                                      <div className="bg-[#16202d] rounded-lg p-3 border border-[#2a475e]">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                                            <Package className="text-green-400" size={16} />
                                          </div>
                                          <div>
                                            <p className="text-sm text-white truncate max-w-[150px]">
                                              {selectedSellItem.name || selectedSellItem.title}
                                            </p>
                                            <p className="text-xs text-gray-400">Seleccionado</p>
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleTradeOffer(trade.id, selectedSellItem.id)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                      >
                                        <Send size={16} />
                                        Enviar Oferta
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-sm text-gray-400 bg-[#16202d] p-3 rounded-lg border border-[#2a475e]">
                                  <div className="flex items-center gap-2">
                                    <Info size={16} />
                                    Solo se muestran items intercambiables y no bloqueados
                                  </div>
                                </div>
                              </div>
                              
                              {/* Grid de items */}
                              {inventory?.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                  {inventory.filter(i => i.is_tradeable && !i.is_locked).map(item => (
                                    <div 
                                      key={item.steam_item_id || item.id}
                                      onClick={() => setSelectedSellItem(item)}
                                      className={`cursor-pointer bg-[#16202d] rounded-lg p-3 border-2 transition-all relative group hover:scale-[1.02]
                                        ${selectedSellItem?.id === item.id 
                                          ? 'border-green-500 bg-[#1a2638] shadow-lg shadow-green-500/20' 
                                          : 'border-[#2a475e] hover:border-[#66c0f4]'
                                        }
                                      `}
                                    >
                                      {/* Indicador de selección */}
                                      {selectedSellItem?.id === item.id && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10">
                                          <Check size={14} className="text-white" />
                                        </div>
                                      )}
                                      
                                      {/* Contenedor de imagen */}
                                      <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                                        {item.image_url ? (
                                          <img 
                                            src={item.image_url} 
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Package 
                                            className={selectedSellItem?.id === item.id ? 'text-green-400' : 'text-gray-500'} 
                                            size={40} 
                                          />
                                        )}
                                      </div>
                                      
                                      {/* Información del item */}
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-white truncate">
                                          {item.name || item.title}
                                        </h4>
                                        
                                        {item.steam_item_id && (
                                          <p className="text-xs text-gray-400 truncate">
                                            ID: {item.steam_item_id}
                                          </p>
                                        )}
                                        
                                        {/* Botón de selección */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSellItem(item);
                                          }}
                                          className={`w-full py-2 text-xs rounded transition-colors font-medium
                                            ${selectedSellItem?.id === item.id
                                              ? 'bg-green-600 hover:bg-green-500 text-white'
                                              : 'bg-[#2a475e] hover:bg-[#3a577e] text-gray-300'
                                            }
                                          `}
                                        >
                                          {selectedSellItem?.id === item.id ? 'Seleccionado' : 'Seleccionar'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12 text-gray-500 bg-[#16202d] rounded-lg border border-dashed border-gray-700">
                                  <div className="w-16 h-16 mx-auto bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                                    <Package className="text-gray-400" size={32} />
                                  </div>
                                  <h3 className="text-lg font-medium text-white mb-2">No hay items intercambiables</h3>
                                  <p className="text-gray-400 max-w-md mx-auto">
                                    Todos tus items están bloqueados o no son intercambiables. 
                                    Verifica la disponibilidad de tus items en el inventario.
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="p-4 border-t border-[#2a475e] bg-[#171a21] rounded-b-xl">
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-400">
                                  {inventory?.filter(i => i.is_tradeable && !i.is_locked).length || 0} items disponibles
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => setShowTradeOfferModal(false)}
                                    className="px-4 py-2 bg-[#2a475e] hover:bg-[#3a577e] text-white rounded-lg font-medium transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  {selectedSellItem && (
                                    <button
                                      onClick={() => handleTradeOffer(trade.id, selectedSellItem.id)}
                                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                      <Send size={16} />
                                      Enviar Oferta
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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

      {
        showTradeOfferForMeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b2838] rounded-xl shadow-2xl max-w-2xl w-full border border-[#2a475e] flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#2a475e] flex justify-between items-center bg-[#171a21] rounded-t-xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Repeat className="text-gray-400" /> Ofertas Recibidas
                </h2>
                <button 
                  onClick={() => setShowTradeOfferForMeModal(false)} 
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button> 
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Lista de ofertas recibidas */}
                {tradesForMe.length > 0 ? (
                  <div className="space-y-4">
                    {tradesForMe.map((trade) => (
                      <div 
                        key={`${trade.out_trade_id}-${trade.out_item_id}`}
                        className="bg-[#16202d] rounded-lg p-4 border border-[#2a475e] hover:border-[#66c0f4] transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                              <span className="text-sm font-medium text-gray-400">
                                Estado: <span className="text-yellow-500">{trade.out_status}</span>
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white">
                              {trade.out_item_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-400">De:</span>
                              <span className="text-sm font-medium text-[#66c0f4]">
                                {trade.out_offerer_username}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block mb-1">
                              ID: {trade.out_steam_item_id}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-[#2a475e]">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-[#2a475e] rounded flex items-center justify-center">
                              <Package className="text-gray-400" size={20} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">Item ofrecido</p>
                              <p className="text-xs text-gray-400">Trade ID: {trade.out_trade_id.substring(0, 8)}...</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleRejectOffer(trade.out_trade_id, trade.out_item_id)}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <X size={16} />
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleAcceptOffer(trade.out_id)}
                              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Check size={16} />
                              Aceptar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                      <Inbox className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No hay ofertas recibidas</h3>
                    <p className="text-gray-400 max-w-md">
                      Cuando otros usuarios te envíen ofertas de intercambio, aparecerán aquí.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-[#2a475e] bg-[#171a21] rounded-b-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    {tradesForMe.length} oferta{tradesForMe.length !== 1 ? 's' : ''} pendiente{tradesForMe.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowTradeOfferForMeModal(false)}
                    className="px-4 py-2 bg-[#2a475e] hover:bg-[#3a577e] text-white rounded-lg font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div>
  );
};
