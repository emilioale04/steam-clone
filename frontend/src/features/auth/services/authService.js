const API_URL = 'http://localhost:3000/api/auth';

export const authService = {
  async register(email, password, username) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async logout() {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST'
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async getCurrentUser() {
    const response = await fetch(`${API_URL}/user`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async resetPassword(password, accessToken, refreshToken) {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, accessToken, refreshToken })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  }
};
