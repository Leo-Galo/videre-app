# Firebase Hosting Deployment Setup

Este documento describe la configuración de Firebase Hosting para el despliegue automático de la aplicación Videre.

## 🌐 Configuración Actual

### Proyecto Firebase
- **Project ID**: `videre-saas-26178`
- **Hosting URL**: `https://videre-saas-26178.web.app` (y `https://videre-saas-26178.firebaseapp.com`)

### Configuración de Hosting

El archivo `firebase.json` está optimizado para Next.js con las siguientes características:

- **Source Directory**: Directorio raíz (`.`) - Firebase detecta automáticamente Next.js
- **Framework Backend**: Habilitado en región `us-central1`
- **Ignore Patterns**: Configurado para excluir archivos innecesarios:
  - Archivos de configuración (`*.config.*`, `package*.json`, etc.)
  - Directorios de código fuente (`src/`, `functions/`, `docs/`)
  - Archivos de desarrollo (`.git/`, `.vscode/`, etc.)

## 🚀 Despliegue Automático

### Workflow de Producción
**Archivo**: `.github/workflows/firebase-hosting-merge.yml`

Se ejecuta automáticamente cuando:
- Se hace push a la rama `main`
- Se completa un merge a la rama `main`

**Pasos del workflow**:
1. Checkout del código
2. Setup de Node.js 18 con caché de npm
3. Instalación de dependencias (`npm ci`)
4. Build de la aplicación (`npm run build`)
5. Deploy a Firebase Hosting (canal live)

### Workflow de Preview
**Archivo**: `.github/workflows/firebase-hosting-pull-request.yml`

Se ejecuta automáticamente cuando:
- Se abre un Pull Request
- Se actualiza un Pull Request existente

**Características**:
- Genera una URL de preview única para cada PR
- Permite revisar cambios antes del merge
- Se limpia automáticamente al cerrar el PR

## 🔧 Configuración de Next.js

### Optimizaciones Aplicadas
- **Compresión**: Habilitada para mejor rendimiento
- **Trailing Slash**: Deshabilitado para URLs limpias
- **Font Loading**: Configurado con fallbacks del sistema
- **Images**: Patrones remotos configurados para dominios permitidos

### Build Output
- La aplicación genera un build estándar de Next.js en `.next/`
- Firebase Hosting detecta automáticamente Next.js y configura el servidor

## 📋 Prerequisites

### Variables de Entorno (GitHub Secrets)
- `FIREBASE_SERVICE_ACCOUNT_VIDERE_SAAS_26178`: Service Account para autenticación con Firebase
- `GITHUB_TOKEN`: Se proporciona automáticamente por GitHub Actions

### Permisos del Service Account
El Service Account debe tener los siguientes roles:
- Firebase Hosting Admin
- Firebase Rules System (si se usan reglas de seguridad)

## 🔍 Monitoreo y Logs

### GitHub Actions
- Los logs de deployment están disponibles en la pestaña "Actions" del repositorio
- Cada deployment muestra la URL generada (producción o preview)

### Firebase Console
- Logs de hosting disponibles en [Firebase Console](https://console.firebase.google.com/project/videre-saas-26178/hosting)
- Métricas de uso y rendimiento
- Configuración de dominios personalizados

## 🛠️ Comandos Manuales

### Despliegue Local (Desarrollo)
```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Login a Firebase
firebase login

# Deploy manual
firebase deploy --only hosting
```

### Build Local
```bash
# Instalar dependencias
npm ci

# Generar build de producción
npm run build

# Servir localmente (opcional)
npm start
```

## 🐛 Troubleshooting

### Problemas Comunes

**Build falla por Google Fonts**:
- La configuración actual usa un link directo en el HTML para evitar problemas de red durante build
- Los fonts se cargan en runtime con fallbacks del sistema

**Deploy falla por permisos**:
- Verificar que el service account tenga los permisos correctos
- Revisar que el secret esté configurado correctamente en GitHub

**URLs no funcionan después del deploy**:
- Next.js App Router requiere configuración especial que ya está aplicada
- Firebase detecta automáticamente las rutas de Next.js

## 📞 Soporte

Para problemas con el deployment, revisar:
1. Logs en GitHub Actions
2. Firebase Console para errores de hosting
3. Configuración del service account en Firebase IAM

---
**Último actualizado**: Agosto 2024
**Configurado por**: GitHub Copilot AI Assistant