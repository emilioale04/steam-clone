
const MOCK_ADMIN = {
    id: 'admin-1',
    email: 'admin@steamclone.com',
    name: 'Super Admin',
    role: 'ADMIN'
};

export const mockAdminAuthService = {
    async _delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    isAuthenticated() {
        return !!localStorage.getItem('mock_admin_token');
    },

    getCurrentUser() {
        const stored = localStorage.getItem('mock_admin_user');
        return stored ? JSON.parse(stored) : null;
    },

    async validateSession() {
        await this._delay();
        if (!this.isAuthenticated()) throw new Error('Sesión inválida');
        return { success: true, user: this.getCurrentUser() };
    },

    async login(email, password) {
        await this._delay();
        if (email === 'admin@test.com' && password === 'admin') {
            localStorage.setItem('mock_admin_token', 'mock-token-abc');
            localStorage.setItem('mock_admin_user', JSON.stringify(MOCK_ADMIN));
            return { success: true, user: MOCK_ADMIN, token: 'mock-token-abc' };
        }
        throw new Error('Credenciales inválidas (Use: admin@test.com / admin)');
    },

    async logout() {
        await this._delay();
        localStorage.removeItem('mock_admin_token');
        localStorage.removeItem('mock_admin_user');
        return { success: true };
    }
};

export default mockAdminAuthService;
