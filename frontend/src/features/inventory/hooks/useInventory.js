import { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';

export const useInventory = (userId) => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getInventory(userId);
            setInventory(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const syncInventory = async (steamItems) => {
        try {
            await inventoryService.syncInventory(steamItems);
            await fetchInventory(); // Recargar después de sincronizar
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchInventory();
        }
    }, [userId]);

    return { inventory, loading, error, syncInventory, refetch: fetchInventory };
};
