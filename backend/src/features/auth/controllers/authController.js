import { authService } from '../services/authService.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.signIn(email, password);

    // Caso A: Pide MFA
    if (result.requireMfa) {
      // No damos la cookie todavía, pedimos el código
      return res.json({ 
        requireMfa: true, 
        userId: result.userId,
        tempToken: result.tempSession.access_token // Token temporal para validar el siguiente paso
      });
    }

    // Caso B: Login directo
    // TAREA 4: Cookie Segura
    res.cookie('access_token', result.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600 * 1000 // 1 hora
    });

    res.json({ user: result.user, message: "Bienvenido a SteamClone" });

  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    await authService.signUp(email, password, username);
    res.status(201).json({ message: "Usuario creado. Revisa tu correo." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Validar MFA para completar el login
export const verifyMfaLogin = async (req, res) => {
  try {
    const { userId, token, tempToken } = req.body;
    const isValid = await authService.verifyMfa(userId, token);

    if (!isValid) return res.status(401).json({ error: "Código incorrecto" });

    // Si es válido, ahora sí establecemos la cookie de sesión real
    res.cookie('access_token', tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600 * 1000
    });

    res.json({ message: "Autenticación de dos factores exitosa" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setupMfa = async (req, res) => {
  try {
    const { userId } = req.body; 
    const data = await authService.generateMfaSecret(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: "Sesión cerrada" });
};