import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res) {
    try {
      const { email, password, username } = req.body;
      
      const data = await authService.signUp(email, password, { username });
      
      res.status(201).json({
        success: true,
        data,
        message: 'User registered successfully'
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
      
      res.status(200).json({
        success: true,
        data,
        message: 'Login successful'
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  },

  async logout(req, res) {
    try {
      await authService.signOut();
      
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
