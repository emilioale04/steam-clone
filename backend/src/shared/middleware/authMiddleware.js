import supabase from '../config/supabase.js';

/**
 * Middleware para requerir autenticación de usuario normal
 * Supports both httpOnly cookies (preferred) and Authorization header (fallback)
 * Also verifies that email is confirmed
 */
export const requireAuth = async (req, res, next) => {
    try {
        // Priority 1: httpOnly cookie (most secure)
        // Priority 2: Authorization header (for API clients)
        let token = req.cookies?.access_token;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autorización no proporcionado'
            });
        }

        // Verificar token con Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Verify email is confirmed
        if (!user.email_confirmed_at) {
            return res.status(403).json({
                success: false,
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Debes verificar tu correo electrónico para acceder a esta función'
            });
        }

        // Adjuntar usuario al request
        req.user = user;
        next();
    } catch (error) {
        console.error('[AUTH MIDDLEWARE] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno de autenticación'
        });
    }
};

/**
 * Middleware opcional para identificar al usuario si existe token, pero no bloquea
 * Supports both httpOnly cookies (preferred) and Authorization header (fallback)
 * Only sets user if email is verified
 */
export const optionalAuth = async (req, res, next) => {
    try {
        // Priority 1: httpOnly cookie (most secure)
        // Priority 2: Authorization header (for API clients)
        let token = req.cookies?.access_token;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (token) {
            const { data: { user } } = await supabase.auth.getUser(token);
            // Only set user if email is verified
            if (user && user.email_confirmed_at) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        next();
    }
};
