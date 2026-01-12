/**
 * Encryption Service - Cifrado a nivel de aplicación
 * Grupo 2 - Seguridad Steamworks
 * 
 * Implementa:
 * - RNF-003: Cifrado en reposo (capa adicional)
 * - C2: Cifrado AES-256 para datos ultra-sensibles
 * 
 * NOTA: Supabase ya proporciona cifrado en reposo (AES-256) por defecto.
 * Este servicio añade una capa ADICIONAL de cifrado a nivel de aplicación
 * para datos bancarios ultra-sensibles.
 */

import crypto from 'crypto';

// Clave de cifrado - DEBE estar en variable de entorno en producción
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'steamworks_encryption_key_change_in_production_2026_ultra_secret';

// Derivar una clave de 256 bits usando SHA-256
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // Para AES, el IV es de 16 bytes

/**
 * Cifra datos sensibles usando AES-256
 * @param {string} data - Datos a cifrar
 * @returns {string} - Datos cifrados (IV:ciphertext en formato hexadecimal)
 */
export function encrypt(data) {
  if (!data) return null;
  
  try {
    // Generar un IV aleatorio para cada cifrado
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combinar IV y datos cifrados (IV:encrypted)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error al cifrar datos:', error);
    throw new Error('Error al cifrar datos sensibles');
  }
}

/**
 * Descifra datos cifrados
 * @param {string} encryptedData - Datos cifrados (IV:ciphertext)
 * @returns {string} - Datos descifrados
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    // Separar IV y datos cifrados
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Unable to decrypt data');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    
    // Validar longitud del IV
    if (iv.length !== IV_LENGTH) {
      throw new Error('Unable to decrypt data');
    }
    
    const encrypted = parts[1];
    
    // Validar que los datos cifrados sean hexadecimales válidos
    if (!/^[0-9a-fA-F]+$/.test(encrypted)) {
      throw new Error('Unable to decrypt data');
    }
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error al descifrar datos:', error);
    throw new Error('Error al descifrar datos sensibles');
  }
}

/**
 * Cifra información bancaria sensible
 * @param {Object} bankData - Datos bancarios
 * @returns {Object} - Datos bancarios cifrados
 */
export function encryptBankData(bankData) {
  if (!bankData) return null;

  return {
    cuenta_bancaria: bankData.cuenta_bancaria ? encrypt(bankData.cuenta_bancaria) : null,
    titular_banco: bankData.titular_banco || null, // No cifrar nombre (no es ultra-sensible)
    nombre_banco: bankData.nombre_banco || null,
    nif_cif: bankData.nif_cif ? encrypt(bankData.nif_cif) : null // Cifrar NIF/CIF (dato fiscal sensible)
  };
}

/**
 * Descifra información bancaria
 * @param {Object} encryptedBankData - Datos bancarios cifrados
 * @returns {Object} - Datos bancarios descifrados
 */
export function decryptBankData(encryptedBankData) {
  if (!encryptedBankData) return null;

  return {
    cuenta_bancaria: encryptedBankData.cuenta_bancaria ? decrypt(encryptedBankData.cuenta_bancaria) : null,
    titular_banco: encryptedBankData.titular_banco || null,
    nombre_banco: encryptedBankData.nombre_banco || null,
    nif_cif: encryptedBankData.nif_cif ? decrypt(encryptedBankData.nif_cif) : null // Descifrar NIF/CIF
  };
}

/**
 * Hash de datos para verificación de integridad (SHA-256)
 * Implementa RNF-006: Integridad de archivos
 * @param {string} data - Datos a hashear
 * @returns {string} - Hash SHA-256
 */
export function hashSHA256(data) {
  if (!data) return null;
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verifica la integridad de datos comparando hashes
 * @param {string} data - Datos originales
 * @param {string} expectedHash - Hash esperado
 * @returns {boolean} - True si coinciden
 */
export function verifyIntegrity(data, expectedHash) {
  if (!data || !expectedHash) return false;
  
  const actualHash = hashSHA256(data);
  return actualHash === expectedHash;
}

/**
 * Enmascara datos sensibles para logs (muestra solo últimos 4 caracteres)
 * @param {string} data - Dato sensible
 * @returns {string} - Dato enmascarado
 */
export function maskSensitiveData(data) {
  if (!data || typeof data !== 'string') return '****';
  
  if (data.length <= 4) return '****';
  
  return '*'.repeat(data.length - 4) + data.slice(-4);
}
