import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Repeat, Search, DollarSign, Filter, Package, X, ArrowLeft, Inbox, Check, Info, Send, Loader2, User, Tag, AlertTriangle, Edit2, Save, Clock, SortAsc, SortDesc, ChevronDown } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../../../shared/context/AuthContext';
import { useInventory } from '../hooks/useInventory';
import { tradeService } from '../services/tradeService';
import { useTrade } from '../hooks/useTrade';
import { useWallet } from '../../wallet/hooks/useWallet';
import { validatePrice, sanitizePriceInput, formatPriceOnBlur, getPriceValidationState, PRICE_CONFIG, MARKETPLACE_LIMITS, TRADE_LIMITS } from '../utils/priceValidation';

export const MarketplacePage = () => {
  const { user } = useAuth();
  const { inventory, refetch } = useInventory(user?.id);
  const { balance, fetchBalance } = useWallet();
  const { tradesForMe, myOffers, postTradeOffer, getOffersForTrade, acceptTrade, cancelTradeById, rejectTradeOffer, cancelTradeOffer, fetchMyOffers } = useTrade(user?.id);
  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'trading' | 'myListings'
  const [marketItems, setMarketItems] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para límite diario de compras
  const [dailyPurchaseStatus, setDailyPurchaseStatus] = useState({
    dailyTotal: 0,
    dailyLimit: MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT,
    remaining: MARKETPLACE_LIMITS.DAILY_PURCHASE_LIMIT,
    limitReached: false
  });

  // Estado para límites de trading
  const [tradeLimitsStatus, setTradeLimitsStatus] = useState({
    activeCount: 0,
    maxAllowed: TRADE_LIMITS.MAX_ACTIVE_TRADES,
    remaining: TRADE_LIMITS.MAX_ACTIVE_TRADES,
    limitReached: false,
    maxOffersPerTrade: TRADE_LIMITS.MAX_OFFERS_PER_TRADE
  });

  // Filtrar items propios y de otros
  const myMarketListings = marketItems.filter(item => item.seller_id === user?.id);
  const otherMarketListings = marketItems.filter(item => item.seller_id !== user?.id);
  const myTrades = trades.filter(trade => trade.offerer_id === user?.id);
  const otherTrades = trades.filter(trade => trade.offerer_id !== user?.id);

  // Estados para el Modal de Venta
  const [showSellModal, setShowSellModal] = useState(false);
  const [showTradeOfferModal, setShowTradeOfferModal] = useState(false);
  const [showTradeOfferForMeModal, setShowTradeOfferForMeModal] = useState(false);
  const [showCancelTradeModal, setShowCancelTradeModal] = useState(false);
  const [selectedSellItem, setSelectedSellItem] = useState(null);
  const [sellPrice, setSellPrice] = useState('');

  // Estados para edición de precio
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Estados para el Modal de Compra
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name'
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar y ordenar items del marketplace
  const filteredMarketItems = useMemo(() => {
    let items = otherMarketListings;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        const name = (item.name || item.itemName || '').toLowerCase();
        const game = (item.game || '').toLowerCase();
        const seller = (item.seller || '').toLowerCase();
        return name.includes(query) || game.includes(query) || seller.includes(query);
      });
    }

    // Filtrar por rango de precio
    if (priceRange.min !== '') {
      const minPrice = parseFloat(priceRange.min);
      if (!isNaN(minPrice)) {
        items = items.filter(item => {
          const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
          return price >= minPrice;
        });
      }
    }
    if (priceRange.max !== '') {
      const maxPrice = parseFloat(priceRange.max);
      if (!isNaN(maxPrice)) {
        items = items.filter(item => {
          const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
          return price <= maxPrice;
        });
      }
    }

    // Ordenar
    items = [...items].sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price);
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price);
      const nameA = (a.name || a.itemName || '').toLowerCase();
      const nameB = (b.name || b.itemName || '').toLowerCase();
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);

      switch (sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'name':
          return nameA.localeCompare(nameB);
        case 'oldest':
          return dateA - dateB;
        case 'newest':
        default:
          return dateB - dateA;
      }
    });

    return items;
  }, [otherMarketListings, searchQuery, priceRange, sortBy]);

  // Filtrar y ordenar mis listings
  const filteredMyListings = useMemo(() => {
    let items = myMarketListings;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        const name = (item.name || item.itemName || '').toLowerCase();
        const game = (item.game || '').toLowerCase();
        return name.includes(query) || game.includes(query);
      });
    }

    return [...items].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  }, [myMarketListings, searchQuery]);

  // Filtrar trades
  const filteredOtherTrades = useMemo(() => {
    let items = otherTrades;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(trade => {
        const itemName = (trade.item?.name || '').toLowerCase();
        const username = (trade.offerer?.username || '').toLowerCase();
        return itemName.includes(query) || username.includes(query);
      });
    }

    return items;
  }, [otherTrades, searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery.trim() || priceRange.min !== '' || priceRange.max !== '' || sortBy !== 'newest';

  useEffect(() => {
    fetchData();
  }, []);

  // Cargar estado del límite diario cuando hay usuario
  useEffect(() => {
    if (user) {
      fetchDailyPurchaseStatus();
      fetchTradeLimitsStatus();
    }
  }, [user]);

  const fetchDailyPurchaseStatus = async () => {
    try {
      const status = await inventoryService.getDailyPurchaseStatus();
      setDailyPurchaseStatus(status);
    } catch (error) {
      console.error("Error fetching daily purchase status:", error);
    }
  };

  const fetchTradeLimitsStatus = async () => {
    try {
      const status = await tradeService.getTradeLimitsStatus();
      setTradeLimitsStatus(status);
    } catch (error) {
      console.error("Error fetching trade limits status:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const marketRes = await inventoryService.getMarketListings();
      const tradesRes = await tradeService.getTradesActive();
     
      if (marketRes.success) setMarketItems(marketRes.listings);
      if (tradesRes.success) setTrades(tradesRes.data);
      
      // Cargar mis ofertas en intercambios de otros
      if (user) {
        await fetchMyOffers();
      }
    } catch (error) {
      console.error("Error fetching marketplace data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeOffer = (tradeId, itemId) => {
     postTradeOffer(tradeId, itemId)
      .then((response) => {setSelectedSellItem(null); setShowTradeOfferModal(false);showSuccessMessage(response)})
      .catch(() => showErrorMessage())
      .finally(() => {refetch();});
  };

  const handleAcceptOffer = (tradeId) => {
     acceptTrade(tradeId)
      .then((response) => {setShowTradeOfferForMeModal(false);showSuccessMessage(response)})
      .catch(() => showErrorMessage())
      .finally(()=> fetchData())
    };
    
    const handleRejectOffer = (tradeId) => {
      rejectTradeOffer(tradeId)
      .then((response) => {setShowTradeOfferForMeModal(false);showSuccessMessage(response)})
      .catch(() => showErrorMessage())
      .finally(()=> fetchData())
  };

  // Abre el modal de confirmación de compra
  const handleBuyItem = (item) => {
    if (!user) {
      showErrorMessage('Debes iniciar sesión para comprar');
      return;
    }
    setSelectedPurchaseItem(item);
    setShowPurchaseModal(true);
  };

  // Procesa la compra de forma segura
  const handleConfirmPurchase = async () => {
    if (!selectedPurchaseItem || isPurchasing) return;

    setIsPurchasing(true);
    try {
      // NOTA: Solo enviamos el listingId, el precio se obtiene del servidor
      const result = await inventoryService.purchaseItem(selectedPurchaseItem.id);
      
      // Cerrar modal y mostrar éxito
      setShowPurchaseModal(false);
      setSelectedPurchaseItem(null);
      
      showSuccessMessage(
        `¡Compra exitosa! Has adquirido "${result.itemName}" por $${result.pricePaid?.toFixed(2) || selectedPurchaseItem.price}`
      );
      
      // Actualizar datos
      fetchData(); // Recargar marketplace
      refetch(); // Recargar inventario
      fetchBalance(); // Recargar balance del wallet
      fetchDailyPurchaseStatus(); // Actualizar estado del límite diario
      
    } catch (error) {
      console.error('Error en la compra:', error);
      
      // Mensajes de error específicos
      if (error.message.includes('límite diario') || error.message.includes('DAILY_LIMIT')) {
        // Extraer información del error si está disponible
        const remaining = error.remaining || (dailyPurchaseStatus.dailyLimit - dailyPurchaseStatus.dailyTotal);
        showErrorMessage(
          `Has alcanzado tu límite diario de compras ($${dailyPurchaseStatus.dailyLimit.toFixed(2)}). ` +
          `Te quedan $${remaining.toFixed(2)} disponibles para hoy.`
        );
        fetchDailyPurchaseStatus(); // Actualizar el estado del límite
      } else if (error.message.includes('Fondos insuficientes')) {
        showErrorMessage(error.message);
      } else if (error.message.includes('ya fue vendido') || error.message.includes('no está disponible')) {
        showErrorMessage('Este artículo ya no está disponible');
        fetchData(); // Recargar para actualizar la lista
      } else {
        showErrorMessage(error.message || 'Error al procesar la compra');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    const confirmed = await showConfirmDialog(
      "¿Estás seguro de que quieres cancelar esta venta? El item volverá a tu inventario.",
      "Cancelar venta"
    );
    if (!confirmed) return;

    try {
      await inventoryService.cancelListing(listingId);
      showSuccessMessage("Venta cancelada exitosamente. El item ha vuelto a tu inventario.");
      // Refrescar datos del marketplace y el inventario
      fetchData();
      refetch();
    } catch (error) {
      console.error("Error cancelling listing:", error);
      showErrorMessage("Error al cancelar la venta: " + error.message);
    }
  };

  // Handlers para editar precio
  const handleStartEditPrice = (item) => {
    setEditingPriceId(item.id);
    setEditPrice(typeof item.price === 'number' ? item.price.toFixed(2) : item.price);
  };

  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setEditPrice('');
  };

  const handleEditPriceChange = (value) => {
    const result = sanitizePriceInput(value);
    if (result.isValid) {
      setEditPrice(value);
    }
  };

  const handleEditPriceBlur = () => {
    if (editPrice) {
      setEditPrice(formatPriceOnBlur(editPrice));
    }
  };

  const handleUpdatePrice = async (listingId, currentPrice) => {
    // Validar precio
    const priceValidation = validatePrice(editPrice);
    if (!priceValidation.valid) {
      showErrorMessage(priceValidation.message);
      return;
    }

    // Si el precio es el mismo, solo cerrar
    if (priceValidation.price === currentPrice) {
      handleCancelEditPrice();
      return;
    }

    setIsUpdatingPrice(true);
    try {
      const result = await inventoryService.updateListingPrice(listingId, priceValidation.price);
      
      handleCancelEditPrice();
      showSuccessMessage(`Precio actualizado a $${priceValidation.price.toFixed(2)}`);
      // Refrescar datos del marketplace para mantener consistencia
      fetchData();
    } catch (error) {
      console.error("Error updating price:", error);
      showErrorMessage(error.message || "Error al actualizar el precio");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleSellItem = () => {
    // Verificar límite de listings antes de abrir el modal
    if (myMarketListings.length >= MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS) {
      showErrorMessage(
        `Has alcanzado el límite máximo de ${MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS} artículos en venta. Cancela alguna venta para publicar más.`
      );
      return;
    }
    setShowSellModal(true);
    setSelectedSellItem(null);
    setSellPrice('');
  };

  const handleConfirmSell = async () => {
    if (!selectedSellItem || !sellPrice) {
      showErrorMessage("Por favor selecciona un item y define un precio.");
      return;
    }

    // Validar precio
    const priceValidation = validatePrice(sellPrice);
    if (!priceValidation.valid) {
      showErrorMessage(priceValidation.message);
      return;
    }

    try {
      const result = await inventoryService.sellItem(user.id, selectedSellItem, priceValidation.price);
      if (result.success) {
        setShowSellModal(false);
        showSuccessMessage(`Has puesto a la venta "${selectedSellItem.name || selectedSellItem.title}" por $${priceValidation.price.toFixed(2)}.`);
        // Refrescar datos del marketplace para que el item aparezca en la sección correcta
        fetchData();
        refetch(); // Refrescar inventario
      }
    } catch (error) {
      console.error("Error selling item:", error);
      showErrorMessage(error.message || "Hubo un error al publicar el item. Inténtalo de nuevo.");
    }
  };

  // Función para mostrar mensaje de éxito con z-index máximo
  const showSuccessMessage = (message, duration = 5000) => {
    // Crear el elemento modal con z-index máximo
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-[9999]';
    
    // Overlay con animación y z-index alto
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black transition-opacity duration-300 opacity-60 z-[9998]';
    
    // Contenido del modal con z-index más alto
    modal.innerHTML = `
      <div class="relative z-[9999] bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-all duration-300 opacity-100 scale-100 translate-y-0">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-xl overflow-hidden">
          <div class="h-full bg-green-500 progress-bar" style="width: 100%"></div>
        </div>
        <div class="flex flex-col items-center text-center pt-2">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">¡Éxito!</h3>
          <p class="text-gray-600 mb-6 text-lg">${message}</p>
          <button class="close-btn px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
            Aceptar
          </button>
          <p class="text-gray-400 text-sm mt-4">
            Se cerrará en ${duration / 1000} segundos
          </p>
        </div>
      </div>
    `;
    
    // Agregar overlay y modal al body
    modal.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Estilos CSS para las animaciones con z-index seguro
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
      }
      .progress-bar {
        animation: shrink ${duration}ms linear forwards;
      }
    `;
    document.head.appendChild(style);
    
    // Función para cerrar y destruir el modal
    const closeModal = () => {
      const content = modal.querySelector('div > div');
      content.classList.add('opacity-0', 'scale-95', 'translate-y-2');
      overlay.classList.add('opacity-0');
      
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    };
    
    // Agregar eventos de cierre
    overlay.addEventListener('click', closeModal);
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    
    // Auto-destrucción después del tiempo especificado
    const autoCloseTimer = setTimeout(closeModal, duration);
    
    // Limpiar timer si se cierra manualmente
    const cleanup = () => {
      clearTimeout(autoCloseTimer);
    };
    
    overlay.addEventListener('click', cleanup);
    modal.querySelector('.close-btn').addEventListener('click', cleanup);
    
    return closeModal;
  };

  // Función para mostrar mensaje de error con z-index máximo
  const showErrorMessage = (message = '', duration = 5000) => {
    const defaultMessage = "Ocurrió un problema, inténtalo más tarde";
    
    // Crear el elemento modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-[9999]';
    
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black transition-opacity duration-300 opacity-60 z-[9998]';
    
    // Contenido del modal
    modal.innerHTML = `
      <div class="relative z-[9999] bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-all duration-300 opacity-100 scale-100 translate-y-0">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-xl overflow-hidden">
          <div class="h-full bg-red-500 progress-bar" style="width: 100%"></div>
        </div>
        <div class="flex flex-col items-center text-center pt-2">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Error</h3>
          <p class="text-gray-600 mb-6 text-lg">${message || defaultMessage}</p>
          <button class="close-btn px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium">
            Aceptar
          </button>
          <p class="text-gray-400 text-sm mt-4">
            Se cerrará en ${duration / 1000} segundos
          </p>
        </div>
      </div>
    `;
    
    // Agregar overlay y modal al body
    modal.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Estilos CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
      }
      .progress-bar {
        animation: shrink ${duration}ms linear forwards;
      }
      @keyframes pulse-once {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      .icon-animation {
        animation: pulse-once 0.5s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    // Agregar animación al icono
    setTimeout(() => {
      const iconContainer = modal.querySelector('.w-16.h-16');
      if (iconContainer) {
        iconContainer.classList.add('icon-animation');
      }
    }, 100);
    
    // Función para cerrar y destruir el modal
    const closeModal = () => {
      const content = modal.querySelector('div > div');
      content.classList.add('opacity-0', 'scale-95', 'translate-y-2');
      overlay.classList.add('opacity-0');
      
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    };
    
    // Agregar eventos de cierre
    overlay.addEventListener('click', closeModal);
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    
    // Auto-destrucción
    const autoCloseTimer = setTimeout(closeModal, duration);
    
    // Limpiar timer
    const cleanup = () => {
      clearTimeout(autoCloseTimer);
    };
    
    overlay.addEventListener('click', cleanup);
    modal.querySelector('.close-btn').addEventListener('click', cleanup);
    
    return closeModal;
  };

  // Función para mostrar diálogo de confirmación
  const showConfirmDialog = (message, title = 'Confirmar acción') => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 flex items-center justify-center z-[9999]';
      
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black transition-opacity duration-300 opacity-60 z-[9998]';
      
      modal.innerHTML = `
        <div class="relative z-[9999] bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl transform transition-all duration-300 opacity-100 scale-100 translate-y-0">
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
            <p class="text-gray-600 mb-6 text-lg">${message}</p>
            <div class="flex gap-3 w-full">
              <button class="cancel-btn flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium">
                Cancelar
              </button>
              <button class="confirm-btn flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      `;
      
      modal.appendChild(overlay);
      document.body.appendChild(modal);
      
      const closeModal = (result) => {
        const content = modal.querySelector('div > div');
        content.classList.add('opacity-0', 'scale-95', 'translate-y-2');
        overlay.classList.add('opacity-0');
        
        setTimeout(() => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
          resolve(result);
        }, 300);
      };
      
      overlay.addEventListener('click', () => closeModal(false));
      modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(false));
      modal.querySelector('.confirm-btn').addEventListener('click', () => closeModal(true));
    });
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
              Comprar
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
            {user && (
              <button
                onClick={() => setActiveTab('myListings')}
                className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'myListings' 
                    ? 'bg-green-600 text-white shadow' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tag size={18} />
                Mis Publicaciones
                {(myMarketListings.length + myTrades.length) > 0 && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {myMarketListings.length + myTrades.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Balance del usuario */}
          {user && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-400">Tu balance:</span>
              <span className="text-green-400 font-bold">${(balance || 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {/* Market Section - Solo items de OTROS usuarios */}
            {activeTab === 'market' && (
              <div className="space-y-6">
                {/* Banner de Límite Diario de Compras */}
                {user && (
                  <div className={`p-4 rounded-xl border ${
                    dailyPurchaseStatus.limitReached 
                      ? 'bg-red-900/30 border-red-700' 
                      : dailyPurchaseStatus.remaining < 500 
                        ? 'bg-yellow-900/30 border-yellow-700' 
                        : 'bg-[#16202d] border-[#2a475e]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          dailyPurchaseStatus.limitReached 
                            ? 'bg-red-800' 
                            : dailyPurchaseStatus.remaining < 500 
                              ? 'bg-yellow-800' 
                              : 'bg-[#2a475e]'
                        }`}>
                          <Clock className={`w-5 h-5 ${
                            dailyPurchaseStatus.limitReached 
                              ? 'text-red-400' 
                              : dailyPurchaseStatus.remaining < 500 
                                ? 'text-yellow-400' 
                                : 'text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Límite diario de compras</p>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              dailyPurchaseStatus.limitReached 
                                ? 'text-red-400' 
                                : dailyPurchaseStatus.remaining < 500 
                                  ? 'text-yellow-400' 
                                  : 'text-white'
                            }`}>
                              ${dailyPurchaseStatus.dailyTotal.toFixed(2)}
                            </span>
                            <span className="text-gray-500">/</span>
                            <span className="text-gray-400">${dailyPurchaseStatus.dailyLimit.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Disponible hoy</p>
                        <p className={`font-bold ${
                          dailyPurchaseStatus.limitReached 
                            ? 'text-red-400' 
                            : dailyPurchaseStatus.remaining < 500 
                              ? 'text-yellow-400' 
                              : 'text-green-400'
                        }`}>
                          ${dailyPurchaseStatus.remaining.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {/* Barra de progreso */}
                    <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          dailyPurchaseStatus.limitReached 
                            ? 'bg-red-500' 
                            : dailyPurchaseStatus.remaining < 500 
                              ? 'bg-yellow-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (dailyPurchaseStatus.dailyTotal / dailyPurchaseStatus.dailyLimit) * 100)}%` }}
                      />
                    </div>
                    {dailyPurchaseStatus.limitReached && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Has alcanzado tu límite de compras por hoy. Se reinicia a medianoche.
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-[#16202d] p-6 rounded-xl border border-[#2a475e]">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold">Items Disponibles para Comprar</h2>
                    <div className="flex gap-2">
                       <button 
                         onClick={handleSellItem}
                         className="bg-[#2a475e] hover:bg-[#3d5f7a] px-4 py-2 rounded text-sm transition"
                       >
                         Vender un item
                       </button>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="mb-6 space-y-4">
                    {/* Search Input */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, juego o vendedor..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#1b2838] border border-[#2a475e] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      
                      {/* Sort Dropdown */}
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="appearance-none bg-[#1b2838] border border-[#2a475e] rounded-lg px-4 py-2.5 pr-10 text-white focus:border-blue-500 focus:outline-none transition cursor-pointer min-w-[160px]"
                        >
                          <option value="newest">Más recientes</option>
                          <option value="oldest">Más antiguos</option>
                          <option value="price-low">Precio: menor</option>
                          <option value="price-high">Precio: mayor</option>
                          <option value="name">Nombre A-Z</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      </div>

                      {/* Filter Toggle Button */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition ${
                          showFilters || hasActiveFilters
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#1b2838] border-[#2a475e] text-gray-300 hover:border-blue-500'
                        }`}
                      >
                        <Filter size={18} />
                        <span className="hidden sm:inline">Filtros</span>
                        {hasActiveFilters && (
                          <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded">
                            {[searchQuery.trim(), priceRange.min, priceRange.max].filter(Boolean).length + (sortBy !== 'newest' ? 1 : 0)}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                      <div className="bg-[#1b2838] rounded-lg p-4 border border-[#2a475e] animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                          {/* Price Range */}
                          <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-2">Rango de precio</label>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input
                                  type="number"
                                  placeholder="Mín"
                                  value={priceRange.min}
                                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                  min="0"
                                  step="0.01"
                                  className="w-full bg-[#16202d] border border-[#2a475e] rounded pl-7 pr-2 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition text-sm"
                                />
                              </div>
                              <span className="text-gray-500">-</span>
                              <div className="relative flex-1">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input
                                  type="number"
                                  placeholder="Máx"
                                  value={priceRange.max}
                                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                  min="0"
                                  step="0.01"
                                  className="w-full bg-[#16202d] border border-[#2a475e] rounded pl-7 pr-2 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Clear Filters Button */}
                          {hasActiveFilters && (
                            <button
                              onClick={clearFilters}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                            >
                              <X size={16} />
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Results Count */}
                    {(searchQuery || priceRange.min || priceRange.max) && (
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-400">
                          {filteredMarketItems.length} {filteredMarketItems.length === 1 ? 'resultado' : 'resultados'}
                          {searchQuery && <span> para "<span className="text-blue-400">{searchQuery}</span>"</span>}
                        </p>
                      </div>
                    )}
                  </div>

                  {otherMarketListings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No hay items disponibles</h3>
                      <p className="text-gray-400 max-w-md">
                        No hay artículos de otros usuarios a la venta en este momento.
                      </p>
                    </div>
                  ) : filteredMarketItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                        <Search className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No se encontraron resultados</h3>
                      <p className="text-gray-400 max-w-md mb-4">
                        No hay artículos que coincidan con tu búsqueda o filtros.
                      </p>
                      <button
                        onClick={clearFilters}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                      >
                        <X size={16} />
                        Limpiar filtros
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredMarketItems.map((item) => {
                        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
                        const exceedsLimit = itemPrice > dailyPurchaseStatus.remaining;
                        const limitReached = dailyPurchaseStatus.limitReached;
                        
                        return (
                        <div key={item.id} className="bg-[#1b2838] border border-gray-700 p-4 rounded-lg hover:border-blue-500 transition cursor-pointer group">
                          <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-md mb-3 flex items-center justify-center">
                              <Package className="text-gray-500 group-hover:text-blue-400 transition" size={48} />
                          </div>
                          <h3 className="font-semibold text-blue-300 truncate">{item.name || item.itemName || `Item #${item.steam_item_id}`}</h3>
                          <p className="text-xs text-gray-400 mb-2">{item.game || "Steam"}</p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-green-400 font-bold text-lg">
                              ${itemPrice.toFixed(2)}
                            </span>
                            
                            <button 
                              onClick={() => handleBuyItem(item)}
                              disabled={!user || limitReached || exceedsLimit}
                              title={limitReached ? 'Límite diario alcanzado' : exceedsLimit ? `Este item excede tu límite restante ($${dailyPurchaseStatus.remaining.toFixed(2)})` : ''}
                              className={`px-3 py-1 rounded text-sm font-medium transition disabled:cursor-not-allowed ${
                                limitReached || exceedsLimit
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-500'
                              }`}
                            >
                              {limitReached ? 'Límite' : exceedsLimit ? 'Excede límite' : 'Comprar'}
                            </button>
                          </div>
                          {exceedsLimit && !limitReached && (
                            <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              Excede tu límite disponible
                            </p>
                          )}
                          <div className="text-xs text-gray-500 mt-2 text-right">
                            Vendedor: {item.seller}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trading Section - Solo trades de OTROS usuarios */}
            {activeTab === 'trading' && (
              <div className="bg-[#16202d] rounded-xl overflow-hidden border border-[#2a475e]">
                <div className="p-6 border-b border-[#2a475e]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold">Intercambios Disponibles</h2>
                  </div>
                  
                  {/* Search Bar for Trading */}
                  {otherTrades.length > 0 && (
                    <div className="mt-4">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Buscar por item o usuario..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#1b2838] border border-[#2a475e] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {searchQuery && (
                        <p className="text-sm text-gray-400 mt-2">
                          {filteredOtherTrades.length} {filteredOtherTrades.length === 1 ? 'resultado' : 'resultados'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {otherTrades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                      <Repeat className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No hay intercambios disponibles</h3>
                    <p className="text-gray-400 max-w-md">
                      No hay ofertas de intercambio de otros usuarios en este momento.
                    </p>
                  </div>
                ) : filteredOtherTrades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                      <Search className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron resultados</h3>
                    <p className="text-gray-400 max-w-md mb-4">
                      No hay intercambios que coincidan con "{searchQuery}".
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                      <X size={16} />
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2a475e]">
               {filteredOtherTrades.map((trade) => (
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
                        <button 
                          onClick={() => setShowTradeOfferModal(true)}
                          className="bg-[#2a475e] hover:bg-blue-600 px-6 py-3 rounded font-medium transition"
                        >
                          Ofrecer Intercambio
                        </button>
                      </div>

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
                )}
              </div>
            )}

            {/* Mis Publicaciones Section */}
            {activeTab === 'myListings' && user && (
              <div className="space-y-8">
                {/* Indicador de límite */}
                {myMarketListings.length >= MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-yellow-400 font-medium">Límite alcanzado</h4>
                      <p className="text-gray-400 text-sm">
                        Has alcanzado el máximo de {MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS} artículos en venta. 
                        Cancela alguna venta para publicar más artículos.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mis artículos en venta */}
                <div className="bg-[#16202d] p-6 rounded-xl border border-[#2a475e]">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <ShoppingCart className="text-yellow-500" size={24} />
                      Mis Artículos en Venta
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        myMarketListings.length >= MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {myMarketListings.length}/{MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS}
                      </span>
                    </h2>
                    <button 
                      onClick={handleSellItem}
                      disabled={myMarketListings.length >= MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS}
                      className={`px-4 py-2 rounded text-sm transition flex items-center gap-2 ${
                        myMarketListings.length >= MARKETPLACE_LIMITS.MAX_ACTIVE_LISTINGS
                          ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                          : 'bg-green-600 hover:bg-green-500'
                      }`}
                    >
                      <DollarSign size={16} />
                      Vender nuevo item
                    </button>
                  </div>

                  {/* Search for My Listings */}
                  {myMarketListings.length > 0 && (
                    <div className="mb-4">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Buscar en mis artículos..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#1b2838] border border-[#2a475e] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {myMarketListings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-[#1b2838] rounded-lg border border-dashed border-gray-700">
                      <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">No tienes artículos en venta</h3>
                      <p className="text-gray-400 max-w-md mb-4">
                        Cuando publiques un artículo para venta, aparecerá aquí.
                      </p>
                      <button 
                        onClick={handleSellItem}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm transition"
                      >
                        Vender un item
                      </button>
                    </div>
                  ) : filteredMyListings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                        <Search className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">No se encontraron resultados</h3>
                      <p className="text-gray-400 max-w-md mb-4">
                        No hay artículos que coincidan con "{searchQuery}".
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-yellow-400 hover:text-yellow-300 flex items-center gap-2"
                      >
                        <X size={16} />
                        Limpiar búsqueda
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredMyListings.map((item) => {
                        const isEditing = editingPriceId === item.id;
                        const currentPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
                        const editPriceState = isEditing ? getPriceValidationState(editPrice) : null;
                        
                        return (
                          <div key={item.id} className="bg-[#1b2838] border border-yellow-500/30 p-4 rounded-lg relative group">
                            {/* Badge de propiedad */}
                            
                            <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-md mb-3 flex items-center justify-center">
                              <Package className="text-yellow-400" size={48} />
                            </div>
                            <h3 className="font-semibold text-yellow-300 truncate">{item.name || item.itemName || `Item #${item.steam_item_id}`}</h3>
                            <p className="text-xs text-gray-400 mb-2">{item.game || "Steam"}</p>
                            
                            {/* Sección de precio con edición inline */}
                            <div className="mt-3">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                      <input
                                        type="text"
                                        value={editPrice}
                                        onChange={(e) => handleEditPriceChange(e.target.value)}
                                        onBlur={handleEditPriceBlur}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleUpdatePrice(item.id, currentPrice);
                                          if (e.key === 'Escape') handleCancelEditPrice();
                                        }}
                                        className={`w-full pl-6 pr-2 py-1.5 bg-[#2a475e] border rounded text-white text-sm focus:outline-none focus:ring-2 ${
                                          editPriceState?.error 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-600 focus:ring-blue-500'
                                        }`}
                                        placeholder={currentPrice.toFixed(2)}
                                        autoFocus
                                        disabled={isUpdatingPrice}
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleUpdatePrice(item.id, currentPrice)}
                                      disabled={isUpdatingPrice || editPriceState?.error}
                                      className="p-1.5 bg-green-600 hover:bg-green-500 rounded text-white transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                                      title="Guardar (Enter)"
                                    >
                                      {isUpdatingPrice ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : (
                                        <Save size={16} />
                                      )}
                                    </button>
                                    <button
                                      onClick={handleCancelEditPrice}
                                      disabled={isUpdatingPrice}
                                      className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded text-white transition"
                                      title="Cancelar (Esc)"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                  {editPriceState?.error && (
                                    <p className="text-xs text-red-400">{editPriceState.error}</p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    ${PRICE_CONFIG.MIN.toFixed(2)} - ${PRICE_CONFIG.MAX.toLocaleString()} · Enter para guardar · Esc para cancelar
                                  </p>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-bold text-lg">
                                      ${currentPrice.toFixed(2)}
                                    </span>
                                    <button
                                      onClick={() => handleStartEditPrice(item)}
                                      className="p-1 text-gray-400 hover:text-yellow-400 hover:bg-[#2a475e] rounded transition opacity-0 group-hover:opacity-100"
                                      title="Editar precio"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  </div>
                                  
                                  <button 
                                    onClick={() => handleCancelListing(item.id)}
                                    className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm font-medium transition flex items-center gap-1"
                                  >
                                    <X size={14} />
                                    Cancelar
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-2">
                              Publicado: {new Date(item.listing_date).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mis intercambios activos */}
                <div className="bg-[#16202d] p-6 rounded-xl border border-[#2a475e]">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Repeat className="text-purple-500" size={24} />
                      Mis Intercambios Activos
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        tradeLimitsStatus.limitReached
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {myTrades.length}/{tradeLimitsStatus.maxAllowed}
                      </span>
                    </h2>
                    {/* Info sobre límites */}
                    {tradeLimitsStatus.remaining <= 3 && !tradeLimitsStatus.limitReached && (
                      <div className="flex items-center gap-2 text-sm text-yellow-400">
                        <AlertTriangle size={14} />
                        <span>Te quedan {tradeLimitsStatus.remaining} intercambios disponibles</span>
                      </div>
                    )}
                    {tradeLimitsStatus.limitReached && (
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <AlertTriangle size={14} />
                        <span>Límite de intercambios alcanzado</span>
                      </div>
                    )}
                  </div>

                  {/* Info sobre sistema de negociación */}
                  <div className="bg-[#1b2838] border border-[#2a475e] rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="text-blue-400 mt-0.5 flex-shrink-0" size={18} />
                      <div className="text-sm text-gray-400">
                        <p className="mb-1">
                          <span className="text-white font-medium">Items en Negociación:</span> Los items que ofreces en respuesta a intercambios 
                          se marcan como "En Negociación" y pueden usarse en múltiples propuestas simultáneamente.
                        </p>
                        <p>
                          Cada intercambio puede recibir hasta <span className="text-purple-400 font-medium">{tradeLimitsStatus.maxOffersPerTrade} ofertas</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {myTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-[#1b2838] rounded-lg border border-dashed border-gray-700">
                      <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                        <Repeat className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">No tienes intercambios activos</h3>
                      <p className="text-gray-400 max-w-md">
                        Cuando publiques una oferta de intercambio, aparecerá aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myTrades.map((trade) => (
                        <div key={trade.id} className="bg-[#1b2838] border border-purple-500/30 p-4 rounded-lg">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Badge de propiedad */}
                            <div className="flex items-center gap-4 flex-1">
                              <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded font-bold">
                                TU OFERTA
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-center bg-black/20 p-3 rounded">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">Ofreces</span>
                                  <div className="text-purple-400 font-semibold mt-1">{trade.item.name}</div>
                                </div>
                                
                                <Repeat className="text-gray-500" />
                                
                                <div className="text-center bg-black/20 p-3 rounded">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">Pides</span>
                                  <div className="text-gray-400 italic mt-1">Cualquier item</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  getOffersForTrade(trade.id);
                                  setShowTradeOfferForMeModal(true);
                                }} 
                                className="bg-[#2a475e] hover:bg-blue-600 px-4 py-2 rounded font-medium transition flex items-center gap-2"
                              >
                                <Inbox size={16} />
                                Ver ofertas
                              </button>
                              <button 
                                onClick={async () => {
                                  const confirmed = await showConfirmDialog(
                                    '¿Estás seguro de que deseas cancelar este intercambio? El ítem volverá a estar disponible.',
                                    'Cancelar intercambio'
                                  );
                                  if (confirmed) {
                                    cancelTradeById(trade.id)
                                      .then((response) => showSuccessMessage(response))
                                      .catch(() => showErrorMessage())
                                      .finally(() => {
                                        fetchData();
                                        fetchTradeLimitsStatus(); // Actualizar límites
                                      });
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-medium transition flex items-center gap-2"
                              >
                                <X size={16} />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mis ofertas en intercambios de otros */}
                <div className="bg-[#16202d] p-6 rounded-xl border border-[#2a475e]">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Send className="text-teal-500" size={24} />
                      Mis Ofertas en Intercambios de Otros
                      <span className="text-sm px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400">
                        {myOffers?.length || 0}
                      </span>
                    </h2>
                  </div>

                  {/* Info sobre sistema de ofertas */}
                  <div className="bg-[#1b2838] border border-[#2a475e] rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="text-teal-400 mt-0.5 flex-shrink-0" size={18} />
                      <div className="text-sm text-gray-400">
                        <p>
                          <span className="text-white font-medium">Ofertas Enviadas:</span> Estos son los items que has ofrecido 
                          como respuesta a intercambios publicados por otros usuarios. Puedes cancelar una oferta en cualquier momento 
                          mientras el intercambio original siga activo.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!myOffers || myOffers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-[#1b2838] rounded-lg border border-dashed border-gray-700">
                      <div className="w-16 h-16 bg-[#2a475e] rounded-full flex items-center justify-center mb-4">
                        <Send className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">No tienes ofertas pendientes</h3>
                      <p className="text-gray-400 max-w-md">
                        Cuando ofertes items en intercambios de otros usuarios, aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myOffers.map((offer) => (
                        <div key={offer.id} className="bg-[#1b2838] border border-teal-500/30 p-4 rounded-lg">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Badge de oferta */}
                            <div className="flex items-center gap-4 flex-1">
                              <div className="bg-teal-500 text-white text-xs px-2 py-1 rounded font-bold">
                                TU OFERTA
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-center bg-black/20 p-3 rounded">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">Ofreces</span>
                                  <div className="text-teal-400 font-semibold mt-1">{offer.item?.name || 'Item'}</div>
                                </div>
                                
                                <Repeat className="text-gray-500" />
                                
                                <div className="text-center bg-black/20 p-3 rounded">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">A cambio de</span>
                                  <div className="text-purple-400 font-semibold mt-1">
                                    {offer.trade?.item?.name || 'Item del intercambio'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {/* Info del dueño del intercambio */}
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <User size={14} />
                                <span>Intercambio de: <span className="text-white">{offer.trade?.offerer?.username || 'Usuario'}</span></span>
                              </div>
                              
                              <button 
                                onClick={async () => {
                                  const confirmed = await showConfirmDialog(
                                    '¿Estás seguro de que deseas cancelar esta oferta? El ítem volverá a estar disponible.',
                                    'Cancelar oferta'
                                  );
                                  if (confirmed) {
                                    cancelTradeOffer(offer.id)
                                      .then((response) => showSuccessMessage(response))
                                      .catch(() => showErrorMessage())
                                      .finally(() => {
                                        fetchData();
                                      });
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-medium transition flex items-center gap-2"
                              >
                                <X size={16} />
                                Cancelar oferta
                              </button>
                            </div>
                          </div>
                          
                          {/* Fecha de la oferta */}
                          <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={12} />
                            Ofrecido el: {new Date(offer.created_at).toLocaleDateString()} a las {new Date(offer.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resumen */}
                <div className="bg-[#16202d] p-6 rounded-xl border border-[#2a475e]">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Info className="text-blue-400" size={20} />
                    Resumen de tus publicaciones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-yellow-400">{myMarketListings.length}</div>
                      <div className="text-gray-400 text-sm">Artículos en venta</div>
                      {myMarketListings.length > 0 && (
                        <div className="text-green-400 text-sm mt-1">
                          Total: ${myMarketListings.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-purple-400">{myTrades.length}</div>
                      <div className="text-gray-400 text-sm">Intercambios propios</div>
                      <div className="text-purple-400/60 text-xs mt-1">Items que ofreciste</div>
                    </div>
                    <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-teal-400">{myOffers?.length || 0}</div>
                      <div className="text-gray-400 text-sm">Ofertas enviadas</div>
                      <div className="text-teal-400/60 text-xs mt-1">A intercambios de otros</div>
                    </div>
                    <div className="bg-[#1b2838] p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-blue-400">{tradesForMe?.length || 0}</div>
                      <div className="text-gray-400 text-sm">Ofertas recibidas</div>
                      {(tradesForMe?.length || 0) > 0 && (
                        <button 
                          onClick={() => setShowTradeOfferForMeModal(true)}
                          className="text-blue-400 text-sm mt-1 hover:underline"
                        >
                          Ver ofertas →
                        </button>
                      )}
                    </div>
                  </div>
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
                          min={PRICE_CONFIG.MIN}
                          max={PRICE_CONFIG.MAX}
                          step="0.01"
                          value={sellPrice}
                          onChange={(e) => {
                            const result = sanitizePriceInput(e.target.value);
                            if (result.isValid) setSellPrice(result.value);
                          }}
                          onBlur={(e) => {
                            const formatted = formatPriceOnBlur(e.target.value);
                            if (formatted) setSellPrice(formatted);
                          }}
                          className={`w-full bg-[#1b2838] border rounded px-3 pl-7 py-2 text-white focus:outline-none transition-colors
                            ${getPriceValidationState(sellPrice).isTooLow || getPriceValidationState(sellPrice).isTooHigh
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[#2a475e] focus:border-green-500'
                            }`}
                          placeholder="0.00"
                        />
                      </div>
                      {getPriceValidationState(sellPrice).isTooHigh && (
                        <p className="text-red-400 text-xs mt-1">El precio máximo es ${PRICE_CONFIG.MAX.toLocaleString()}</p>
                      )}
                      {getPriceValidationState(sellPrice).isTooLow && (
                        <p className="text-red-400 text-xs mt-1">El precio mínimo es ${PRICE_CONFIG.MIN.toFixed(2)}</p>
                      )}
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
                              onClick={() => handleRejectOffer(trade.out_id)}
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

      {/* Modal de Confirmación de Compra */}
      {showPurchaseModal && selectedPurchaseItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#1b2838] rounded-xl shadow-2xl max-w-md w-full border border-[#2a475e] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#2a475e] bg-[#171a21] flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="text-green-500" />
                Confirmar Compra
              </h3>
              <button 
                onClick={() => {setShowPurchaseModal(false); setSelectedPurchaseItem(null);}}
                disabled={isPurchasing}
                className="text-gray-400 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Item Preview */}
              <div className="flex items-center gap-4 mb-6 bg-[#16202d] p-4 rounded-lg border border-[#2a475e]">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <Package className="text-blue-400" size={32} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-white truncate">
                    {selectedPurchaseItem.name || selectedPurchaseItem.itemName || `Item #${selectedPurchaseItem.steam_item_id}`}
                  </h4>
                  <p className="text-sm text-gray-400">Vendedor: {selectedPurchaseItem.seller}</p>
                </div>
              </div>

              {/* Price Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-[#2a475e]">
                  <span className="text-gray-400">Precio del artículo</span>
                  <span className="text-white font-bold text-lg">
                    ${typeof selectedPurchaseItem.price === 'number' 
                      ? selectedPurchaseItem.price.toFixed(2) 
                      : parseFloat(selectedPurchaseItem.price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tu balance actual</span>
                  <span className={`font-medium ${(balance || 0) >= selectedPurchaseItem.price ? 'text-green-400' : 'text-red-400'}`}>
                    ${(balance || 0).toFixed(2)}
                  </span>
                </div>
                {(balance || 0) < selectedPurchaseItem.price && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <Info size={16} />
                      Fondos insuficientes. Necesitas ${(selectedPurchaseItem.price - (balance || 0)).toFixed(2)} más.
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#2a475e]">
                  <span className="text-gray-300 font-medium">Balance después de compra</span>
                  <span className={`font-bold ${(balance || 0) >= selectedPurchaseItem.price ? 'text-green-400' : 'text-red-400'}`}>
                    ${Math.max(0, (balance || 0) - selectedPurchaseItem.price).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Daily Limit Info */}
              <div className={`rounded-lg p-3 mb-4 ${
                (typeof selectedPurchaseItem.price === 'number' ? selectedPurchaseItem.price : parseFloat(selectedPurchaseItem.price)) > dailyPurchaseStatus.remaining
                  ? 'bg-red-500/10 border border-red-500/30'
                  : 'bg-[#16202d] border border-[#2a475e]'
              }`}>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock size={14} />
                    Límite diario restante
                  </span>
                  <span className={`font-medium ${
                    (typeof selectedPurchaseItem.price === 'number' ? selectedPurchaseItem.price : parseFloat(selectedPurchaseItem.price)) > dailyPurchaseStatus.remaining
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    ${dailyPurchaseStatus.remaining.toFixed(2)}
                  </span>
                </div>
                {(typeof selectedPurchaseItem.price === 'number' ? selectedPurchaseItem.price : parseFloat(selectedPurchaseItem.price)) > dailyPurchaseStatus.remaining && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Este artículo excede tu límite diario disponible
                  </p>
                )}
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
                <p className="text-yellow-400 text-sm flex items-start gap-2">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Esta acción no se puede deshacer. El artículo se agregará a tu inventario inmediatamente.</span>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {setShowPurchaseModal(false); setSelectedPurchaseItem(null);}}
                  disabled={isPurchasing}
                  className="flex-1 px-4 py-3 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={
                    isPurchasing || 
                    (balance || 0) < selectedPurchaseItem.price ||
                    (typeof selectedPurchaseItem.price === 'number' ? selectedPurchaseItem.price : parseFloat(selectedPurchaseItem.price)) > dailyPurchaseStatus.remaining
                  }
                  className={`flex-1 flex justify-center items-center gap-2 rounded-lg font-bold text-white py-3 transition-all
                    ${isPurchasing || (balance || 0) < selectedPurchaseItem.price || (typeof selectedPurchaseItem.price === 'number' ? selectedPurchaseItem.price : parseFloat(selectedPurchaseItem.price)) > dailyPurchaseStatus.remaining
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/30'
                    }`}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Confirmar Compra
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
