# Guía de Integración Definitiva: Videre para Desarrolladores Backend

---

## 1. Visión General y Misión

¡Bienvenido al equipo de Videre! Este documento es tu guía técnica completa para conectar el frontend de Videre, que ha sido completamente prototipado y es funcional a nivel de interfaz, con un backend robusto que tú construirás.

> [!IMPORTANT]
> **Fuente de Verdad Técnica: Especificación de la API**
>
> Este documento es una guía de alto nivel. Para la especificación técnica detallada de cada endpoint, modelos de datos, y ejemplos de request/response, consulta el contrato oficial de la API:
> ### **[`/src/API_SPECIFICATION.md`](src/API_SPECIFICATION.md)**

### 1.1. Tu Misión Principal

Tu objetivo es **reemplazar la capa de servicios simulada (`mock services`) por llamadas a una API real**. El frontend está diseñado específicamente para que este proceso sea lo más directo posible, minimizando la necesidad de tocar el código de la UI. Tu enfoque será construir los endpoints de la API y luego actualizar los archivos de servicio para que consuman dichos endpoints.

### 1.2. Pila Tecnológica del Frontend

- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** TailwindCSS
- **Componentes:** ShadCN
- **IA Generativa:** Genkit

---

## 2. Arquitectura Clave del Frontend

Entender estos tres pilares es esencial para una integración exitosa.

### 2.1. La Capa de Servicios (`/src/services`): Tu Único Punto de Integración

**Este es el concepto más importante de la arquitectura.** Toda la lógica de datos (obtener, crear, actualizar, eliminar) está completamente abstraída en archivos dentro del directorio `src/services/`.

- **¿Por qué?** Esta separación de preocupaciones significa que los componentes de React no saben *cómo* se obtienen los datos; solo saben *qué* función llamar para obtenerlos.
- **Tu Foco Exclusivo:** **No necesitarás modificar componentes de React en `src/app/dashboard/...`**. Tu trabajo se centrará al 100% en modificar el *contenido* de las funciones dentro de los archivos en `src/services/`.
- **Funcionamiento Actual:** Cada función en estos archivos (ej: `getPatients()`) actualmente devuelve una `Promise` que resuelve con datos del `localStorage` tras un breve `setTimeout` para simular la latencia de la red.
- **Tu Tarea:** Reemplazar el cuerpo de estas funciones con llamadas `fetch` (o usando un cliente como Axios) a los endpoints de tu API.

### 2.2. Modelos de Datos (`/src/types`): El Contrato de la API

El directorio `src/types/` es la **única fuente de verdad** para todas las estructuras de datos de la aplicación.

- **Contrato Estricto:** Tu backend **debe** consumir y producir objetos JSON que coincidan exactamente con estas interfaces de TypeScript. Cualquier desviación causará errores de tipado en el frontend.
- **Explora estos archivos:** Antes de empezar, familiarízate con `patient.ts`, `pos.ts`, `user.ts`, `supplier.ts`, etc., para entender las entidades del negocio.

### 2.3. Autenticación y Autorización (Simuladas)

Actualmente, el login y los roles se simulan así:
- `localStorage.setItem('mockAuth', 'true')`: Simula un usuario autenticado.
- `localStorage.setItem('mockUserRole', 'Admin' | 'Optómetra' | 'Asesor' | 'SuperAdmin')`: Asigna un rol.
- `localStorage.setItem('mockUserName', 'Nombre de la Clínica')`: Guarda el nombre para la UI.

Tu backend deberá reemplazar esto con un sistema de autenticación real (ej. JWT).

---

## 3. Guía de Implementación: De Mock a Producción

### Paso 1: Entorno y Familiarización (5 min)
- Abre el proyecto y navega por los directorios `src/services/` y `src/types/`.
- Lee los nombres de los archivos y las funciones exportadas en la capa de servicio para tener un mapa mental de los dominios del negocio.

### Paso 2: Implementar Autenticación (`POST /api/auth/login`)
Este es el primer y más importante endpoint.

- **Ruta:** `POST /api/auth/login`
- **Request Body (Ejemplo):**
  ```json
  { "email": "user@example.com", "password": "user_password" }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "token": "ey...",
    "user": {
      "id": "user-id-123",
      "name": "Dr. Alan Grant",
      "email": "user@example.com",
      "role": "Admin",
      "clinicId": "clinic-id-abc" 
    }
  }
  ```
- **Nota Crucial:** El `clinicId` en la respuesta es **vital**. El frontend lo usará para todas las futuras peticiones de datos de esa clínica. El token JWT debe contener `userId`, `role`, y `clinicId`.

### Paso 3: Modificar los Servicios (Función por Función)
Este es el núcleo de tu trabajo. Para cada función en los archivos de `/src/services/`, sigue este patrón:
1. Crea el endpoint de API correspondiente en tu backend.
2. Modifica la función en el archivo de servicio del frontend para que llame a ese endpoint.

A continuación, el mapeo detallado de función a endpoint.

#### **Módulo: Gestión de Pacientes (`patient-service.ts`)**

| Función                     | Método | Endpoint Sugerido                      | Lógica Backend Crítica                                                                                                |
| --------------------------- | ------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `getPatients()`               | `GET`    | `/api/patients`                        | **Filtrar por `clinicId` del token.**                                                                                 |
| `getPatientById(id)`        | `GET`    | `/api/patients/{id}`                   | Asegurarse de que el paciente pertenece a la `clinicId` del token.                                                     |
| `addPatient(data)`          | `POST`   | `/api/patients`                        | Asociar el nuevo paciente a la `clinicId` del token. `data` es `PatientFormValues` de `/src/types/patient-schema.ts`   |
| `updatePatient(id, data)`   | `PUT`    | `/api/patients/{id}`                   | Validar que el paciente pertenece a la `clinicId` del token antes de actualizar.                                      |
| `deletePatient(id)`         | `DELETE` | `/api/patients/{id}`                   | Validar permisos de rol (`Admin`) y `clinicId`.                                                                       |
| `addClinicalRecord(id, data)`| `POST`   | `/api/patients/{id}/clinical-history`  | Añadir una nueva entrada al historial clínico del paciente. `data` es `ClinicalRecord`. Actualizar `lastVisitDate` y `overallNextRecommendedVisitDate`. |

#### **Módulo: Inventario (`inventory-service.ts`)**

| Función                     | Método | Endpoint Sugerido                      | Lógica Backend Crítica                                                                                       |
| --------------------------- | ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `getProducts()`               | `GET`    | `/api/products`                        | **Filtrar por `clinicId` del token.**                                                                        |
| `addProduct(data)`          | `POST`   | `/api/products`                        | Asociar a la `clinicId` y `branchId` (sucursal) correctos.                                                     |
| `updateProduct(data)`       | `PUT`    | `/api/products/{id}`                   | Validar que el producto pertenece a la `clinicId` del token.                                                   |
| `updateProductStock(...)`   | `POST`   | `/api/inventory/stock-adjustment`      | Transaccional. Debe registrar el motivo del ajuste. Validar permisos de rol (`Admin`).                         |

#### **Módulo: Punto de Venta (POS) (`order-service.ts`)**

| Función                 | Método | Endpoint Sugerido               | Lógica Backend Crítica                                                                                                 |
| ----------------------- | ------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `getOrders()`           | `GET`    | `/api/orders`                   | **Filtrar por `clinicId` del token.**                                                                                  |
| `saveOrder(data)`       | `POST`   | `/api/orders`                   | **CRÍTICO:** Debe ser una transacción. **Disminuir el stock** de cada producto en la orden de forma atómica. `data` es `Order` de `src/types/pos.ts`. |
| `addPaymentToOrder(...)`| `POST`   | `/api/orders/{id}/payment`      | Añadir uno o más pagos a una orden existente. Recalcular y guardar el `balanceDueCRC`. Cambiar `status` a `completed` si el saldo es cero. |
| `voidOrder(id, reason)` | `POST`   | `/api/orders/{id}/void`         | **NO REESTABLECER STOCK.** Marcar la orden como anulada. Lógica para Nota de Crédito si aplica. Validar rol (`Admin`). |
| `processReturn(...)`    | `POST`   | `/api/orders/{id}/return`       | **CRÍTICO:** Debe ser una transacción. **Aumentar el stock** de los productos devueltos.                                |

#### **...y así con todos los demás servicios.**
Revisa `user-service.ts`, `supplier-service.ts`, `expense-service.ts`, etc., y aplica el mismo patrón.

### Paso 4: Ejemplo Detallado de Modificación de un Servicio
**ANTES (Lógica de `localStorage` en `patient-service.ts`):**
```typescript
// src/services/patient-service.ts (Estado Actual)
export async function addPatient(patientData: PatientFormValues): Promise<Patient> {
  const patients = getStoredPatients(); // Lee de localStorage
  const newPatient: Patient = {
    id: `pat-${Date.now()}`,
    registrationDate: new Date().toISOString(),
    // ...spread de patientData
  };
  const updatedPatients = [newPatient, ...patients];
  saveStoredPatients(updatedPatients); // Guarda en localStorage
  return new Promise(resolve => setTimeout(() => resolve(newPatient), 50));
}
```

**DESPUÉS (Lógica con `fetch` a tu API):**
```typescript
// src/services/patient-service.ts (Tu Implementación Final)

// Función auxiliar que podrías crear para manejar la autenticación
function getAuthHeader(): { Authorization: string; 'Content-Type': string } {
    const token = localStorage.getItem('authToken'); // El token que guardaste después del login
    if (!token) throw new Error("No auth token found");
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

export async function addPatient(patientData: PatientFormValues): Promise<Patient> {
    const response = await fetch('/api/patients', { // URL base de tu API
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(patientData)
    });

    if (!response.ok) {
        // En una app real, aquí manejarías los errores de la API de forma más robusta
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || 'Failed to add patient');
    }

    const newPatient: Patient = await response.json();
    return newPatient;
}
```

---

## 4. Requisitos Críticos del Backend

### 4.1. Multi-Tenancy por `clinicId` (Aislamiento de Datos)
> [!DANGER]
> **ESTA ES LA REGLA DE SEGURIDAD MÁS IMPORTANTE DEL SISTEMA.**
>
> La plataforma está diseñada para ser un SaaS multi-inquilino (`multi-tenant`), donde cada clínica opera en un entorno de datos completamente aislado. El incumplimiento de esta regla resultará en una brecha de seguridad grave.

-   **Aislamiento Total:** **TODA** consulta a la base de datos para obtener datos específicos de una clínica (pacientes, inventario, ventas, etc.) **DEBE ESTAR FILTRADA POR `clinicId`**.
-   **Fuente de Verdad del `clinicId`:** El `clinicId` **debe obtenerse exclusivamente del token de autenticación (JWT)** del usuario que realiza la petición. Nunca confíes en un `clinicId` enviado en el `body` o en los parámetros de la URL, ya que puede ser manipulado.
-   **Seguridad No Negociable:** Un usuario de la "Clínica A" **NUNCA** debe poder ver, modificar, o siquiera inferir la existencia de datos de la "Clínica B". Esto incluye resultados de búsqueda, reportes y cualquier otro endpoint que devuelva datos de la clínica.

### 4.2. Control de Acceso Basado en Roles (RBAC)
- El rol del usuario (`Admin`, `Optómetra`, `Asesor`) también debe estar en el token JWT.
- Protege tus endpoints basándote en este rol.
  - **Ejemplo:** `DELETE /api/users/{id}` debe verificar que el usuario solicitante tiene el rol `Admin`.
  - **Ejemplo:** Las rutas de reportes financieros (`/api/reports/financial-summary`) podrían estar restringidas solo para el rol `Admin`.

---

## 5. Flujos de Negocio Complejos

### 5.1. Gestión de Suscripciones (PayPal)
El frontend ahora utiliza enlaces de pago directo de PayPal. El backend ya no necesita endpoints para crear y capturar órdenes con la API de PayPal. En su lugar, la responsabilidad del backend es procesar las notificaciones de pago completado.

**Escenario:** Un usuario paga su suscripción a través de un enlace de PayPal.

1.  **Redirección:** El frontend redirige al usuario a la URL de pago de PayPal.
2.  **Pago:** El usuario completa el pago en la plataforma de PayPal.
3.  **Notificación de PayPal (Tu Tarea):**
    *   **Configurar un Webhook:** Debes configurar un endpoint en tu API (ej: `POST /api/webhooks/paypal`) y registrarlo en tu cuenta de desarrollador de PayPal para que escuche el evento `CHECKOUT.ORDER.APPROVED`.
    *   **Lógica del Webhook:** Cuando PayPal envía una notificación a tu webhook, tu backend debe:
        1.  **Verificar la autenticidad** de la notificación para prevenir fraudes.
        2.  Extraer los datos de la transacción, como el `custom_id` (que deberías establecer para identificar la `clinicId`) o el correo del comprador.
        3.  **Actualizar la base de datos:** Encontrar la clínica correspondiente y actualizar su estado de suscripción (`status: 'active'`), el plan (`plan: 'Pro'`), y la fecha del próximo cobro (`nextBillingDate`).
        4.  Enviar un correo de confirmación de pago al cliente.

**Alternativa (Manual):** Si no se implementa un webhook, el SuperAdmin deberá verificar los pagos manualmente en PayPal y usar el panel de SuperAdmin para activar o extender las suscripciones de las clínicas.

### 5.2. Facturación Electrónica (Hacienda - Costa Rica)
La generación de comprobantes electrónicos es una de las funcionalidades más críticas y complejas. El frontend solo inicia el proceso y muestra el resultado; toda la lógica de negocio reside en tu servidor.

**Escenario:** Un usuario completa una venta en el Punto de Venta (POS) y presiona "Generar Documento".

1. **Llamada a la API:** El frontend llama al endpoint `POST /api/orders` (que reemplaza a `saveOrder`) con todos los datos de la orden.

2. **Lógica del Backend (Tus Responsabilidades):**
    - **Validación:** Valida todos los datos recibidos (precios, stock, datos del cliente).
    - **Generación del XML:** Construye el archivo XML de la factura electrónica (o tiquete) siguiendo la estructura exacta de la versión 4.4 de Hacienda. Esto incluye nodos para emisor, receptor, líneas de detalle, impuestos, etc.
    - **Firma Digital:** Firma el XML utilizando la llave criptográfica (.p12) y el PIN de la clínica. Estos datos deben estar almacenados de forma segura en el entorno del backend.
    - **Envío a Hacienda:** Envía el XML firmado al API de validación de comprobantes de Hacienda.
    - **Gestión de la Respuesta:**
        - **Si es Aceptado:** Recibe la respuesta de Hacienda, extrae la `clave` y el `consecutivo` y guárdalos en el registro de la orden en tu base de datos.
        - **Si es Rechazado:** Recibe el motivo del rechazo, regístralo y devuelve un error claro al frontend.
    - **Generación de PDF:** Crea una representación gráfica de la factura en formato PDF. Este PDF es el que el cliente final suele ver.
    - **Envío al Cliente:** Utiliza un servicio de correo transaccional (ej. SendGrid, Resend) para enviar un email al cliente. El correo debe adjuntar tanto el **XML** (comprobante legal) como el **PDF** (representación gráfica). Usa el campo `billingEmail` del payload de la orden si está presente; de lo contrario, usa el email del cliente (`customer.email`).
    - **Respuesta al Frontend:** Devuelve una respuesta al frontend confirmando que el proceso fue exitoso, incluyendo idealmente la `clave` y el `consecutivo` para que se puedan mostrar en la interfaz si es necesario.

### 5.3. Integración de IA con Genkit
- **Estado Actual:** Las funciones en `src/ai/flows/` están simuladas y no realizan llamadas reales a APIs de IA.
- **Tu Tarea (Opción Recomendada):**
    1. El backend expone un endpoint seguro (ej. `POST /api/ai/generate-summary`).
    2. El frontend llama a tu endpoint con los datos necesarios (ej. historial clínico).
    3. Tu endpoint de backend recibe la petición, añade la API Key de Google AI (almacenada de forma segura como variable de entorno) y luego llama a la API de Genkit/Google AI.
    4. El backend devuelve la respuesta de la IA al frontend.
    - **Ventaja:** Esta estrategia de "backend como proxy" mantiene la API Key de IA completamente segura y oculta del navegador del cliente.

---

## 6. Monitoreo y Salud del Sistema

El panel de Super Administrador incluye una sección de "Salud del Sistema". Esta interfaz está diseñada para mostrar métricas clave de la infraestructura, pero requiere que el backend la alimente con datos reales.

### Tu Tarea:
1.  **Configurar Monitoreo:** Habilita y configura servicios como **Google Cloud Monitoring** o **Firebase Performance Monitoring** para recopilar datos de la aplicación desplegada (ej. uso de CPU de Cloud Run, latencia de API, tasa de errores 5xx, etc.).
2.  **Crear Endpoints de Monitoreo:** Desarrolla endpoints de API seguros, accesibles solo por el rol `SuperAdmin`, que consulten las APIs de los servicios de monitoreo.
    -   **Endpoint Sugerido:** `GET /api/superadmin/system-health`
    -   **Respuesta Esperada (Ejemplo):**
        ```json
        {
          "cpuUsagePercent": 15.5,
          "memoryUsageMB": 512,
          "apiLatencyP95_ms": 120,
          "errorRate5xx_percent": 0.01,
          "databaseReadsLastHour": 15230,
          "databaseWritesLastHour": 4500
        }
        ```
3.  **Integración:** Una vez que estos endpoints estén listos, el frontend se puede actualizar para llamarlos y mostrar los datos en tiempo real en `/superadmin/system-health`, reemplazando la simulación actual.

---

¡Buena suerte! Esta arquitectura está diseñada para que la integración sea un proceso metódico y predecible. Si sigues esta guía y respetas los contratos de datos definidos en `src/types/`, la transición será un éxito.
