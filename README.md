# Steam Clone

Clon de la plataforma Steam desarrollado como proyecto académico con React, Node.js y Express.

## 🚀 Stack Tecnológico

### Frontend
- **React** 18+ con Vite
- **Tailwind CSS** v4
- **Lucide React** (iconos)

### Backend
- **Node.js** con Express 5
- **CORS** para API REST
- **dotenv** para variables de entorno

## 📁 Estructura del Proyecto

```
steam-clone/
├── frontend/          # Aplicación React
├── backend/           # API REST con Express
├── GIT_STRATEGY.md    # Estrategia de ramificación Git
└── FOLDER_STRATEGY.md # Organización de carpetas por features
```

## ⚙️ Requisitos Previos

- **Node.js** v18 o superior
- **npm** v9 o superior

## 🔧 Instalación

```bash
# Instalar dependencias del proyecto raíz
npm install

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install
```

## 🏃 Ejecución

### Opción 1: Ejecutar todo desde la raíz (recomendado)

```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:5173`

### Opción 2: Ejecutar por separado

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📜 Scripts Disponibles

### Raíz del proyecto
```bash
npm run dev              # Inicia frontend y backend
npm run dev:backend      # Solo backend
npm run dev:frontend     # Solo frontend
```

### Frontend
```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run preview          # Preview del build
```

### Backend
```bash
npm run dev              # Servidor con hot reload
npm start                # Servidor en producción
```

## 👥 Desarrollo en Equipo

Este proyecto está diseñado para 4 grupos trabajando en paralelo. Consulta:

- [**GIT_STRATEGY.md**](GIT_STRATEGY.md) - Estrategia de ramificación y commits
- [**FOLDER_STRATEGY.md**](FOLDER_STRATEGY.md) - Organización por features

## 🎨 Features Principales

- ✅ Catálogo de juegos con búsqueda
- ✅ Juego destacado con descuentos
- ✅ Sistema de filtros y ratings
- ✅ Diseño responsive tipo Steam
- ✅ API REST conectada

## 🛠️ Tecnologías y Herramientas

- Git para control de versiones
- ESLint para linting
- Concurrently para ejecución paralela
- Hot reload en desarrollo

## 📝 Convenciones

- **Commits**: `feat(g#): descripción` (ver GIT_STRATEGY.md)
- **Branches**: `feature/g#/nombre-feature`
- **Carpetas**: Organización por features (ver FOLDER_STRATEGY.md)

## 🐛 Troubleshooting

### El frontend no se conecta al backend
Verifica que el backend esté corriendo en `http://localhost:3000`

### Error de CORS
El backend ya tiene CORS configurado. Verifica que las URLs coincidan.

### Puerto ocupado
Si el puerto 3000 o 5173 está ocupado, modifica:
- Backend: `backend/.env` → `PORT=3001`
- Frontend: `frontend/vite.config.js` → `server: { port: 5174 }`

---

**Proyecto Software Seguro** | **2025B**