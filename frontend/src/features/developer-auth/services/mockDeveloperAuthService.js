
export const mockDeveloperAuthService = {
    async _delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async obtenerPerfil() {
        await this._delay();
        const stored = localStorage.getItem('mock_developer');
        if (!stored) throw new Error('No hay sesión de desarrollador');
        const data = JSON.parse(stored);
        return { data, success: true };
    },

    async registrar(datos) {
        await this._delay();
        const mockDev = {
            user: { id: 'dev-user-1', email: datos.email, role: 'Developer' },
            desarrollador: { id: 'dev-1', nombre: datos.nombre, ...datos }
        };
        localStorage.setItem('mock_developer', JSON.stringify(mockDev));
        return { data: mockDev, success: true };
    },

    async login(email, password) {
        await this._delay();
        if (password === 'wrong') throw new Error('Credenciales inválidas');
        const mockDev = {
            user: { id: 'dev-user-1', email, role: 'Developer' },
            desarrollador: { id: 'dev-1', nombre: 'Mock Developer', email }
        };
        localStorage.setItem('mock_developer', JSON.stringify(mockDev));
        return { data: mockDev, success: true };
    },

    async logout() {
        await this._delay();
        localStorage.removeItem('mock_developer');
        return { success: true };
    }
};
