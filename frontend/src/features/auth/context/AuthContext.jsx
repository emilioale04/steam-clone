import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
// import { authService } from '../services/authService';
import { mockAuthService as authService } from '../services/mockAuthService';

const AuthContext = createContext(null);

export const ROLES = {
    LIMITED: 'Limitado',
    STANDARD: 'Estándar',
    FAMILY: 'Familiar',
    DEVELOPER: 'Developer',
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [emailVerificationPending, setEmailVerificationPending] = useState(false);
    const [pendingEmail, setPendingEmail] = useState(null);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const data = await authService.getCurrentUser();
            // Ensure user has a role, default to STANDARD if not provided by backend
            const userData = data.data;
            if (userData && !userData.role) {
                userData.role = ROLES.STANDARD;
            }
            setUser(userData);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, username) => {
        try {
            setError(null);
            const data = await authService.register(email, password, username);
            if (data.data?.emailVerificationPending) {
                setEmailVerificationPending(true);
                setPendingEmail(data.data.email);
                setUser(null);
            }
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const data = await authService.login(email, password);
            const userData = data.data.user;

            // Mock role assignment for demonstration if backend doesn't support it yet
            // You can remove this override once backend sends 'role'
            if (!userData.role) userData.role = ROLES.STANDARD;

            setUser(userData);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        try {
            setError(null);
            await authService.logout();
            setUser(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const clearEmailVerificationPending = () => {
        setEmailVerificationPending(false);
        setPendingEmail(null);
    };

    const hasRole = (requiredRoles) => {
        if (!user) return false;
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(user.role);
        }
        return user.role === requiredRoles;
    };

    // Debug helper to switch roles manually in dev
    const debugSetRole = (role) => {
        if (user && Object.values(ROLES).includes(role)) {
            setUser({ ...user, role });
        }
    };

    const value = useMemo(() => ({
        user,
        loading,
        error,
        emailVerificationPending,
        pendingEmail,
        register,
        login,
        logout,
        clearEmailVerificationPending,
        isAuthenticated: !!user,
        hasRole,
        roles: ROLES,
        debugSetRole // Exported for testing/demo purposes
    }), [user, loading, error, emailVerificationPending, pendingEmail]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
