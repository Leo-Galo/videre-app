# Videre SaaS - API Specification

**Version:** 1.0
**Last Updated:** July 3, 2024

---

## 1. Introduction & Core Concepts

This document provides a complete technical specification for the Videre SaaS backend API. The frontend is fully prototoped and relies on this API contract. All data models are defined in the `/src/types/` directory and must be strictly adhered to.

### 1.1. Authentication

The API is protected using **JSON Web Tokens (JWT)**. Every request to a protected endpoint must include an `Authorization` header with the value `Bearer <token>`.

-   **Token Source**: The token is obtained from the `POST /api/auth/login` endpoint.
-   **JWT Payload**: The JWT payload **MUST** contain the following claims:
    -   `userId`: The ID of the authenticated user.
    -   `role`: The user's role (`Admin`, `Optómetra`, `Asesor`, `SuperAdmin`).
    -   `clinicId`: The ID of the clinic the user belongs to. This is **CRITICAL** for data isolation.

### 1.2. Multi-Tenancy (Data Isolation)

> [!DANGER]
> **ESTA ES LA REGLA DE SEGURIDAD MÁS IMPORTANTE DEL SISTEMA.**
>
> La plataforma está diseñada para ser un SaaS multi-inquilino (`multi-tenant`), donde cada clínica opera en un entorno de datos completamente aislado. El incumplimiento de esta regla resultará en una brecha de seguridad grave y en la exposición de datos confidenciales de pacientes entre clínicas.

-   **Regla Fundamental**: Toda consulta a la base de datos para obtener datos específicos de una clínica (pacientes, inventario, órdenes, etc.) **DEBE SER FILTRADA O LIMITADA POR EL `clinicId`**.
-   **Fuente de Verdad del `clinicId`**: El `clinicId` **debe obtenerse exclusivamente del token de autenticación (JWT)** del usuario que realiza la petición. Nunca confíes en un `clinicId` enviado en el `body` o en los parámetros de la URL para filtrar datos, ya que puede ser fácilmente manipulado por un actor malicioso.
-   **Seguridad No Negociable**: Un usuario de la "Clínica A" **NUNCA** debe poder ver, modificar, o siquiera inferir la existencia de datos de la "Clínica B". Esto incluye resultados de búsqueda, reportes, detalles de una orden y cualquier otro endpoint que devuelva datos de la clínica. La lógica de negocio del frontend asume este aislamiento y no implementa chequeos de propiedad de los datos del lado del cliente.

### 1.3. Plan-Based Access Control (Feature Gating)

**This is a critical security and business logic requirement.** While the frontend may hide UI elements based on the user's plan, the backend **MUST** be the ultimate authority for enforcing access to plan-restricted features.

-   **Rule**: Before executing the logic of an endpoint corresponding to a "Pro" or "Premium" feature (e.g., generating an advanced report, using an AI feature), the backend must:
    1.  Use the `clinicId` from the JWT to look up the clinic's current subscription `plan` (`Basic`, `Pro`, `Premium`) and `status` (`Active`, `Trialing`, etc.) in the database.
    2.  Verify that the clinic's plan allows access to the requested feature.
-   **Error Handling**: If a clinic on a "Basic" plan attempts to access a "Premium" endpoint, the API **MUST** return an appropriate error, such as `402 Payment Required` or `403 Forbidden`, with a clear message.
-   **Security**: This server-side validation prevents users from bypassing frontend limitations.

### 1.4. General Error Response Format

Failed requests (4xx, 5xx status codes) should return a JSON object with a `message` key:

```json
{
  "message": "A clear, concise error message."
}
```

---

## 2. Authentication & Notifications

### `POST /api/auth/login`

-   **Description**: Authenticates a user and returns a JWT.
-   **Authorization**: Public.
-   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "user_password"
    }
    ```
-   **Success Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsInJvbGUiOiJBZG1pbiIsImNsaW5pY0lkIjoiY2xpbmljLWFhYSJ9.some_signature",
      "user": {
        "id": "user-123",
        "name": "Dr. Alan Grant",
        "email": "user@example.com",
        "role": "Admin",
        "clinicId": "clinic-aaa"
      }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: Invalid email or password.
    -   `400 Bad Request`: Missing `email` or `password`.

### `POST /api/auth/register`

-   **Description**: Creates a new clinic, an initial admin user for that clinic, and returns a JWT. The user who registers is automatically assigned the 'Admin' role for the newly created clinic.
-   **Authorization**: Public.
-   **Request Body** (`RegisterFormValues` from `src/types/auth-schemas.ts`):
    ```json
    {
      "clinicName": "Óptica Visión Clara",
      "email": "admin@visionclara.com",
      "password": "A_Strong_Password123!"
    }
    ```
-   **Backend Logic**:
    1.  Validate the incoming data.
    2.  Create the `Clinic` record in the database.
    3.  Create the `User` record in Firebase Authentication and in the user's collection, associating it with the new `clinicId`.
    4.  **[CRITICAL] Trigger Welcome Email**: After successfully creating the user, invoke a transactional email service (e.g., SendGrid, Resend) to send a welcome email.
-   **Success Response (201Created)**: Same format as the login success response.
-   **Error Responses**:
    -   `409 Conflict`: An account with the specified email already exists.
    -   `400 Bad Request`: Invalid data provided (e.g., weak password).

### Transactional Emails (e.g., Welcome Email)

-   **Service Recommendation**: Use a dedicated transactional email provider like **SendGrid** or **Resend** for reliability and scalability. Store API keys securely as environment variables on the server.
-   **Welcome Email Content (Suggestion)**:
    -   **Subject**: ¡Bienvenido a Videre, [ClinicName]!
    -   **Body**:
        -   Personalized greeting.
        -   Confirmation of successful registration.
        -   Brief overview of key features (e.g., "Ya puedes empezar a registrar pacientes, gestionar tu inventario y programar citas.").
        -   A clear call-to-action button linking to the `/dashboard`.
        -   Links to the Help Center or support contact.

---

## 3. Module: Patients (`/api/patients`)

All endpoints require authentication.

### `GET /api/patients`

-   **Description**: Retrieves a paginated list of patients for the user's clinic.
-   **Authorization**: `Admin`, `Optómetra`, `Asesor`.
-   **Query Parameters**:
    -   `page` (number, optional): The page number to retrieve.
    -   `limit` (number, optional): The number of patients per page.
    -   `search` (string, optional): A search term to filter patients by name, ID, etc.
-   **Success Response (200 OK)**:
    ```json
    {
      "data": [ /* Array of Patient objects from src/types/patient.ts */ ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 10,
        "totalItems": 100
      }
    }
    ```

### `GET /api/patients/{id}`

-   **Description**: Retrieves a single patient by their ID.
-   **Authorization**: `Admin`, `Optómetra`, `Asesor`.
-   **Path Parameters**: `id` (string) - The patient's ID.
-   **Success Response (200 OK)**: A single `Patient` object.
-   **Error Responses**:
    -   `404 Not Found`: Patient not found or does not belong to the user's clinic.

### `POST /api/patients`

-   **Description**: Creates a new patient.
-   **Authorization**: `Admin`, `Optómetra`, `Asesor`.
-   **Request Body**: A `PatientFormValues` object from `src/types/patient-schema.ts`.
-   **Success Response (201 Created)**: The newly created `Patient` object.
-   **Error Responses**:
    -   `400 Bad Request`: Invalid data provided.

### `PUT /api/patients/{id}`

-   **Description**: Updates an existing patient.
-   **Authorization**: `Admin`, `Optómetra`, `Asesor`.
-   **Path Parameters**: `id` (string) - The patient's ID.
-   **Request Body**: A partial `PatientFormValues` object.
-   **Success Response (200 OK)**: The updated `Patient` object.
-   **Error Responses**:
    -   `404 Not Found`: Patient not found.
    -   `400 Bad Request`: Invalid data provided.

### `DELETE /api/patients/{id}`

-   **Description**: Deletes a patient.
-   **Authorization**: `Admin`.
-   **Path Parameters**: `id` (string) - The patient's ID.
-   **Success Response (204 No Content)**.
-   **Error Responses**:
    -   `404 Not Found`: Patient not found.

### `POST /api/patients/{id}/clinical-history`

-   **Description**: Adds a new clinical record to a patient's history.
-   **Authorization**: `Admin`, `Optómetra`.
-   **Path Parameters**: `id` (string) - The patient's ID.
-   **Request Body**: A `ClinicalRecord` object from `src/types/patient.ts`. The backend should handle generating IDs for the record and any prescriptions within it. **Note:** The `Prescription` object within `ClinicalRecord` is now very detailed, including fields for contact lenses and frames. The backend should be prepared to receive and store this full structure.
-   **Success Response (200 OK)**: The fully updated `Patient` object, including the new clinical record.
-   **Error Responses**:
    -   `404 Not Found`: Patient not found.

---

## 4. Module: Inventory (`/api/products`)

All endpoints require authentication.

### `GET /api/products`

-   **Description**: Retrieves a list of all products for the user's clinic.
-   **Authorization**: `Admin`, `Optómetra`, `Asesor`.
-   **Success Response (200 OK)**: An array of `Product` objects from `src/types/pos.ts`.

### `POST /api/products`

-   **Description**: Creates a new product.
-   **Authorization**: `Admin`.
-   **Request Body**: A `ProductFormValues` object from `src/types/inventory-schema.ts`.
-   **Success Response (201 Created)**: The newly created `Product` object.

### `PUT /api/products/{id}`

-   **Description**: Updates an existing product's details.
-   **Authorization**: `Admin`.
-   **Path Parameters**: `id` (string) - The product's ID.
-   **Request Body**: A partial `ProductFormValues` object.
-   **Success Response (200 OK)**: The updated `Product` object.

### `DELETE /api/products/{id}`

-   **Description**: Deletes a product. **Should fail if the product has associated stock or sales history unless a force flag is used.**
-   **Authorization**: `Admin`.
-   **Path Parameters**: `id` (string) - The product's ID.
-   **Success Response (204 No Content)**.
-   **Error Responses**:
    -   `404 Not Found`: Product not found.
    -   `409 Conflict`: Product cannot be deleted due to existing stock or sales history.

### `POST /api/inventory/stock-adjustment`

-   **Description**: Performs a stock adjustment for one or more products. This should be a transactional operation.
-   **Authorization**: `Admin`.
-   **Request Body**:
    ```json
    {
      "reason": "Conteo físico anual",
      "adjustments": [
        { "productId": "prod-123", "newStock": 95 },
        { "productId": "prod-456", "newStock": 10 }
      ]
    }
    ```
-   **Success Response (200 OK)**:
    ```json
    { "message": "Stock ajustado exitosamente para 2 productos." }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: Invalid product IDs or data.

---

## 5. Module: Point of Sale (POS) & Orders (`/api/orders`)

All endpoints require authentication.

### `GET /api/orders`

-   **Description**: Retrieves a list of all orders for the user's clinic.
-   **Authorization**: `Admin`, `Optómetra`, `Asesor`.
-   **Success Response (200 OK)**: An array of `Order` objects from `src/types/pos.ts`.

### `POST /api/orders`

-   **Description**: Creates a new order and decreases product stock.
-   **Authorization**: `Admin`, `Optómetra`, `Asesor`.
-   **Request Body**: An `Order` object from `src/types/pos.ts`.
-   **Backend Logic (Fase 1 - Sin Facturación Electrónica):**
    1.  **Atomic Transaction**: The entire operation must be atomic. If any step fails, all changes must be rolled back.
    2.  **Stock Reduction**: Decrease the `stock` quantity for each `Product` in the order's `items` array.
    3.  **Save Order**: Save the `Order` object in the database.
-   **Backend Logic (Tarea Futura - Facturación Electrónica):**
    -   **NO IMPLEMENTAR AHORA.**
    -   En el futuro, esta función se expandirá para comunicarse con la API de un proveedor de facturación electrónica.
-   **Success Response (201 Created)**: The newly created `Order` object.
-   **Error Responses**:
    -   `400 Bad Request`: Insufficient stock, invalid customer data.
    
### `POST /api/orders/{id}/payment`

- **Description**: Adds one or more payments to an existing order.
- **Authorization**: `Admin`, `Optómetra`, `Asesor`.
- **Path Parameters**: `id` (string) - The order's ID.
- **Request Body**: An array of `PaymentDetail` objects.
  ```json
  [
    { "method": "cash", "amountCRC": 10000 },
    { "method": "card", "amountCRC": 25000, "reference": "REF54321" }
  ]
  ```
- **Backend Logic**:
  1.  Find the order by ID.
  2.  Add the new payment(s) to the order's `payments` array.
  3.  Recalculate `amountPaidTotalCRC` and `balanceDueCRC`.
  4.  If `balanceDueCRC` is 0 or less, change order `status` to `completed`.
- **Success Response (200 OK)**: The updated `Order` object.

### `POST /api/orders/{id}/void`

-   **Description**: Voids an existing order/invoice. **Does not restock items.**
-   **Authorization**: `Admin`.
-   **Path Parameters**: `id` (string) - The order's ID.
-   **Request Body**:
    ```json
    { "reason": "Error en la facturación." }
    ```
-   **Backend Logic**:
    -   Mark the order status as `voided` and save the `voidReason`.
    -   **Fase Futura:** Generar una "Nota de Crédito" (v4.4) y enviarla.
-   **Success Response (200 OK)**: The updated (voided) `Order` object.

### `POST /api/orders/{id}/return`

-   **Description**: Processes a return of one or more items from an order. **Increases product stock.**
-   **Authorization**: `Admin`.
-   **Path Parameters**: `id` (string) - The order's ID.
-   **Request Body**:
    ```json
    {
      "itemsToReturn": [
        { "productId": "prod-123", "quantity": 1 }
      ],
      "reason": "Producto defectuoso"
    }
    ```
-   **Backend Logic**:
    -   **Atomic Transaction**: This must be an atomic operation.
    -   Increase the `stock` for each product being returned.
    -   Update the order status to `partially_returned` or `fully_returned`.
-   **Success Response (200 OK)**: The updated `Order` object.

---

## 6. Module: Laboratory Orders (`/api/lab-orders`)

-   **Description**: Endpoints to manage lab orders for lenses and other jobs.
-   **Authorization**: `Admin`, `Optómetra`.

### `GET /api/lab-orders`

-   **Description**: Get all lab orders for the clinic.
-   **Success Response (200 OK)**: An array of `LabOrder` objects from `src/types/lab-order.ts`.

### `POST /api/lab-orders`

-   **Description**: Create a new lab order.
-   **Request Body**: A `LabOrderFormValues` object from `src/types/lab-order-schema.ts`.
-   **Success Response (201 Created)**: The newly created `LabOrder` object.

### `PUT /api/lab-orders/{id}/status`

-   **Description**: Update the status of a lab order.
-   **Request Body**: `{ "status": "Enviada" | "Recibida" | "Cancelada" }`
-   **Success Response (200 OK)**: The updated `LabOrder` object.

---

## 7. Module: Expenses (`/api/expenses`)

-   **Description**: Endpoints for managing clinic expenses.
-   **Authorization**: `Admin`. **Requires Premium plan.**

### `GET /api/expenses`

-   **Description**: Get all expenses for the clinic for a given period.
-   **Success Response (200 OK)**: An array of `Expense` objects.

### `POST /api/expenses`

-   **Description**: Create a new expense.
-   **Request Body**: An `ExpenseFormValues` object from `src/types/expense-schema.ts`.
-   **Success Response (201 Created)**: The newly created `Expense` object.

---

## 8. Module: Agreements (`/api/agreements`)

-   **Description**: Manage agreements with companies for discounts.
-   **Authorization**: `Admin`. **Requires Premium plan.**

### `GET /api/agreements`

-   **Description**: Get all agreements for the clinic.
-   **Success Response (200 OK)**: An array of `Agreement` objects.

### `POST /api/agreements`

-   **Description**: Create a new agreement.
-   **Request Body**: An `AgreementFormValues` object.
-   **Success Response (201ated)**: The newly created `Agreement` object.


---

## 9. Module: Budgets (`/api/budgets`) (Plan Premium)

-   **Description**: Endpoints to manage monthly expense budgets.
-   **Authorization**: `Admin`. **Requires Premium plan.**

### `GET /api/budgets`

-   **Description**: Get the budget for a specific month and year.
-   **Query Parameters**:
    -   `year` (number, required): The year of the budget (e.g., 2024).
    -   `month` (number, required): The month of the budget (1-12).
-   **Success Response (200 OK)**:
    ```json
    // Example response if budget exists
    {
      "Alquiler": 500000,
      "Marketing": 100000,
      "Salarios": 1200000
    }
    // Example response if no budget is set for the period
    {}
    ```

### `POST /api/budgets`

-   **Description**: Create or update the budget for a specific month and year.
-   **Request Body**:
    ```json
    {
      "year": 2024,
      "month": 8,
      "budgetData": {
        "Alquiler": 550000,
        "Marketing": 95000
      }
    }
    ```
-   **Success Response (200 OK)**:
    ```json
    { "message": "Presupuesto para Agosto 2024 guardado exitosamente." }
    ```

---

## 10. Module: Subscriptions (PayPal)

### `POST /api/webhooks/paypal`
- **Description**: Listens for PayPal webhook notifications (e.g., `CHECKOUT.ORDER.APPROVED`) to automatically update a clinic's subscription status after a successful payment.
- **Authorization**: Public, but must be secured by verifying the webhook signature.
- **Backend Logic**:
    1.  Verify the authenticity of the incoming webhook from PayPal.
    2.  Parse the event payload to identify the transaction and associated clinic (e.g., via a `custom_id`).
    3.  **[CRITICAL]** Update the clinic's record in the database: set `status` to `active`, update the `plan`, and calculate the `nextBillingDate`.
    4.  Log the transaction for auditing.
    5.  Return a `200 OK` response to PayPal to acknowledge receipt.

---

## 11. Module: SuperAdmin (`/api/superadmin`)

All endpoints in this section require `SuperAdmin` role authentication.

### `GET /api/superadmin/system-health`

- **Description**: Retrieves real-time system health metrics.
- **Authorization**: `SuperAdmin`.
- **Backend Logic**:
    1.  This endpoint must query the underlying monitoring services (e.g., Google Cloud Monitoring API, Firebase Performance API).
    2.  It should aggregate key metrics like CPU usage, memory, API latency, and error rates.
    3.  It then formats and returns these metrics as a JSON object.
- **Success Response (200 OK)**:
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

### `POST /api/superadmin/clinics/{clinicId}/subscription`

- **Description**: Manually updates a clinic's subscription status. This is crucial for handling offline payments like bank transfers or SINPE Móvil.
- **Authorization**: `SuperAdmin`.
- **Path Parameters**: `clinicId` (string) - The ID of the clinic to modify.
- **Backend Logic**:
    1.  Verify the requester has the `SuperAdmin` role.
    2.  Find the clinic in the database using `clinicId`.
    3.  Update the clinic's subscription fields (`plan`, `status`, `nextBillingDate`, `trialEndDate`, etc.) based on the request body.
    4.  Log this manual action for auditing purposes, including which SuperAdmin performed the action.
- **Request Body (Example for activation)**:
    ```json
    {
      "action": "activate",
      "plan": "Pro",
      "newBillingDate": "2025-08-15T00:00:00Z"
    }
    ```
- **Request Body (Example for suspension)**:
     ```json
    {
      "action": "suspend",
      "reason": "Falta de pago de transferencia bancaria."
    }
    ```
- **Success Response (200 OK)**: The updated clinic tenant object.
- **Error Responses**:
    -   `404 Not Found`: Clinic not found.
    -   `400 Bad Request`: Invalid action or data provided.
