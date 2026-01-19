# Sistema MFA Genérico

## Descripción

El sistema de Autenticación Multi-Factor (MFA) con TOTP (Time-Based One-Time Password) proporciona una capa adicional de seguridad para la autenticación de usuarios. Este sistema es completamente genérico y puede ser utilizado por cualquier módulo de la aplicación (admin, developer, user).

## ¿Qué es TOTP y cómo funciona?

### Fundamentos de TOTP

TOTP (Time-Based One-Time Password) es un algoritmo que genera contraseñas de un solo uso basadas en el tiempo. Es el estándar utilizado por aplicaciones como Google Authenticator, Authy y Microsoft Authenticator.

**Características principales:**
- ✅ Basado en el estándar RFC 6238
- ✅ Genera códigos de 6 dígitos que cambian cada 30 segundos
- ✅ No requiere conexión a internet una vez configurado
- ✅ Sincronizado mediante tiempo compartido (no comunicación)

### Cómo funciona el flujo completo de MFA

#### 1. **Configuración Inicial (Setup)**

```
Usuario → Backend: Solicita configurar MFA
Backend → Genera secreto único (base32)
Backend → Crea código QR con el secreto
Backend → Guarda secreto temporalmente (mfa_habilitado = false)
Backend → Usuario: Devuelve QR y clave manual

Usuario → Escanea QR con app autenticadora
App Autenticadora → Genera códigos TOTP cada 30s

Usuario → Ingresa código de verificación
Backend → Verifica código contra secreto almacenado
Backend → Si es válido: activa MFA (mfa_habilitado = true)
Backend → Genera 10 códigos de respaldo
Backend → Usuario: Devuelve códigos de respaldo
```

**Implementación en el código:**
```javascript
// 1. Generar secreto
const secret = speakeasy.generateSecret({
  name: 'Steam Admin (user@example.com)',
  issuer: 'Steam Clone Admin',
  length: 32
});

// 2. Crear QR code
const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

// 3. Guardar en BD (sin activar aún)
await supabaseAdmin
  .from('admins')
  .update({
    mfa_secret: secret.base32,
    mfa_habilitado: false
  })
  .eq('id', userId);
```

#### 2. **Verificación durante Login**

```
Usuario → Ingresa email y contraseña
Backend → Valida credenciales
Backend → Verifica si tiene MFA habilitado
Backend → Si MFA activo: NO devuelve token, solo indica requiresMFA

Usuario → Ingresa código TOTP de 6 dígitos
Backend → Obtiene secreto de la BD
Backend → Verifica código con window de 2 intervalos (±60s)
Backend → Si válido: crea sesión y devuelve token
Usuario → Accede al sistema
```

**Implementación en el código:**
```javascript
// Verificar código TOTP
const verified = speakeasy.totp.verify({
  secret: user.mfa_secret,
  encoding: 'base32',
  token: userInputCode,
  window: 2  // Permite ±60 segundos de diferencia
});
```

#### 3. **Códigos de Respaldo**

Los códigos de respaldo son contraseñas de 8 dígitos que se pueden usar si:
- El usuario pierde su dispositivo
- La app autenticadora no funciona
- No puede generar códigos TOTP

**Características:**
- Se generan 10 códigos únicos
- Cada código solo puede usarse una vez
- Se eliminan automáticamente después de ser usados
- Se pueden regenerar en cualquier momento

```javascript
// Generación
const codes = [];
for (let i = 0; i < 10; i++) {
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  codes.push(code);
}

// Verificación
const backupCodes = JSON.parse(user.mfa_backup_codes);
const codeIndex = backupCodes.findIndex(code => code === userInputCode);
if (codeIndex !== -1) {
  backupCodes.splice(codeIndex, 1);  // Eliminar código usado
  await updateBackupCodes(userId, backupCodes);
  return true;
}
```

### Seguridad del Sistema

#### Medidas de Seguridad Implementadas

1. **Ventana de Tiempo (Time Window)**
   - Acepta códigos con margen de ±60 segundos
   - Compensa diferencias de reloj entre cliente/servidor
   - Previene problemas de sincronización

2. **Secretos Únicos**
   - Cada usuario tiene su propio secreto TOTP
   - Secretos generados con 32 bytes de entropía
   - Almacenados de forma segura en la base de datos

3. **Códigos de Un Solo Uso**
   - Códigos TOTP válidos solo por 30 segundos
   - Códigos de respaldo usables una sola vez
   - No se pueden reutilizar códigos antiguos

4. **Protección de Fuerza Bruta**
   - Rate limiting en endpoints de verificación
   - Códigos de 6 dígitos (1 millón de combinaciones)
   - Cambio cada 30 segundos limita intentos

5. **Recuperación Segura**
   - Códigos de respaldo solo mostrados una vez
   - Opción de regenerar códigos requiere autenticación
   - Deshabilitar MFA requiere contraseña

### Flujo de Datos

```
┌─────────────────┐
│   Usuario       │
└────────┬────────┘
         │ 1. Login (email/password)
         ▼
┌─────────────────┐
│   Backend       │ 2. Valida credenciales
│   (Express)     │ 3. Verifica MFA habilitado
└────────┬────────┘
         │ 4. requiresMFA: true
         ▼
┌─────────────────┐
│   Frontend      │ 5. Muestra input MFA
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   App Auth      │ 6. Genera código TOTP
│   (Móvil)       │    usando secreto compartido
└────────┬────────┘
         │ 7. Usuario lee código
         ▼
┌─────────────────┐
│   Frontend      │ 8. Envía código al backend
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │ 9. Verifica código
│                 │ 10. Genera token de sesión
└────────┬────────┘
         │ 11. Token JWT
         ▼
┌─────────────────┐
│   Usuario       │ 12. Acceso autorizado
└─────────────────┘
```

## Referencias Técnicas

### Estándares y Especificaciones

- **[RFC 6238 - TOTP: Time-Based One-Time Password Algorithm](https://tools.ietf.org/html/rfc6238)**
  - Especificación oficial del algoritmo TOTP
  - Define cómo generar códigos basados en tiempo
  - Estándar IETF para autenticación de dos factores

- **[RFC 4226 - HOTP: HMAC-Based One-Time Password](https://tools.ietf.org/html/rfc4226)**
  - Base del algoritmo TOTP
  - Define el algoritmo HMAC-OTP subyacente

### Librerías Utilizadas

- **[Speakeasy](https://github.com/speakeasyjs/speakeasy)**
  - Biblioteca Node.js para generación y verificación TOTP/HOTP
  - Implementa RFC 6238 y RFC 4226
  - Compatible con Google Authenticator y otras apps
  - Soporta secretos en base32 y generación de URLs otpauth://

- **[QRCode](https://github.com/soldair/node-qrcode)**
  - Generación de códigos QR en Node.js
  - Convierte URLs otpauth:// a imágenes QR
  - Soporta múltiples formatos de salida (DataURL, SVG, PNG)

### Recursos Adicionales

- **[Google Authenticator Wiki](https://github.com/google/google-authenticator/wiki)**
  - Documentación sobre implementación de TOTP
  - Formatos de URI y compatibilidad

- **[OWASP - Multi-Factor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)**
  - Mejores prácticas de seguridad para MFA
  - Consideraciones de implementación

## Arquitectura

### Backend

#### Configuración de Tipos de Usuario

El archivo `backend/src/features/mfa/config/userTypes.js` define los tipos de usuario soportados:

```javascript
export const USER_TYPES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  USER: 'user'
};
```

Cada tipo de usuario tiene su configuración:
- **table**: Nombre de la tabla en la base de datos
- **displayName**: Nombre para mostrar al usuario
- **issuerName**: Nombre del emisor para TOTP
- **namePrefix**: Prefijo para el nombre en la app autenticadora

#### Servicios

**`mfaService`**: Todas las funciones ahora aceptan un parámetro `userType`:

```javascript
// Generar secreto MFA
await mfaService.generateMFASecret(userId, email, userType);

// Verificar y activar MFA
await mfaService.verifyAndEnableMFA(userId, token, userType);

// Verificar TOTP en login
await mfaService.verifyTOTP(userId, token, userType);

// Deshabilitar MFA
await mfaService.disableMFA(userId, userType);

// Verificar estado de MFA
await mfaService.checkMFAStatus(userId, userType);

// Regenerar códigos de respaldo
await mfaService.regenerateBackupCodes(userId, userType);
```

#### Middleware

**`mfaMiddleware`**: Proporciona dos middlewares útiles:

1. **`setUserType(userType)`**: Establece el tipo de usuario en rutas protegidas
2. **`extractUserType`**: Extrae el tipo de usuario del body/query en rutas públicas

#### Rutas

Las rutas ahora son flexibles:

**Rutas protegidas** (requieren autenticación):
```javascript
// Para admin (actual implementación)
router.post('/setup', requireAuth, adminMiddleware.verificarAdmin, 
  mfaMiddleware.setUserType('admin'), mfaController.setupMFA);
```

**Rutas públicas** (para login):
```javascript
// Acepta userType como parámetro
router.post('/setup-initial', mfaMiddleware.extractUserType, mfaController.setupInitial);
router.post('/verify-enable-initial', mfaMiddleware.extractUserType, mfaController.verifyAndEnableInitial);
router.post('/verify-login', mfaMiddleware.extractUserType, mfaController.verifyLogin);
```

### Frontend

#### Configuración de Tipos de Usuario

El archivo `frontend/src/features/mfa/config/userTypes.js` define la configuración del frontend:

```javascript
export const USER_TYPE_CONFIG = {
  admin: {
    tokenKey: 'adminToken',
    refreshTokenKey: 'adminRefreshToken',
    userKey: 'adminUser',
    apiEndpoint: '/admin',
    displayName: 'Administrador'
  },
  developer: {
    tokenKey: 'developerToken',
    refreshTokenKey: 'developerRefreshToken',
    userKey: 'developerUser',
    apiEndpoint: '/developer',
    displayName: 'Desarrollador'
  },
  user: {
    tokenKey: 'userToken',
    refreshTokenKey: 'userRefreshToken',
    userKey: 'user',
    apiEndpoint: '/user',
    displayName: 'Usuario'
  }
};
```

#### Servicios

**`mfaService`**: Todas las funciones ahora aceptan `userType`:

```javascript
// Configuración inicial durante login
await mfaService.setupInitial(userId, email, tempToken, userType);

// Verificar y activar MFA inicial
await mfaService.verifyAndEnableInitial(userId, totpCode, tempToken, userType);

// Verificar código durante login
await mfaService.verifyLoginCode(userId, totpCode, userType);

// Configurar MFA (usuario autenticado)
await mfaService.setupMFA(token);

// Verificar y activar MFA (usuario autenticado)
await mfaService.verifyAndEnable(token, totpCode);
```

#### Componentes

Todos los componentes ahora aceptan la prop `userType`:

**`MFAVerification`**:
```jsx
<MFAVerification
  userId={userId}
  email={email}
  userType="admin" // o "developer", "user"
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```
│   ├── LoginAdminForm.jsx     # Modificado para soportar MFA
    └── adminAuthService.js    # Modificado para manejar respuesta MFA
```jsx
<MFASetupRequired
  userId={userId}
  email={email}
  tempToken={tempToken}
  userType="admin" // o "developer", "user"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

**`MFASetup`**:
```jsx
<MFASetup
  token={token}
  userType="admin" // o "developer", "user"
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

## Cómo Implementar MFA en un Nuevo Módulo

### Ejemplo: Implementar MFA para Developers

#### 1. Backend

**Crear rutas específicas para developers** (opcional):

```javascript
// backend/src/features/developer-auth/routes/developerAuthRoutes.js
import express from 'express';
import mfaController from '../../mfa/controllers/mfaController.js';
import mfaMiddleware from '../../mfa/middleware/mfaMiddleware.js';
import { requireAuth } from '../../../shared/middleware/authMiddleware.js';
import developerMiddleware from '../middleware/developerAuthMiddleware.js';

const router = express.Router();

// Rutas protegidas para developers
router.post('/mfa/setup', requireAuth, developerMiddleware.verificarDeveloper, 
  mfaMiddleware.setUserType('developer'), mfaController.setupMFA);

router.post('/mfa/verify-enable', requireAuth, developerMiddleware.verificarDeveloper,
  mfaMiddleware.setUserType('developer'), mfaController.verifyAndEnable);

// ... más rutas
```

**Actualizar el controlador de login de developers**:

```javascript
// backend/src/features/developer-auth/controllers/developerAuthController.js
const login = async (req, res) => {
  // ... validación de credenciales
  
  // Verificar si el developer tiene MFA habilitado
  const mfaStatus = await mfaService.checkMFAStatus(developer.id, 'developer');
  
  if (mfaStatus.mfaEnabled) {
    // Requiere verificación MFA
    return res.status(200).json({
      success: true,
      requiresMFA: true,
      userId: developer.id,
      email: developer.email,
      userType: 'developer'
    });
  }
  
  // Si no tiene MFA, continuar con login normal o requerir configuración
};
```

#### 2. Frontend

**Actualizar el componente de login de developers**:

```jsx
// frontend/src/features/developer-auth/components/DeveloperLoginForm.jsx
import { MFAVerification, MFASetupRequired } from '../../mfa';

function DeveloperLoginForm() {
  const [step, setStep] = useState('login'); // login, mfa-verify, mfa-setup
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [tempToken, setTempToken] = useState('');

  const handleLogin = async (credentials) => {
    const response = await developerAuthService.login(credentials);
    
    if (response.requiresMFA) {
      setUserId(response.userId);
      setEmail(response.email);
      setStep('mfa-verify');
    } else if (response.requiresMFASetup) {
      setUserId(response.userId);
      setEmail(response.email);
      setTempToken(response.tempToken);
      setStep('mfa-setup');
    }
    // ...
  };

  if (step === 'mfa-verify') {
    return (
      <MFAVerification
        userId={userId}
        email={email}
        userType="developer"
        onSuccess={handleLoginSuccess}
        onCancel={() => setStep('login')}
      />
    );
  }

  if (step === 'mfa-setup') {
    return (
      <MFASetupRequired
        userId={userId}
        email={email}
        tempToken={tempToken}
        userType="developer"
        onSuccess={handleLoginSuccess}
        onError={handleError}
      />
    );
  }

  // Formulario de login normal
  return (
    <form onSubmit={handleLogin}>
      {/* ... campos de login */}
    </form>
  );
}
```

#### 3. Base de Datos

Asegúrate de que la tabla correspondiente tenga las columnas necesarias:

```sql
-- Para developers
ALTER TABLE developers ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS mfa_habilitado BOOLEAN DEFAULT FALSE;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;

-- Para users
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_habilitado BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;
```

## Características

✅ **Genérico**: Funciona con cualquier tipo de usuario
✅ **Flexible**: Fácil de extender a nuevos módulos
✅ **Mantenible**: Código centralizado y reutilizable
✅ **Compatible**: Mantiene funcionamiento actual de admin
✅ **Configurable**: Personalizable por tipo de usuario

## Notas Importantes

1. **Middleware de autenticación**: Cada módulo debe implementar su propio middleware de autenticación (como `adminMiddleware.verificarAdmin`)

2. **Completar login**: La función `verifyAndEnableInitial` del controlador necesita saber cómo completar el login para cada tipo de usuario. Actualmente solo implementa admin, pero es fácil de extender.

3. **Almacenamiento local**: Cada tipo de usuario usa diferentes claves en localStorage para evitar conflictos.

4. **Endpoints de verificación**: El endpoint `/admin/verify-mfa-login` es específico de admin. Para otros módulos, debes crear endpoints similares o usar la ruta genérica `/mfa/verify-login`.

## Aplicar MFA en Operaciones Críticas

Además del login, puedes proteger operaciones administrativas sensibles requiriendo verificación MFA. Este patrón se usa para acciones como:
- Bloqueo/desbloqueo de países
- Aprobación/rechazo de juegos
- Aplicar bans a usuarios
- Gestión de categorías (crear, actualizar, eliminar)

### 1. Backend: Endpoint de Verificación

El sistema incluye un endpoint para verificar códigos MFA durante operaciones:

```javascript
// backend/src/features/mfa/routes/mfaRoutes.js
router.post('/verify', requireAuth, mfaMiddleware.extractUserType, mfaController.verifyOperationCode);
```

Este endpoint:
- ✅ Requiere autenticación previa (token JWT)
- ✅ Valida que el userId coincida con el usuario autenticado
- ✅ Verifica el código TOTP
- ✅ No crea sesión, solo valida el código

**Parámetros del request:**
```json
{
  "userId": "uuid-del-usuario",
  "token": "123456",
  "userType": "admin"
}
```

### 2. Frontend: Servicio de Verificación

Agregar función de verificación en el servicio correspondiente:

```javascript
// frontend/src/features/admin/services/adminAuthService.js
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
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
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
```

### 3. Frontend: Componente Modal MFA

Crear un modal reutilizable para solicitar el código MFA:

```jsx
// frontend/src/features/admin/components/MFAModal.jsx
import { useState } from 'react';

const MFAModal = ({ isOpen, onClose, onVerify, operationType = 'operación' }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onVerify(code);
      setCode('');
      onClose();
    } catch (err) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  if (!isOpen) return null;

  return (
    <div style={{ /* estilos del overlay */ }}>
      <div style={{ /* estilos del modal */ }}>
        <h2>Verificación de Seguridad</h2>
        <p>Esta {operationType} requiere verificación MFA.</p>
        
        {error && <div style={{ color: 'red' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength="6"
            required
            autoFocus
          />
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={loading || code.length !== 6}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MFAModal;
```

### 4. Implementación en Componentes

Patrón para implementar MFA en operaciones críticas:

```jsx
import { useState } from 'react';
import { verifyMFACode } from '../services/adminAuthService';
import MFAModal from './MFAModal';

const MiComponente = () => {
  // Estados para MFA
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [mfaOperationType, setMfaOperationType] = useState('');

  // Interceptar la operación crítica
  const handleCriticalAction = async (data) => {
    // En lugar de ejecutar directamente, mostrar modal MFA
    setMfaOperationType('bloqueo de país'); // Descripción de la operación
    setPendingAction({
      type: 'bloquear',
      data: data
    });
    setShowMFAModal(true);
  };

  // Ejecutar la operación después de verificar MFA
  const executeAction = async () => {
    try {
      if (pendingAction.type === 'bloquear') {
        await createBloqueoPais(pendingAction.data);
      }
      // ... otras acciones
      
      alert('Operación exitosa');
    } catch (err) {
      alert(err.message || 'Error al ejecutar operación');
    }
  };

  // Manejar verificación MFA
  const handleMFAVerify = async (code) => {
    // Verificar el código MFA
    await verifyMFACode(code);
    
    // Si es válido, ejecutar la acción pendiente
    await executeAction();
    
    // Limpiar estado
    setPendingAction(null);
    setMfaOperationType('');
  };

  return (
    <div>
      {/* Tu componente normal */}
      <button onClick={() => handleCriticalAction(someData)}>
        Acción Crítica
      </button>

      {/* Modal MFA */}
      <MFAModal
        isOpen={showMFAModal}
        onClose={() => {
          setShowMFAModal(false);
          setPendingAction(null);
          setMfaOperationType('');
        }}
        onVerify={handleMFAVerify}
        operationType={mfaOperationType}
      />
    </div>
  );
};
```

### 5. Ejemplo Completo: Bloqueo de País

```jsx
const BloqueoPais = () => {
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [mfaOperationType, setMfaOperationType] = useState('');

  // Formulario de bloqueo
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mostrar modal MFA antes de bloquear
    setMfaOperationType('creación de bloqueo');
    setPendingAction({
      type: 'submit',
      data: { ...formData }
    });
    setShowMFAModal(true);
  };

  // Desbloquear país
  const handleDelete = async (id) => {
    setMfaOperationType('desbloqueo de país');
    setPendingAction({
      type: 'delete',
      id
    });
    setShowMFAModal(true);
  };

  // Ejecutar acción después de MFA
  const executeSubmit = async () => {
    await createBloqueoPais(pendingAction.data);
    await loadData();
    alert('País bloqueado exitosamente');
  };

  const executeDelete = async () => {
    await deleteBloqueoPais(pendingAction.id);
    await loadData();
    alert('País desbloqueado exitosamente');
  };

  // Verificar MFA y ejecutar
  const handleMFAVerify = async (code) => {
    await verifyMFACode(code);
    
    if (pendingAction.type === 'submit') {
      await executeSubmit();
    } else if (pendingAction.type === 'delete') {
      await executeDelete();
    }
    
    setPendingAction(null);
    setMfaOperationType('');
  };

  return (
    <>
      {/* Formulario y tabla */}
      
      <MFAModal
        isOpen={showMFAModal}
        onClose={() => {
          setShowMFAModal(false);
          setPendingAction(null);
        }}
        onVerify={handleMFAVerify}
        operationType={mfaOperationType}
      />
    </>
  );
};
```

### Operaciones Protegidas con MFA

Actualmente implementado en:

1. **Bloqueo de País**: Crear, actualizar, desbloquear
2. **Revisión de Juegos**: Aprobar, rechazar
3. **Gestión de Usuarios**: Aplicar ban, aprobar/rechazar reportes
4. **Gestión de Categorías**: Crear, actualizar, activar/desactivar, eliminar

### Ventajas de este Patrón

✅ **No intrusivo**: No modifica el flujo de autenticación principal
✅ **Flexible**: Se puede aplicar a cualquier operación
✅ **Reutilizable**: Un solo modal para todas las operaciones
✅ **Seguro**: Cada código solo es válido por 30 segundos
✅ **UX clara**: El usuario sabe exactamente qué operación está autorizando

### Consideraciones de Seguridad

1. **Un código por operación**: Cada acción requiere un código nuevo
2. **No se almacena el estado**: No hay bypass posible
3. **Token de sesión requerido**: La verificación requiere estar autenticado
4. **Validación de usuario**: El backend verifica que el userId coincida con el token
5. **Rate limiting**: El endpoint está protegido contra fuerza bruta

## Próximos Pasos

Para implementar MFA en developers o users:

1. Agregar columnas MFA a las tablas correspondientes
2. Crear rutas específicas (opcional, pueden usar las genéricas)
3. Actualizar el flujo de login para detectar y requerir MFA
4. Usar los componentes MFA con el `userType` apropiado
5. Implementar la lógica de `completeMFALogin` para ese tipo de usuario
6. Aplicar el patrón de verificación MFA a operaciones críticas