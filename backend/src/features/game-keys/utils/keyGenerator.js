/**
 * Generador de Llaves de Juego
 * Grupo 2 - Feature: Gestión de Llaves
 * 
 * Genera llaves únicas con formato: XXXXX-XXXXX-XXXXX-XXXXX-CCCCC
 * - 20 caracteres de payload (Base32)
 * - 5 caracteres de checksum CRC32
 * - Total: 25 caracteres + guiones separadores
 * 
 * Características:
 * - Entropía: ~100 bits (muy seguro)
 * - Base32 sin ambigüedad (sin 0,O,1,I,L)
 * - Checksum para validación de integridad
 * - No adivinable ni predecible
 */

import crypto from 'crypto';
import { crc32 } from 'crc';

// Alfabeto Base32 sin caracteres ambiguos
const BASE32_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin O, I, 0, 1

/**
 * Convierte un buffer a Base32 usando alfabeto sin ambigüedad
 * @param {Buffer} buffer - Buffer a convertir
 * @returns {string} - String en Base32
 */
function toBase32(buffer) {
  let bits = '';
  
  // Convertir cada byte a bits
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  
  let result = '';
  
  // Tomar chunks de 5 bits y convertir a Base32
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    const index = parseInt(chunk, 2);
    result += BASE32_ALPHABET[index];
  }
  
  return result;
}

/**
 * Genera una llave de juego única y segura
 * 
 * @param {string} juegoId - UUID del juego
 * @param {string} desarrolladorId - UUID del desarrollador
 * @returns {string} - Llave en formato XXXXX-XXXXX-XXXXX-XXXXX-CCCCC
 * 
 * @example
 * generarLlaveJuego('uuid-juego', 'uuid-dev')
 * // Returns: 'A3F8B-9C2D1-E4F5A-6B7C8-D9E0F'
 */
export function generarLlaveJuego(juegoId, desarrolladorId) {
  try {
    // 1. Generar 15 bytes aleatorios de alta entropía (120 bits)
    const randomBytes = crypto.randomBytes(15);
    
    // 2. Agregar metadatos del juego para unicidad adicional
    // (Tomar últimos 5 caracteres del UUID del juego)
    const metadataBytes = Buffer.from(juegoId.slice(-5), 'utf-8');
    
    // 3. Combinar random + metadata
    const combinedBuffer = Buffer.concat([randomBytes, metadataBytes.slice(0, 5)]);
    
    // 4. Convertir a Base32 (más eficiente que Base64 para humanos)
    const base32String = toBase32(combinedBuffer);
    
    // 5. Tomar los primeros 20 caracteres para el payload
    const payload = base32String.slice(0, 20);
    
    // 6. Calcular checksum CRC32 sobre el payload
    const checksumValue = crc32(payload);
    
    // 7. Convertir checksum a hex y luego a Base32
    const checksumHex = checksumValue.toString(16).padStart(8, '0').toUpperCase();
    const checksumBuffer = Buffer.from(checksumHex, 'hex');
    const checksumBase32 = toBase32(checksumBuffer).slice(0, 5);
    
    // 8. Combinar payload + checksum
    const fullKey = payload + checksumBase32;
    
    // 9. Formatear con guiones: XXXXX-XXXXX-XXXXX-XXXXX-CCCCC
    const formattedKey = fullKey.match(/.{1,5}/g).join('-');
    
    return formattedKey;
  } catch (error) {
    console.error('[KEY_GENERATOR] Error al generar llave:', error);
    throw new Error('Error al generar llave de juego');
  }
}

/**
 * Valida el formato de una llave de juego verificando su checksum
 * 
 * @param {string} llave - Llave a validar
 * @returns {boolean} - true si la llave es válida, false en caso contrario
 * 
 * @example
 * validarFormatoLlave('A3F8B-9C2D1-E4F5A-6B7C8-D9E0F')
 * // Returns: true or false
 */
export function validarFormatoLlave(llave) {
  try {
    // 1. Remover guiones
    const cleanKey = llave.replace(/-/g, '').toUpperCase();
    
    // 2. Validar longitud (debe ser 25 caracteres)
    if (cleanKey.length !== 25) {
      return false;
    }
    
    // 3. Validar que solo contenga caracteres del alfabeto Base32
    const validChars = new RegExp(`^[${BASE32_ALPHABET}]+$`);
    if (!validChars.test(cleanKey)) {
      return false;
    }
    
    // 4. Separar payload y checksum
    const payload = cleanKey.slice(0, 20);
    const checksum = cleanKey.slice(20, 25);
    
    // 5. Recalcular checksum esperado
    const expectedChecksumValue = crc32(payload);
    const expectedChecksumHex = expectedChecksumValue.toString(16).padStart(8, '0').toUpperCase();
    const expectedChecksumBuffer = Buffer.from(expectedChecksumHex, 'hex');
    const expectedChecksum = toBase32(expectedChecksumBuffer).slice(0, 5);
    
    // 6. Comparar checksums
    return checksum === expectedChecksum;
  } catch (error) {
    console.error('[KEY_GENERATOR] Error al validar llave:', error);
    return false;
  }
}

/**
 * Genera múltiples llaves únicas
 * 
 * @param {string} juegoId - UUID del juego
 * @param {string} desarrolladorId - UUID del desarrollador
 * @param {number} cantidad - Cantidad de llaves a generar (máximo 5)
 * @returns {string[]} - Array de llaves generadas
 */
export function generarMultiplesLlaves(juegoId, desarrolladorId, cantidad) {
  if (cantidad < 1 || cantidad > 5) {
    throw new Error('La cantidad debe estar entre 1 y 5');
  }
  
  const llaves = new Set();
  
  // Generar llaves únicas (usando Set para evitar duplicados)
  while (llaves.size < cantidad) {
    const nuevaLlave = generarLlaveJuego(juegoId, desarrolladorId);
    llaves.add(nuevaLlave);
  }
  
  return Array.from(llaves);
}

/**
 * Formatea una llave sin guiones al formato estándar
 * 
 * @param {string} llave - Llave sin formato
 * @returns {string} - Llave formateada con guiones
 * 
 * @example
 * formatearLlave('A3F8B9C2D1E4F5A6B7C8D9E0F')
 * // Returns: 'A3F8B-9C2D1-E4F5A-6B7C8-D9E0F'
 */
export function formatearLlave(llave) {
  const cleanKey = llave.replace(/-/g, '').toUpperCase();
  
  if (cleanKey.length !== 25) {
    throw new Error('Formato de llave inválido');
  }
  
  return cleanKey.match(/.{1,5}/g).join('-');
}
