# Videre - Frontend Prototyping Project

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Este proyecto contiene el prototipo funcional del frontend para **Videre**, un completo Sistema de Gestión (SaaS) para ópticas. Ha sido construido con Next.js, TypeScript y ShadCN, y está diseñado para una integración fluida con un backend.

## 🚀 Empezando

Para poner en marcha el entorno de desarrollo local, sigue estos pasos:

1.  **Instalar Dependencias:**
    Abre tu terminal en el directorio raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```

2.  **Iniciar el Servidor de Desarrollo:**
    Una vez instaladas las dependencias, inicia la aplicación con:
    ```bash
    npm run dev
    ```

3.  **Abrir en el Navegador:**
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación en funcionamiento.

## 🌐 Despliegue Automático

Este proyecto está configurado con **despliegue automático a Firebase Hosting**:

### Configuración Actual
- **Proyecto Firebase**: `videre-saas-26178`
- **Despliegue en producción**: Automático al hacer push a la rama `main`
- **Previews de PR**: Se generan automáticamente para cada Pull Request

### Prerequisites para Despliegue
- El repositorio debe tener configurado el secret `FIREBASE_SERVICE_ACCOUNT_VIDERE_SAAS_26178`
- Firebase CLI configurado con el proyecto `videre-saas-26178`
- Node.js 18+ para el proceso de build

### Comandos de Build
```bash
# Instalar dependencias
npm ci

# Build para producción
npm run build

# Desplegar manualmente (requiere Firebase CLI)
firebase deploy --only hosting
```

## 🛠️ Estructura del Proyecto

-   **/src/app**: Contiene todas las rutas y páginas de la aplicación, siguiendo la estructura del App Router de Next.js.
-   **/src/components**: Componentes de React reutilizables, organizados por funcionalidad (auth, dashboard, landing, shared, ui).
-   **/src/services**: **Capa de Abstracción de Datos.** Contiene toda la lógica para obtener y manipular datos. **Este es el principal punto de integración para el equipo de backend.**
-   **/src/types**: Contiene todas las definiciones de tipos de TypeScript y los esquemas de validación de Zod. Es el **contrato de datos** entre el frontend y el backend.
-   **/src/hooks**: Hooks personalizados de React para manejar el estado global (ej: sesión de usuario, estado de la caja).
-   **/src/lib**: Utilidades generales, configuración de Firebase y el cliente API.

## 📖 Guía de Integración para Backend

> [!IMPORTANT]
> Para todos los desarrolladores de backend, es **esencial** leer la guía de integración completa. Este documento detalla la arquitectura del frontend, cómo reemplazar los servicios simulados (`mock services`) por llamadas a una API real, y los requisitos críticos del backend.

Puedes encontrar la guía aquí:
### **[`/src/README-BACKEND.md`](./src/README-BACKEND.md)**

Y la especificación técnica detallada de la API aquí:
### **[`/src/API_SPECIFICATION.md`](./src/API_SPECIFICATION.md)**
