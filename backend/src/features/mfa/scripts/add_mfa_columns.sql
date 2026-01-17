-- Script SQL para agregar soporte de MFA/TOTP a la tabla de administradores
-- Ejecutar esto en Supabase SQL Editor

-- Agregar columnas de MFA a la tabla admins
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_habilitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;

-- Crear índice para consultas de MFA
CREATE INDEX IF NOT EXISTS idx_admins_mfa_habilitado ON admins(mfa_habilitado);

-- Comentarios para documentación
COMMENT ON COLUMN admins.mfa_secret IS 'Secreto TOTP en formato base32 para autenticación de dos factores';
COMMENT ON COLUMN admins.mfa_habilitado IS 'Indica si el administrador tiene MFA habilitado';
COMMENT ON COLUMN admins.mfa_backup_codes IS 'Códigos de respaldo en formato JSON para recuperación de cuenta';
