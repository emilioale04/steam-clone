
const API_URL = 'http://localhost:3000/api';

export const gameService = {
    async getFeaturedGame() {
        try {
            const response = await fetch(`${API_URL}/featured`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getFeaturedGame:', error);
            return { success: false, message: error.message };
        }
    },

    async getGames() {
        try {
            const response = await fetch(`${API_URL}/games`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getGames:', error);
            return { success: false, message: error.message };
        }
    },

    async searchGames(query) {
        try {
            const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in searchGames:', error);
            return { success: false, message: error.message };
        }
    }
};
