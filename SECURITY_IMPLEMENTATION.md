# Implementación de Requisitos de Seguridad - Steamworks

**Grupo 2 - Feature: Seguridad**  
**Fecha:** 11 de Enero, 2026

---

## 📋 Resumen de Implementación

Este documento detalla cómo se han implementado los requisitos de seguridad críticos especificados en `Steamworks_Indications.md`.

---

## 🔐 Requisitos No Funcionales Implementados

### RNF-001: Autenticación Multifactor (MFA)
**Estado:** ⚠️ Preparado (infraestructura lista, implementación futura)

**Implementación:**
- Campo `mfa_habilitado` en tabla `desarrolladores`
- Campo `mfa_secret` para almacenar secreto TOTP
- Estructura preparada para implementar 2FA con bibliotecas como `speakeasy`

**Próximos pasos:**
- Integrar biblioteca TOTP (speakeasy, otpauth)
- Crear endpoints para habilitar/deshabilitar MFA
- Implementar verificación de código 2FA en login y acciones críticas

---

### RNF-002: Cifrado en Tránsito
**Estado:** ✅ Implementado parcialmente

**Implementación:**
- **Security Headers** implementados con Helmet:
  - `Strict-Transport-Security` (HSTS) - max-age: 1 año
  - Headers preparados para forzar HTTPS en producción
  
**Archivo:** `backend/src/shared/middleware/securityHeaders.js`

**Producción requiere:**
```javascript
// En producción usar reverse proxy (nginx, cloudflare) con HTTPS
// El header HSTS ya está configurado para forzar TLS 1.3
```

---

### RNF-003: Cifrado en Reposo
**Estado:** ✅ Implementado (doble capa)

**Implementación:**

#### **Capa 1: Cifrado de Supabase (Por defecto)**
Supabase proporciona **cifrado en reposo AES-256** automáticamente para todos los datos almacenados en PostgreSQL. Esto cumple el requisito base de RNF-003.

**Documentación:** https://supabase.com/docs/guides/platform/security

#### **Capa 2: Cifrado a nivel de aplicación (Implementado)**
Para datos **ultra-sensibles** (números de cuenta bancaria), se implementó cifrado adicional a nivel de aplicación usando **AES-256 con CryptoJS**.

**Archivo:** `backend/src/shared/utils/encryption.js`

**Flujo:**
1. Los datos bancarios se cifran **antes** de guardar en Supabase
2. Se almacenan cifrados (doble cifrado: app + Supabase)
3. Se descifran **solo** cuando se retornan al cliente autorizado

**Ejemplo:**
```javascript
import { encryptBankData, decryptBankData } from '../shared/utils/encryption.js';

// Al guardar
const datosCifrados = encryptBankData({
  cuenta_bancaria: "1234567890",
  titular_banco: "Juan Pérez",
  nombre_banco: "Banco Nacional"
});

// Al recuperar
const datosDescifrados = decryptBankData(datosCifrados);
```

**Datos cifrados a nivel de aplicación:**
- ✅ `numero_cuenta` (cuenta bancaria)
- ⚠️ Extensible a: NIF/CIF, tokens sensibles

**Variable de entorno requerida:**
```env
ENCRYPTION_KEY=tu_clave_secreta_256_bits
```

---

### RNF-004: Control de Acceso Estricto
**Estado:** ✅ Implementado

**Implementación:**
- **Row Level Security (RLS)** en Supabase para tabla `desarrolladores`
- Middleware de autenticación que verifica JWT
- Validación de propiedad de recursos (C18)

**Archivo:** `backend/src/features/developer-auth/middleware/developerAuthMiddleware.js`

**Política ABAC implementada:**
```sql
-- Solo el desarrollador puede ver/editar sus propios datos
CREATE POLICY desarrolladores_policy_self ON desarrolladores
  FOR ALL
  USING (auth.uid() = id);
```

---

### RNF-005: Prevención de Inyecciones
**Estado:** ✅ Implementado

**Implementación:**

#### **1. Consultas Parametrizadas (C9)**
Supabase Client usa **consultas parametrizadas automáticamente**, previniendo SQL Injection.

```javascript
// ✅ Seguro - Supabase maneja la parametrización
await supabase
  .from('desarrolladores')
  .select('*')
  .eq('id', userId);  // Parámetro seguro
```

#### **2. Sanitización de Inputs (C3)**
**Archivo:** `backend/src/shared/utils/sanitization.js`

Funciones implementadas:
- `sanitizeString()` - Remueve caracteres peligrosos (<, >, javascript:, event handlers)
- `sanitizeEmail()` - Normaliza emails
- `containsSQLInjection()` - Detecta keywords SQL peligrosos
- `sanitizeBodyMiddleware()` - Middleware global para sanitizar requests

**Aplicación:**
```javascript
// Middleware global en server.js
app.use(sanitizeBodyMiddleware);

// Validación adicional en services
if (containsSQLInjection(nombre_legal)) {
  throw new Error('Entrada inválida detectada');
}
```

#### **3. Validación de Formato**
- Email: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Contraseñas: Mínimo 8 caracteres, letras + números
- Caracteres alfanuméricos: Solo permite `[a-zA-Z0-9_-]`

---

### RNF-006: Integridad de Archivos
**Estado:** ✅ Preparado (función implementada)

**Implementación:**
**Archivo:** `backend/src/shared/utils/encryption.js`

Funciones para verificación SHA-256:
```javascript
import { hashSHA256, verifyIntegrity } from '../shared/utils/encryption.js';

// Generar hash
const hash = hashSHA256(fileContent);

// Verificar integridad
const esValido = verifyIntegrity(fileContent, expectedHash);
```

**Uso futuro:**
- Subida de builds de juegos (RF-005)
- Descarga de archivos
- Verificación de integridad de assets

---

### RNF-007: Rate Limiting
**Estado:** ✅ Implementado

**Implementación:**
**Archivo:** `backend/src/shared/middleware/rateLimiter.js`

Limitadores configurados:

| Endpoint | Límite | Ventana | Código Error |
|----------|--------|---------|--------------|
| Login | 5 intentos | 15 min | 429 |
| Registro | 3 registros | 1 hora | 429 |
| Auth general | 5 requests | 15 min | 429 |
| API general | 100 requests | 15 min | 429 |
| Acciones críticas | 10 acciones | 1 hora | 429 |

**Aplicación en rutas:**
```javascript
import { loginLimiter, registerLimiter } from '../../../shared/middleware/rateLimiter.js';

router.post('/login', loginLimiter, developerAuthController.login);
router.post('/registro', registerLimiter, developerAuthController.registro);
```

**Respuesta cuando se excede:**
```json
{
  "success": false,
  "message": "Demasiados intentos desde esta IP, por favor intente nuevamente en 15 minutos",
  "retryAfter": 900
}
```

---

### RNF-008: Registro de Eventos
**Estado:** ⚠️ Implementación básica

**Implementación actual:**
- Logs de consola en backend con `console.error()`
- Timestamps en tabla `desarrolladores` (creado_en, actualizado_en, ultima_sesion)

**Mejoras futuras:**
- Tabla de auditoría: `logs_auditoria`
- Winston logger para logs estructurados
- Integración con servicios de monitoreo (Sentry, LogRocket)

---

### RNF-009: Cumplimiento Normativo
**Estado:** ✅ Implementado

**Implementación:**
- Campo `acepto_terminos` (boolean, requerido) en registro
- Campo `fecha_aceptacion_terminos` (timestamp)
- Validación obligatoria antes de crear cuenta

```javascript
if (!acepto_terminos) {
  throw new Error('Debe aceptar los términos y condiciones para registrarse');
}
```

**Frontend:** Checkbox obligatorio en formulario de registro

---

## 🛡️ Controles de Seguridad Técnicos

### C2: Cifrado en Reposo
✅ **Implementado** - Ver RNF-003 (doble capa)

### C3: Prevención de Inyecciones
✅ **Implementado** - Ver RNF-005 (sanitización + consultas parametrizadas)

### C5: Antivirus / EDR
⚠️ **Pendiente** - Requiere integración futura para subida de archivos

### C7: Rate Limiting
✅ **Implementado** - Ver RNF-007

### C8: Timeouts
⚠️ **Parcial** - Supabase tiene timeouts internos, falta configuración explícita

### C9: Consultas Parametrizadas
✅ **Implementado** - Supabase Client lo hace automáticamente

### C10: Validación límite de claves
⚠️ **Pendiente** - Será implementado en RF-012 (Gestión de Claves)

### C11: Regla de precio > 0
⚠️ **Pendiente** - Será implementado en RF-010 (Definición de Precios)

### C12: Validación rango de precios
⚠️ **Pendiente** - Será implementado en RF-010 ($0 - $1000)

### C13: Límite tamaño de archivo
⚠️ **Pendiente** - Será implementado en RF-005 (Envío a Revisión)

### C14: MFA (2FA)
⚠️ **Preparado** - Ver RNF-001 (infraestructura lista)

### C15: Validación de Sesión
✅ **Implementado** - JWT con expiración, verificación en middleware

### C16: Passkeys / Windows Hello
⚠️ **Pendiente** - Requiere implementación WebAuthn

### C17: RBAC + Mínimo Privilegio
✅ **Implementado** - Verificación de rol 'desarrollador' en middleware

### C18: Validación estricta de propiedad
✅ **Implementado** - RLS policies + verificación en middleware

---

## 🔒 Security Headers Implementados

**Archivo:** `backend/src/shared/middleware/securityHeaders.js`

Headers configurados:

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Strict-Transport-Security` | max-age=31536000 | Forzar HTTPS (HSTS) |
| `X-Content-Type-Options` | nosniff | Prevenir MIME sniffing |
| `X-Frame-Options` | DENY | Prevenir clickjacking |
| `X-XSS-Protection` | 1; mode=block | Protección XSS |
| `Content-Security-Policy` | (ver archivo) | Prevenir XSS, inyección código |
| `Referrer-Policy` | strict-origin-when-cross-origin | Control de referrer |
| `Permissions-Policy` | geolocation=(), microphone=(), camera=() | Deshabilitar APIs sensibles |

---

## 📊 Resumen de Estado

| Requisito | Estado | Implementación |
|-----------|--------|----------------|
| RNF-001 (MFA) | ⚠️ Preparado | Infraestructura lista |
| RNF-002 (HTTPS) | ✅ Parcial | Headers configurados |
| RNF-003 (Cifrado Reposo) | ✅ Completo | Doble capa (Supabase + App) |
| RNF-004 (Control Acceso) | ✅ Completo | RLS + Middleware |
| RNF-005 (Anti-Injection) | ✅ Completo | Sanitización + Parametrización |
| RNF-006 (Integridad) | ✅ Preparado | Funciones SHA-256 listas |
| RNF-007 (Rate Limiting) | ✅ Completo | Múltiples limitadores |
| RNF-008 (Auditoría) | ⚠️ Básico | Logs básicos implementados |
| RNF-009 (LOPDP) | ✅ Completo | Consentimiento obligatorio |

**Leyenda:**
- ✅ Completo: Implementado y funcional
- ⚠️ Preparado/Parcial: Infraestructura lista o implementación básica
- ❌ Pendiente: No implementado

---

## 🚀 Próximos Pasos de Seguridad

1. **Implementar MFA/2FA completo** (RNF-001, C14)
   - Biblioteca: `speakeasy` o `otpauth`
   - Endpoints: habilitar, verificar, recuperación

2. **Sistema de Auditoría robusto** (RNF-008)
   - Tabla `logs_auditoria`
   - Winston logger
   - Integración con Sentry

3. **Antivirus para archivos** (C5)
   - Integrar ClamAV o servicio cloud
   - Escaneo antes de aceptar builds

4. **WebAuthn / Passkeys** (C16)
   - Autenticación resistente a phishing
   - Integrar biblioteca `@simplewebauthn/server`

5. **Configurar HTTPS en producción**
   - Certificados SSL/TLS 1.3
   - Reverse proxy (nginx, cloudflare)

---

## 🔐 Variables de Entorno Requeridas

```env
# Cifrado
ENCRYPTION_KEY=tu_clave_secreta_256_bits_cambiar_en_produccion

# JWT (ya existente)
JWT_SECRET=steamworks_super_secret_key_change_in_production_2026

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Supabase (ya existente)
SUPABASE_URL=https://zskmxoddmssjgwgsjpij.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 📖 Archivos de Seguridad Creados

```
backend/src/
├── shared/
│   ├── middleware/
│   │   ├── rateLimiter.js           # Rate limiting (C7, RNF-007)
│   │   └── securityHeaders.js       # Security headers (HSTS, CSP, etc.)
│   └── utils/
│       ├── sanitization.js          # Sanitización inputs (C3, RNF-005)
│       └── encryption.js            # Cifrado/descifrado (C2, RNF-003, RNF-006)
```

---

**Documento actualizado:** 11 de Enero, 2026  
**Grupo:** 2  
**Feature:** `security-improvements`
