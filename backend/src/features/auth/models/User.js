import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'developer'], // Roles para Tati
    default: 'user'
  },
  
  // --- CAMPOS DE SEGURIDAD (GRUPO 3 - ANGEL) ---
  
  // Para evitar fuerza bruta (Tarea 1)
  loginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockUntil: { 
    type: Date 
  },

  // Para Doble Factor de Autenticación (Tarea 3)
  mfaSecret: { 
    type: String 
  },
  mfaEnabled: { 
    type: Boolean, 
    default: false 
  }

}, { timestamps: true });

// Método helper para verificar si está bloqueado
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

export default mongoose.model('User', userSchema);