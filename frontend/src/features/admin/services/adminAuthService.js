const API_URL = 'http://localhost:3000/api/admin';

const getHeaders = () => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

const adminAuthService = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
    
    // Si requiere configurar MFA (primera vez)
    if (data.requiresSetupMFA) {
      return {
        requiresSetupMFA: true,
        adminId: data.adminId,
        email: data.email,
        tempToken: data.tempToken
      };
    }
    
    // Si requiere verificar MFA (ya configurado)
    if (data.requiresMFA) {
      return {
        requiresMFA: true,
        adminId: data.adminId,
        email: data.email
      };
    }
    
    // Login exitoso
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Logout de administrador
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: getHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error al cerrar sesión:', data.message);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
  },

  // Administración de sesiones actuales
  getCurrentUser: () => {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('adminToken');
  },

  validateSession: async () => {
    const response = await fetch(`${API_URL}/validate-session`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      throw new Error(data.message || 'Sesión inválida');
    }
    
    return data;
  },
};

// Audit Logs
export const getAuditLogs = async (limit = 50, offset = 0) => {
  const response = await fetch(`${API_URL}/audit-logs?limit=${limit}&offset=${offset}`, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener logs');
  }
  
  return data.data;
};

export const getLogsAdmin = async (limit = 50, offset = 0) => {
  const response = await fetch(`${API_URL}/logs-admin?limit=${limit}&offset=${offset}`, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener logs de admin');
  }
  
  return data.data;
};

export const getLogsDesarrolladores = async (limit = 50, offset = 0) => {
  const response = await fetch(`${API_URL}/logs-desarrolladores?limit=${limit}&offset=${offset}`, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener logs de desarrolladores');
  }
  
  return data.data;
};

export const getLogsComunidad = async (limit = 50, offset = 0) => {
  const response = await fetch(`${API_URL}/logs-comunidad?limit=${limit}&offset=${offset}`, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener logs de comunidad');
  }
  
  return data.data;
};

// Bloqueo de Países
export const getBloqueoPaises = async () => {
  const response = await fetch(`${API_URL}/bloqueos-paises`, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener bloqueos');
  }
  
  return data.data;
};

export const createBloqueoPais = async (bloqueData) => {
  const response = await fetch(`${API_URL}/bloqueos-paises`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bloqueData)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al crear bloqueo');
  }
  
  return data.data;
};

export const updateBloqueoPais = async (id, bloqueData) => {
  const response = await fetch(`${API_URL}/bloqueos-paises/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(bloqueData)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al actualizar bloqueo');
  }
  
  return data.data;
};

export const deleteBloqueoPais = async (id) => {
  const response = await fetch(`${API_URL}/bloqueos-paises/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al eliminar bloqueo');
  }
  
  return data;
};

// Revisión de Juegos
export const getRevisionesJuegos = async (estado = null) => {
  const url = estado 
    ? `${API_URL}/revisiones-juegos?estado=${estado}`
    : `${API_URL}/revisiones-juegos`;
    
  const response = await fetch(url, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener revisiones');
  }
  
  return data.data;
};

export const getInfoJuegoRevision = async (idJuego) => {
  const response = await fetch(`${API_URL}/revisiones-juegos/info/${idJuego}`, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener información del juego');
  }
  
  return data.data;
};

export const aprobarJuego = async (id, comentarios = '') => {
  const response = await fetch(`${API_URL}/revisiones-juegos/${id}/aprobar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ comentarios })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al aprobar juego');
  }
  
  return data.data;
};

export const rechazarJuego = async (id, comentarios) => {
  const response = await fetch(`${API_URL}/revisiones-juegos/${id}/rechazar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ comentarios })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al rechazar juego');
  }
  
  return data.data;
};

// Sanciones
export const getSanciones = async (activa = null, usuario_id = null) => {
  let url = `${API_URL}/sanciones?`;
  if (activa !== null) url += `activa=${activa}&`;
  if (usuario_id) url += `usuario_id=${usuario_id}`;
  
  const response = await fetch(url, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener sanciones');
  }
  
  return data.data;
};

export const crearSancion = async (sancionData) => {
  const response = await fetch(`${API_URL}/sanciones`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sancionData)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al crear sanción');
  }
  
  return data.data;
};

export const desactivarSancion = async (id) => {
  const response = await fetch(`${API_URL}/sanciones/${id}/desactivar`, {
    method: 'PUT',
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al desactivar sanción');
  }
  
  return data.data;
};

// Categorías
export const getCategorias = async () => {
  const response = await fetch(`${API_URL}/categorias`, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener categorías');
  }
  
  return data.data;
};

export const crearCategoria = async (categoriaData) => {
  const response = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(categoriaData)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al crear categoría');
  }
  
  return data.data;
};

export const updateCategoria = async (id, categoriaData) => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(categoriaData)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al actualizar categoría');
  }
  
  return data.data;
};

export const deleteCategoria = async (id) => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al eliminar categoría');
  }
  
  return data;
};

// Reportes de Ban
export const getReportesBan = async (estado = null) => {
  let url = `${API_URL}/reportes-ban`;
  if (estado) url += `?estado=${estado}`;
  
  const response = await fetch(url, {
    headers: getHeaders()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener reportes de ban');
  }
  
  return data.data;
};

export const aprobarReporteBan = async (id, comentarios, duracion_minutos) => {
  const response = await fetch(`${API_URL}/reportes-ban/${id}/aprobar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ comentarios, duracion_minutos })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al aprobar reporte');
  }
  
  return data.data;
};

export const rechazarReporteBan = async (id, comentarios) => {
  const response = await fetch(`${API_URL}/reportes-ban/${id}/rechazar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ comentarios })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al rechazar reporte');
  }
  
  return data.data;
};

// Verificar código MFA para operaciones administrativas
export const verifyMFACode = async (code) => {
  const adminData = localStorage.getItem('adminUser');
  const admin = adminData ? JSON.parse(adminData) : null;
  
  if (!admin || !admin.id) {
    throw new Error('No se encontró información del administrador');
  }

  const response = await fetch('http://localhost:3000/api/mfa/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify({ 
      userId: admin.id, 
      token: code,
      userType: 'admin'
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Código inválido');
  }
  
  return data;
};

export default adminAuthService;
