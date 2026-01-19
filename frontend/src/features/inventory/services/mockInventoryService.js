
const MOCK_ITEMS = [
    { id: 'item-1', steam_item_id: 'AK-47', is_tradeable: true, is_marketable: true, is_locked: false, name: 'AK-47 | Redline' },
    { id: 'item-2', steam_item_id: 'AWP', is_tradeable: true, is_marketable: true, is_locked: false, name: 'AWP | Asiimov' },
    { id: 'item-3', steam_item_id: 'Knife', is_tradeable: false, is_marketable: false, is_locked: true, name: 'Karambit | Fade' },
    { id: 'item-4', steam_item_id: 'Glove', is_tradeable: true, is_marketable: false, is_locked: false, name: 'Sport Gloves' }
];

const getStoredInventory = () => {
    const stored = localStorage.getItem('mock_inventory');
    if (stored) return JSON.parse(stored);
    return MOCK_ITEMS;
};

const saveInventory = (items) => {
    localStorage.setItem('mock_inventory', JSON.stringify(items));
};

const getStoredListings = () => {
    const stored = localStorage.getItem('mock_listings');
    if (stored) return JSON.parse(stored);
    return [];
};

const saveListings = (listings) => {
    localStorage.setItem('mock_listings', JSON.stringify(listings));
};

export const mockInventoryService = {
    async _delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async getInventory(userId) {
        await this._delay();
        return getStoredInventory();
    },

    async getItem(itemId) {
        await this._delay();
        const items = getStoredInventory();
        const item = items.find(i => i.id === itemId);
        if (!item) throw new Error('Item no encontrado');
        return item;
    },

    async syncInventory(steamItems) {
        await this._delay();
        // In simulation, we just ignore the input or append it
        return { success: true, message: 'Inventario sincronizado' };
    },

    async sellItem(userId, item, price) {
        await this._delay();
        const listings = getStoredListings();
        const listing = {
            id: `listing-${Date.now()}`,
            itemId: item.id,
            sellerId: userId,
            price: parseFloat(price),
            item: item,
            created_at: new Date().toISOString(),
            status: 'ACTIVE'
        };
        listings.push(listing);
        saveListings(listings);

        // Lock item in inventory
        const items = getStoredInventory();
        const itemIndex = items.findIndex(i => i.id === item.id);
        if (itemIndex !== -1) {
            items[itemIndex].is_locked = true;
            saveInventory(items);
        }

        return {
            success: true,
            listing
        };
    },

    async cancelListing(listingId) {
        await this._delay();
        const listings = getStoredListings();
        const index = listings.findIndex(l => l.id === listingId);
        if (index === -1) throw new Error('Publicación no encontrada');

        const listing = listings[index];
        listings.splice(index, 1);
        saveListings(listings);

        // Unlock item
        const items = getStoredInventory();
        const itemIndex = items.findIndex(i => i.id === listing.itemId);
        if (itemIndex !== -1) {
            items[itemIndex].is_locked = false;
            saveInventory(items);
        }

        return { success: true, message: 'Venta cancelada' };
    },

    async updateListingPrice(listingId, newPrice) {
        await this._delay();
        const listings = getStoredListings();
        const listing = listings.find(l => l.id === listingId);
        if (!listing) throw new Error('Publicación no encontrada');

        listing.price = parseFloat(newPrice);
        saveListings(listings);
        return { success: true, message: 'Precio actualizado' };
    },

    async getMarketListings() {
        await this._delay();
        return { success: true, listings: getStoredListings() };
    },

    async getDailyPurchaseStatus() {
        await this._delay();
        return { dailyTotal: 150, dailyLimit: 2000, remaining: 1850, limitReached: false };
    },

    async getActiveTrades() {
        await this._delay();
        // Return mock trades if needed, or empty
        return { success: true, trades: [] };
    },

    async purchaseItem(listingId) {
        await this._delay();
        const listings = getStoredListings();
        const index = listings.findIndex(l => l.id === listingId);
        if (index === -1) throw new Error('Publicación no encontrada'); // Could be already sold

        const listing = listings[index];
        // Simulate purchase logic: remove listing, transfer item
        listings.splice(index, 1);
        saveListings(listings);

        // In a full mock, we would also add the item to the buyer's inventory, 
        // but for now we just return success like the backend
        return {
            success: true,
            message: 'Compra realizada con éxito',
            itemName: listing.item.name,
            pricePaid: listing.price,
            newBalance: 1000 - listing.price, // Mock balance
            transactionId: `tx-${Date.now()}`
        };
    },

    async buyGame(userId, gameId) {
        await this._delay();
        return {
            success: true,
            message: 'Juego comprado con éxito y añadido a tu biblioteca (Mock)'
        };
    }
};
