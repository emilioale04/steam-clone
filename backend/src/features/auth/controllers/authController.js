import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res) {
    try {
      const { email, password, username } = req.body;
      
      const data = await authService.signUp(email, password, { username });
      
      // Don't set any cookie - user must verify email first
      res.status(201).json({
        success: true,
        data: {
          emailVerificationPending: true,
          email: email
        },
        message: 'Registro exitoso. Por favor, verifica tu correo electrónico para activar tu cuenta.'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const data = await authService.signIn(email, password);
      
      // Set httpOnly cookie with access token (secure against XSS)
      if (data.session?.access_token) {
        res.cookie('access_token', data.session.access_token, {
          httpOnly: true,           // Not accessible via JavaScript
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          sameSite: 'strict',       // CSRF protection
          maxAge: 60 * 60 * 1000,   // 1 hour (match Supabase token expiry)
          path: '/'                 // Available for all routes
        });
      }
      
      // Don't send token in response body - it's in the cookie
      res.status(200).json({
        success: true,
        data: {
          user: data.user
          // session token not exposed to JavaScript
        },
        message: 'Login successful'
      });
    } catch (error) {
      // Special handling for unverified email
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
        });
      }
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  },

  async resendVerification(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico es requerido'
        });
      }
      
      await authService.resendVerificationEmail(email);
      
      res.status(200).json({
        success: true,
        message: 'Correo de verificación enviado. Por favor, revisa tu bandeja de entrada.'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  async logout(req, res) {
    try {
      await authService.signOut();
      
      // Clear the httpOnly cookie
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  async getUser(req, res) {
    try {
      const user = await authService.getCurrentUser();
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      await authService.resetPasswordRequest(email);
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { password, accessToken, refreshToken } = req.body;
      
      const data = await authService.updatePassword(password, accessToken, refreshToken);
      
      res.status(200).json({
        success: true,
        data,
        message: 'Password updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};
