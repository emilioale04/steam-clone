# Sistema de Notificaciones en Tiempo Real

Se ha implementado un sistema de notificaciones en tiempo real usando WebSocket.

## Instalación

Ejecuta el siguiente comando en la carpeta `backend`:

```bash
npm install ws
```

## Características implementadas

### Backend

1. **NotificationService** (`backend/src/shared/services/notificationService.js`)
   - Servidor WebSocket en `/ws/notifications`
   - Gestión de conexiones por usuario
   - Envío de notificaciones en tiempo real
   - Notificaciones de invitaciones a grupos
   - Notificaciones de solicitudes aprobadas

2. **Integración en server.js**
   - WebSocket inicializado con el servidor HTTP
   - Ruta: `ws://localhost:3000/ws/notifications`

3. **Integración en groupService**
   - Notifica automáticamente cuando se envía una invitación

### Frontend

1. **useNotifications Hook** (`frontend/src/shared/hooks/useNotifications.js`)
   - Hook reutilizable para conectarse al WebSocket
   - Manejo de reconexión automática
   - Estado de notificaciones y contador

2. **NotificationBell Component** (`frontend/src/shared/components/NotificationBell.jsx`)
   - Icono de campana con contador de notificaciones
   - Dropdown con lista de invitaciones pendientes
   - Botones para aceptar/rechazar invitaciones

3. **Integración en HomePage**
   - Campana de notificaciones visible en el header
   - Funciona en toda la aplicación una vez autenticado

## Cómo funciona

1. Usuario se autentica en la aplicación
2. WebSocket se conecta automáticamente
3. Servidor envía notificaciones pendientes al conectarse
4. Cuando alguien invita al usuario a un grupo:
   - Se envía notificación en tiempo real
   - Aparece badge rojo en la campana
   - Usuario puede aceptar/rechazar desde el dropdown

## Próximos pasos sugeridos

- Agregar endpoint para rechazar invitaciones (actualizar estado)
- Agregar más tipos de notificaciones (comentarios, menciones, etc.)
- Agregar sonido/vibración al recibir notificación
- Persistir notificaciones leídas/no leídas en base de datos
