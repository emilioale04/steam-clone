export const mockAuthService = {
    // Simula latencia de red
    async _delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async register(email, password, username) {
        await this._delay();
        // Simular que el correo ya existe si es una dirección específica
        if (email === 'existe@test.com') {
            throw new Error('El correo electrónico ya está registrado');
        }

        return {
            success: true,
            message: 'Registro exitoso. Por favor verifica tu correo.',
            data: {
                email,
                emailVerificationPending: true
            }
        };
    },

    async login(email, password) {
        await this._delay();

        // Simular credenciales incorrectas
        if (password === 'wrong') {
            const error = new Error('Credenciales inválidas');
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }

        // Simular usuario no verificado
        if (email === 'noverificado@test.com') {
            const error = new Error('Cuenta no verificada');
            error.code = 'EMAIL_NOT_VERIFIED';
            throw error;
        }

        const mockUser = {
            id: 'mock-user-123',
            email: email,
            username: email.split('@')[0],
            role: 'Estándar', // Por defecto "Estándar"
            created_at: new Date().toISOString()
        };

        // Guardar en localStorage para simular sesión persistente
        localStorage.setItem('mock_session_user', JSON.stringify(mockUser));

        return {
            success: true,
            data: {
                user: mockUser
            }
        };
    },

    async resendVerificationEmail(email) {
        await this._delay();
        return {
            success: true,
            message: 'Correo de verificación reenviado'
        };
    },

    async logout() {
        await this._delay();
        localStorage.removeItem('mock_session_user');
        return {
            success: true,
            message: 'Sesión cerrada correctamente'
        };
    },

    async getCurrentUser() {
        await this._delay();
        const storedUser = localStorage.getItem('mock_session_user');

        if (!storedUser) {
            throw new Error('No hay sesión activa');
        }

        const user = JSON.parse(storedUser);

        return {
            success: true,
            data: user
        };
    },

    async forgotPassword(email) {
        await this._delay();
        return {
            success: true,
            message: 'Si el correo existe, recibirás un enlace de recuperación'
        };
    },

    async resetPassword(password, accessToken, refreshToken) {
        await this._delay();
        return {
            success: true,
            message: 'Contraseña actualizada correctamente'
        };
    }
};
