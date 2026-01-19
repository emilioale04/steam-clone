import { useState, useEffect, useCallback, useRef } from 'react';
import { walletService } from '../services/walletService';

/**
 * Hook para gestionar la billetera del usuario
 * Incluye protección contra doble-click y estado optimista
 */
export const useWallet = () => {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    
    // Referencias para prevenir operaciones duplicadas
    const isReloading = useRef(false);
    const isPaying = useRef(false);

    /**
     * Carga el balance del usuario
     */
    const fetchBalance = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const balance = await walletService.getBalance();
            setBalance(balance);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Recarga la billetera con protección contra doble-click
     * @param {number} amount - Monto a recargar
     * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
     */
    const reloadWallet = useCallback(async (amount) => {
        // Prevenir doble-click
        if (isReloading.current) {
            return { 
                success: false, 
                error: 'Operación en proceso. Por favor espera.' 
            };
        }

        isReloading.current = true;
        setError(null);

        try {
            const result = await walletService.reloadWallet(amount);
            
            // Actualizar balance con el valor del servidor
            setBalance(result.newBalance);
            
            // Refrescar transacciones si ya se habían cargado
            if (transactions.length > 0) {
                fetchTransactions();
            }

            return { 
                success: true, 
                newBalance: result.newBalance,
                transactionId: result.transactionId
            };
        } catch (err) {
            setError(err.message);
            return { 
                success: false, 
                error: err.message 
            };
        } finally {
            // Liberar el bloqueo después de un pequeño delay
            setTimeout(() => {
                isReloading.current = false;
            }, 1000);
        }
    }, [transactions.length]);

    /**
     * Procesa un pago con protección contra compras duplicadas
     * @param {number} amount - Monto a pagar
     * @param {string} description - Descripción
     * @param {string} referenceType - Tipo (game, item, etc)
     * @param {string} referenceId - ID del elemento
     * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
     */
    const processPayment = useCallback(async (amount, description, referenceType = null, referenceId = null) => {
        // Prevenir doble-click
        if (isPaying.current) {
            return { 
                success: false, 
                error: 'Pago en proceso. No realices múltiples clicks.' 
            };
        }

        // Validación local de fondos
        if (balance < amount) {
            return {
                success: false,
                error: `Fondos insuficientes. Tu balance es $${balance.toFixed(2)}`
            };
        }

        isPaying.current = true;
        setError(null);

        // Estado optimista - restar localmente primero
        const previousBalance = balance;
        setBalance(prev => prev - amount);

        try {
            const result = await walletService.processPayment(
                amount,
                description,
                referenceType,
                referenceId
            );
            
            // Actualizar con el balance real del servidor
            setBalance(result.newBalance);
            
            // Refrescar transacciones
            if (transactions.length > 0) {
                fetchTransactions();
            }

            return { 
                success: true, 
                newBalance: result.newBalance,
                transactionId: result.transactionId
            };
        } catch (err) {
            // Revertir el estado optimista en caso de error
            setBalance(previousBalance);
            setError(err.message);
            return { 
                success: false, 
                error: err.message 
            };
        } finally {
            setTimeout(() => {
                isPaying.current = false;
            }, 1000);
        }
    }, [balance, transactions.length]);

    /**
     * Carga el historial de transacciones
     */
    const fetchTransactions = useCallback(async (limit = 20, offset = 0) => {
        try {
            setTransactionsLoading(true);
            const result = await walletService.getTransactionHistory(limit, offset);
            setTransactions(result.transactions);
            return result;
        } catch (err) {
            setError(err.message);
            return { transactions: [], pagination: {} };
        } finally {
            setTransactionsLoading(false);
        }
    }, []);

    /**
     * Verifica si el usuario tiene fondos suficientes
     * @param {number} amount 
     * @returns {boolean}
     */
    const hasSufficientFunds = useCallback((amount) => {
        return balance >= amount;
    }, [balance]);

    // Cargar balance al montar
    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return {
        // Estado
        balance,
        loading,
        error,
        transactions,
        transactionsLoading,
        
        // Acciones
        reloadWallet,
        processPayment,
        fetchBalance,
        fetchTransactions,
        
        // Helpers
        hasSufficientFunds,
        
        // Estado de operaciones
        isReloading: isReloading.current,
        isPaying: isPaying.current
    };
};
