const API_URL = 'http://localhost:3000/api/auth';

export const authService = {
  async register(email, password, username) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
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
      credentials: 'include', // Include cookies - backend sets httpOnly cookie
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) {
      // Preserve error code for special handling
      const error = new Error(data.message);
      if (data.code) error.code = data.code;
      throw error;
    }
    return data;
  },

  async resendVerificationEmail(email) {
    const response = await fetch(`${API_URL}/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async logout() {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include' // Include cookies - backend clears httpOnly cookie
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async getCurrentUser() {
    const response = await fetch(`${API_URL}/user`, {
      credentials: 'include' // Include cookies for auth
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
      credentials: 'include',
      body: JSON.stringify({ password, accessToken, refreshToken })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  }
};
