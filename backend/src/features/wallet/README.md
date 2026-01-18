# Wallet Feature - Steam Clone

## Descripción

La funcionalidad de billetera permite a los usuarios recargar dinero simulado y utilizarlo para compras dentro de la plataforma.

## Características

### Recarga de Billetera
- Montos predefinidos: $5, $10, $25, $50, $100
- Monto personalizado: $1.00 - $500.00
- Límite diario de recarga: $1,000.00
- Balance máximo: $10,000.00

### Pagos
- Validación de fondos suficientes
- Protección contra compras duplicadas
- Transacciones atómicas

## Seguridad Implementada

### Prevención de Condiciones de Carrera
1. **Bloqueo de fila con FOR UPDATE**: Las funciones RPC de PostgreSQL usan `SELECT ... FOR UPDATE` para bloquear la fila del perfil durante la transacción.

2. **Idempotency Keys**: Cada transacción requiere una clave única para prevenir procesamiento duplicado.

3. **Transacciones Atómicas**: Las operaciones de balance se realizan dentro de transacciones de base de datos.

### Prevención de Doble-Click
1. **Frontend**: Referencias con `useRef` previenen múltiples llamadas mientras una operación está en progreso.

2. **Backend**: Cache en memoria con timeout previene solicitudes duplicadas dentro de un período de cooldown.

3. **Base de datos**: Constraint UNIQUE en `idempotency_key` previene duplicados a nivel de BD.

### Validaciones
- Monto mínimo y máximo de recarga
- Límite diario de recarga
- Balance máximo permitido
- Validación de decimales (máximo 2)
- Verificación de fondos suficientes para pagos

## API Endpoints

### GET /api/wallet/balance
Obtiene el balance actual del usuario.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "balance": 150.00
  }
}
```

### POST /api/wallet/reload
Recarga la billetera.

**Body:**
```json
{
  "amount": 50.00,
  "idempotencyKey": "reload_1234567890_abc123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Recarga procesada exitosamente",
  "data": {
    "newBalance": 200.00,
    "transactionId": "uuid-xxx"
  }
}
```

### POST /api/wallet/pay
Procesa un pago.

**Body:**
```json
{
  "amount": 29.99,
  "description": "Compra de Space Explorer",
  "referenceType": "game",
  "referenceId": "uuid-game-xxx",
  "idempotencyKey": "pay_game_uuid-game-xxx_1234567890_abc123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Pago procesado exitosamente",
  "data": {
    "newBalance": 170.01,
    "transactionId": "uuid-yyy"
  }
}
```

### GET /api/wallet/history
Obtiene el historial de transacciones.

**Query Params:**
- `limit`: Número de resultados (default: 20, max: 100)
- `offset`: Offset para paginación

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "reload",
        "amount": 50.00,
        "status": "completed",
        "description": "Recarga de billetera",
        "created_at": "2026-01-17T..."
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Validación fallida (monto inválido, datos faltantes) |
| 402 | Fondos insuficientes |
| 409 | Transacción duplicada |
| 422 | Límite excedido (diario o máximo) |
| 429 | Operación en progreso (rate limit) |
| 500 | Error interno del servidor |

## Base de Datos

### Tabla: wallet_transactions
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- type: VARCHAR ('reload', 'purchase', 'refund')
- amount: DECIMAL(10, 2)
- status: VARCHAR ('pending', 'completed', 'failed', 'cancelled')
- description: TEXT
- reference_type: VARCHAR
- reference_id: UUID
- idempotency_key: VARCHAR (UNIQUE)
- balance_after: DECIMAL(10, 2)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Funciones RPC
- `reload_wallet()`: Recarga atómica con bloqueo
- `process_payment()`: Pago atómico con bloqueo

## Instalación

1. Ejecutar la migración SQL en Supabase:
   ```bash
   # En el Dashboard de Supabase > SQL Editor
   # Copiar y ejecutar: migrations/001_wallet_transactions.sql
   ```

2. Reiniciar el servidor backend:
   ```bash
   cd backend && npm run dev
   ```

## Uso en Frontend

```jsx
import { useWallet, WalletCard } from '@/features/wallet';

// En un componente
const { balance, reloadWallet, processPayment, hasSufficientFunds } = useWallet();

// Verificar fondos antes de mostrar botón de compra
if (hasSufficientFunds(game.price)) {
  // Mostrar botón de compra
}

// Procesar compra
const result = await processPayment(
  game.price,
  `Compra de ${game.title}`,
  'game',
  game.id
);

if (result.success) {
  // Compra exitosa
}
```

## Estructura de Archivos

```
backend/src/features/wallet/
├── index.js
├── controllers/
│   └── walletController.js
├── routes/
│   └── walletRoutes.js
├── services/
│   └── walletService.js
└── migrations/
    └── 001_wallet_transactions.sql

frontend/src/features/wallet/
├── index.js
├── components/
│   ├── index.js
│   └── WalletCard.jsx
├── hooks/
│   └── useWallet.js
└── services/
    └── walletService.js
```
