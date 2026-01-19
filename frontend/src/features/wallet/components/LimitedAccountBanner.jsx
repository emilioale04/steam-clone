import { useState, useEffect } from 'react';
import { walletService } from '../services/walletService.js';
import { useNavigate } from 'react-router-dom';
import './LimitedAccountBanner.css';

/**
 * LimitedAccountBanner
 * Muestra un banner informativo cuando la cuenta está limitada
 * Permite al usuario ir directamente a recargar su billetera
 */
const LimitedAccountBanner = ({ onStatusChange }) => {
    const [accountStatus, setAccountStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadAccountStatus();
    }, []);

    const loadAccountStatus = async () => {
        try {
            const status = await walletService.getAccountStatus();
            setAccountStatus(status);
            
            if (onStatusChange) {
                onStatusChange(status);
            }
        } catch (error) {
            console.error('Error loading account status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReloadClick = () => {
        navigate('/wallet');
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    // No mostrar si está cargando, si la cuenta no está limitada, o si fue descartado
    if (loading || !accountStatus?.isLimited || dismissed) {
        return null;
    }

    return (
        <div className="limited-account-banner">
            <div className="banner-content">
                <div className="banner-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <div className="banner-text">
                    <strong>Cuenta Limitada</strong>
                    <p>
                        No puedes comprar, vender ni intercambiar artículos hasta que recargues 
                        al menos <span className="highlight">${accountStatus.unlockAmount.toFixed(2)}</span> en tu billetera.
                        {accountStatus.totalReloaded > 0 && (
                            <> Ya has recargado ${accountStatus.totalReloaded.toFixed(2)}. 
                            Te faltan <span className="highlight">${accountStatus.remaining.toFixed(2)}</span>.</>
                        )}
                    </p>
                </div>
                <div className="banner-actions">
                    <button 
                        className="reload-button"
                        onClick={handleReloadClick}
                    >
                        Recargar Billetera
                    </button>
                    <button 
                        className="dismiss-button"
                        onClick={handleDismiss}
                        title="Descartar"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LimitedAccountBanner;
