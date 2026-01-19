
const getStoredTrades = () => {
    const stored = localStorage.getItem('mock_trades');
    return stored ? JSON.parse(stored) : [];
};

const saveTrades = (trades) => {
    localStorage.setItem('mock_trades', JSON.stringify(trades));
};

export const mockTradeService = {
    async _delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async getTradeLimitsStatus() {
        await this._delay();
        return { activeCount: 0, maxAllowed: 5, remaining: 5, limitReached: false, maxOffersPerTrade: 10 };
    },

    async getMyOffers() {
        await this._delay();
        return [];
    },

    async getTradesActive() {
        await this._delay();
        return { success: true, trades: getStoredTrades() };
    },

    async acceptTrade(id) {
        await this._delay();
        const trades = getStoredTrades();
        const trade = trades.find(t => t.id === id);
        if (trade) trade.status = 'COMPLETED';
        saveTrades(trades);
        return { success: true, message: 'Trade accepted' };
    },

    async postTrade(offererId, itemId) {
        await this._delay();
        const trades = getStoredTrades();
        const newTrade = {
            id: `trade-${Date.now()}`,
            offererId,
            itemId,
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            offers: []
        };
        trades.push(newTrade);
        saveTrades(trades);
        return newTrade;
    },

    async cancelTradeById(tradeId) {
        await this._delay();
        let trades = getStoredTrades();
        trades = trades.filter(t => t.id !== tradeId);
        saveTrades(trades);
        return { success: true, message: 'Trade cancelled' };
    },

    async postTradeOffer(offererId, tradeId, itemId) {
        await this._delay();
        const trades = getStoredTrades();
        const trade = trades.find(t => t.id === tradeId);
        if (!trade) throw new Error('Trade not found');

        trade.offers.push({
            id: `offer-${Date.now()}`,
            offererId,
            itemId,
            status: 'PENDING'
        });
        saveTrades(trades);
        return { success: true, message: 'Offer posted' };
    },

    async getTradeOffersByItemId(itemId) {
        await this._delay();
        return [];
    },

    async getOffersForTrade(tradeId) {
        await this._delay();
        const trades = getStoredTrades();
        const trade = trades.find(t => t.id === tradeId);
        return trade ? trade.offers : [];
    },

    async cancelTradeOffer(offerId) {
        await this._delay();
        return { success: true, message: 'Offer cancelled' };
    },

    async rejectTradeOffer(offerId) {
        await this._delay();
        return { success: true, message: 'Offer rejected' };
    }
};
