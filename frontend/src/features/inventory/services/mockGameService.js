
const MOCK_GAMES = [
    {
        id: '1',
        title: 'Cyberpunk 2077',
        description: 'Cyberpunk 2077 es una historia de acción y aventura de mundo abierto ambientada en Night City, una megalópolis obsesionada con el poder, el glamour y la modificación corporal.',
        price: 59.99,
        discount: 50,
        rating: 4.5,
        genre: 'RPG',
        image: 'cyberpunk.jpg'
    },
    {
        id: '2',
        title: 'Elden Ring',
        description: 'EL NUEVO RPG DE ACCIÓN Y FANTASÍA. Levántate, Sinluz, y déjate guiar por la gracia para esgrimir el poder del Anillo de Elden y convertirte en un Señor de Elden en las Tierras Intermedias.',
        price: 59.99,
        discount: 0,
        rating: 4.9,
        genre: 'RPG',
        image: 'eldenring.jpg'
    },
    {
        id: '3',
        title: 'Stardew Valley',
        description: 'Has heredado la vieja parcela agrícola de tu abuelo en Stardew Valley. Armado con herramientas heredadas y unas pocas monedas, te dispones a comenzar tu nueva vida.',
        price: 14.99,
        discount: 20,
        rating: 4.8,
        genre: 'Simulación',
        image: 'stardew.jpg'
    },
    {
        id: '4',
        title: 'Hollow Knight',
        description: '¡Forja tu propio camino en Hollow Knight! Una aventura de acción clásica a través de un vasto mundo interconectado de insectos y héroes.',
        price: 14.99,
        discount: 0,
        rating: 4.9,
        genre: 'Metroidvania',
        image: 'hollowknight.jpg'
    },
    {
        id: '5',
        title: 'Red Dead Redemption 2',
        description: 'Ganador de más de 175 premios al Juego del Año y receptor de más de 250 puntuaciones perfectas, RDR2 es la historia épica del forajido Arthur Morgan y la infame banda de Van der Linde.',
        price: 59.99,
        discount: 67,
        rating: 4.8,
        genre: 'Acción',
        image: 'rdr2.jpg'
    }
];

export const mockGameService = {
    async _delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async getFeaturedGame() {
        await this._delay();
        return {
            success: true,
            game: MOCK_GAMES[0]
        };
    },

    async getGames() {
        await this._delay();
        return {
            success: true,
            games: MOCK_GAMES.slice(1)
        };
    },

    async searchGames(query) {
        await this._delay();
        const lowerQuery = query.toLowerCase();
        const filtered = MOCK_GAMES.filter(g =>
            g.title.toLowerCase().includes(lowerQuery) ||
            g.description.toLowerCase().includes(lowerQuery)
        );
        return {
            success: true,
            games: filtered
        };
    }
};
