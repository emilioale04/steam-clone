
const generateIdempotencyKey = (prefix = 'op') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getStoredWallet = () => {
    const stored = localStorage.getItem('mock_wallet');
    if (stored) return JSON.parse(stored);
    return { balance: 0, transactions: [] };
};

const saveWallet = (wallet) => {
    localStorage.setItem('mock_wallet', JSON.stringify(wallet));
};

export const mockWalletService = {
    async _delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async getBalance() {
        await this._delay();
        const wallet = getStoredWallet();
        return wallet.balance;
    },

    async reloadWallet(amount) {
        await this._delay();
        const wallet = getStoredWallet();
        const newBalance = wallet.balance + amount;

        const transaction = {
            id: generateIdempotencyKey('tx'),
            type: 'reload',
            amount: amount,
            description: 'Recarga de saldo',
            created_at: new Date().toISOString()
        };

        wallet.balance = newBalance;
        wallet.transactions.unshift(transaction);
        saveWallet(wallet);

        return {
            newBalance,
            transactionId: transaction.id
        };
    },

    async processPayment(amount, description, referenceType = null, referenceId = null) {
        await this._delay();
        const wallet = getStoredWallet();

        if (wallet.balance < amount) {
            throw new Error('Fondos insuficientes');
        }

        const newBalance = wallet.balance - amount;
        const transaction = {
            id: generateIdempotencyKey('tx'),
            type: 'payment',
            amount: -amount,
            description: description || 'Pago procesado',
            referenceType,
            referenceId,
            created_at: new Date().toISOString()
        };

        wallet.balance = newBalance;
        wallet.transactions.unshift(transaction);
        saveWallet(wallet);

        return {
            newBalance,
            transactionId: transaction.id
        };
    },

    async getTransactionHistory(limit = 20, offset = 0) {
        await this._delay();
        const wallet = getStoredWallet();
        const transactions = wallet.transactions.slice(offset, offset + limit);

        return {
            transactions,
            pagination: {
                total: wallet.transactions.length,
                limit,
                offset
            }
        };
    },

    generateIdempotencyKey
};
