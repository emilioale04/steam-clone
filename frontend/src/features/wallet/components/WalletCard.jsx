import { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

// Montos predefinidos para recarga rápida
const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export const WalletCard = () => {
    const { 
        balance, 
        loading, 
        error, 
        reloadWallet, 
        transactions,
        transactionsLoading,
        fetchTransactions
    } = useWallet();
    
    const [reloadAmount, setReloadAmount] = useState('');
    const [isReloading, setIsReloading] = useState(false);
    const [reloadError, setReloadError] = useState(null);
    const [reloadSuccess, setReloadSuccess] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    /**
     * Maneja la recarga de la billetera
     */
    const handleReload = async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(reloadAmount);
        
        // Validaciones del lado del cliente
        if (isNaN(amount) || amount <= 0) {
            setReloadError('Ingresa un monto válido');
            return;
        }
        
        if (amount < 1) {
            setReloadError('El monto mínimo es $1.00');
            return;
        }
        
        if (amount > 500) {
            setReloadError('El monto máximo es $500.00');
            return;
        }

        setIsReloading(true);
        setReloadError(null);
        setReloadSuccess(null);

        const result = await reloadWallet(amount);

        if (result.success) {
            setReloadSuccess(`¡Recarga exitosa! Nuevo balance: $${result.newBalance.toFixed(2)}`);
            setReloadAmount('');
            // Limpiar mensaje de éxito después de 5 segundos
            setTimeout(() => setReloadSuccess(null), 5000);
        } else {
            setReloadError(result.error);
        }

        setIsReloading(false);
    };

    /**
     * Selecciona un monto predefinido
     */
    const selectPresetAmount = (amount) => {
        setReloadAmount(amount.toString());
        setReloadError(null);
    };

    /**
     * Carga el historial de transacciones
     */
    const handleShowHistory = async () => {
        if (!showHistory && transactions.length === 0) {
            await fetchTransactions();
        }
        setShowHistory(!showHistory);
    };

    /**
     * Formatea una fecha
     */
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * Obtiene el ícono según el tipo de transacción
     */
    const getTransactionIcon = (type) => {
        if (type === 'reload') {
            return <ArrowDownLeft className="text-green-400" size={16} />;
        }
        return <ArrowUpRight className="text-red-400" size={16} />;
    };

    if (loading) {
        return (
            <div className="bg-[#16202d] rounded-xl p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-400" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#16202d] rounded-xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-3 rounded-xl">
                            <Wallet className="text-blue-400" size={28} />
                        </div>
                        <div>
                            <h2 className="text-white text-lg font-semibold">Mi Billetera</h2>
                            <p className="text-gray-400 text-sm">Balance disponible</p>
                        </div>
                    </div>
                </div>
                
                <div className="text-4xl font-bold text-white mb-2">
                    ${balance.toFixed(2)}
                    <span className="text-gray-400 text-lg ml-2">USD</span>
                </div>

                {error && (
                    <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {/* Reload Section */}
            <div className="bg-[#16202d] rounded-xl p-6">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-green-400" />
                    Recargar Billetera
                </h3>

                {/* Preset Amounts */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {PRESET_AMOUNTS.map((amount) => (
                        <button
                            key={amount}
                            onClick={() => selectPresetAmount(amount)}
                            disabled={isReloading}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                reloadAmount === amount.toString()
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#1b2838] text-gray-300 hover:bg-[#2a475e] hover:text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            ${amount}
                        </button>
                    ))}
                </div>

                {/* Custom Amount Form */}
                <form onSubmit={handleReload} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            O ingresa un monto personalizado
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                value={reloadAmount}
                                onChange={(e) => {
                                    setReloadAmount(e.target.value);
                                    setReloadError(null);
                                }}
                                placeholder="0.00"
                                min="1"
                                max="500"
                                step="0.01"
                                disabled={isReloading}
                                className="w-full bg-[#1b2838] border border-gray-700 rounded-lg py-3 pl-8 pr-4 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                            />
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                            Mínimo $1.00 • Máximo $500.00 • Límite diario $1,000.00
                        </p>
                    </div>

                    {/* Error Message */}
                    {reloadError && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                            <AlertCircle size={18} />
                            {reloadError}
                        </div>
                    )}

                    {/* Success Message */}
                    {reloadSuccess && (
                        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-lg">
                            <CheckCircle size={18} />
                            {reloadSuccess}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isReloading || !reloadAmount}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isReloading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Plus size={20} />
                                Recargar ${reloadAmount || '0.00'}
                            </>
                        )}
                    </button>
                </form>

                <p className="text-gray-500 text-xs mt-4 text-center">
                    Esta es una recarga simulada para fines de demostración.
                </p>
            </div>

            {/* Transaction History Toggle */}
            <div className="bg-[#16202d] rounded-xl p-6">
                <button
                    onClick={handleShowHistory}
                    className="w-full flex items-center justify-between text-white hover:text-blue-400 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Clock size={20} />
                        <span className="font-semibold">Historial de Transacciones</span>
                    </div>
                    <span className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>

                {/* Transaction List */}
                {showHistory && (
                    <div className="mt-4 space-y-3">
                        {transactionsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-blue-400" size={24} />
                            </div>
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3 bg-[#1b2838] rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            tx.type === 'reload' 
                                                ? 'bg-green-500/20' 
                                                : 'bg-red-500/20'
                                        }`}>
                                            {getTransactionIcon(tx.type)}
                                        </div>
                                        <div>
                                            <div className="text-white text-sm font-medium">
                                                {tx.description || (tx.type === 'reload' ? 'Recarga' : 'Compra')}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {formatDate(tx.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-semibold ${
                                        tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 text-center py-8">
                                <Clock className="mx-auto mb-2 opacity-50" size={32} />
                                <p>No hay transacciones aún</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
