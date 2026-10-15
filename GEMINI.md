# SubAdminECommerce Multi-Tenancy Architecture & Coding Rules

Always follow these rules automatically across all conversations in this project:

## 1. Project Context & Subdomain Wildcard Resolution
- **Project Path**: `E:\SubAdminECommerce`
- **Subdomain Schema Resolution**:
  - Every API request identifies the tenant via `subdomain` (from `req.headers["x-subdomain"]` or the prefix before the main domain in `req.hostname`, e.g. `ahmed.wego.com` -> `subdomain = ahmed`).
  - The subdomain MUST be verified against the central database `users` table (`src/models/central/users.ts` -> `subdomain`).
  - If the subdomain does NOT exist in `users`, return an error: **"Subdomain not found"** (404/400).
  - If it exists, all database actions MUST be executed against the wildcard schema corresponding to that `subdomain` (attached to `req.db`).

## 2. Multilingual JSON Handling (`name`, `description`, etc.)
- All JSON fields representing text (`name`, `description`, etc.) support multiple languages.
- Active languages are determined by the `lang` table (`SELECT * FROM lang WHERE status = true`).
- **On Add / Create & Edit / Update**:
  - The client provides translations as a JSON object, e.g. `{"ar": "...", "en": "..."}`.
  - The **first language is REQUIRED**; remaining languages are optional.
  - All languages are included in the Zod validation schema so they are clearly documented in Swagger.
  - If `description` is nullable, the entire `description` key is optional (nullable).
- **On Fetch / Get (Single or All)**:
  - The client passes query param `?lang=...` (or header).
  - The API returns the text for the requested language. If the value does not exist in that language, it MUST fall back to the first language.
- **Relational Lists Endpoint (`GET /{item}/lists`) (MANDATORY across all modules with relations)**:
  - Whenever a table has columns referencing other tables (Foreign Key relations needed at create/edit):
    - Create a dedicated `GET /lists` endpoint on that element router (e.g. `GET /products/lists`, `GET /addresses/lists`, `GET /staff/lists`, `GET /zones/lists`).
    - It must fetch and return all the tables related to this element at once as `{ [relatedTableName]: [{ id, name }] }`.
    - Every related item MUST have `{ id, name }`, where `name` is localized according to `?lang=...` (falling back to the first available language if missing).
    - Example for products (`GET /products/lists`):
      returns `{ categories: [{ id, name }], brands: [{ id, name }], discounts: [{ id, name }], flash_discounts: [{ id, name }], taxes: [{ id, name }], warranties: [{ id, name }] }`.

## 3. Address Coordinates & Google Maps Link
- In the `address` model, whenever `lat` and `lng` are present, automatically compute and return:
  `map_url: "https://www.google.com/maps/search/?api=1&query=${lat},${lng}"`

## 4. CRUD & Folder Conventions (`controllers`, `validators`, `routes`)
- **Validators**: Place Zod schemas in `src/validators/sub_admin/{element}.ts`.
- **Controllers**: Place CRUD controllers in `src/controllers/sub_admin/{element}.ts`.
- **Routes**: Place route definitions in `src/routes/sub_admin/{item}.ts` and mount them in `src/routes/sub_admin/index.ts`.
- **Route Middleware Pattern**: Always attach permission middleware, validation middleware, and `catchAsync` directly on the route:
  ```ts
  router.get("/", checkPermission(), catchAsync(getAllItems));
  router.post("/", checkPermission(), validate(createItemSchema), catchAsync(createItem));
  ```
- **Automatic Swagger from Zod**: `src/config/swagger.ts` automatically scans routes and reads Zod schemas from `validate(schema)` to produce OpenAPI specs.

## 5. Image Handling Rules (NO Base64 - Use Multipart/Form-Data or Direct URLs)
- **STRICT PROHIBITION**: Base64 image uploading is strictly forbidden across all modules due to performance and payload overhead.
- **Upload Mechanism**: All images are uploaded via `multipart/form-data` using Multer (`src/middlewares/upload.ts`) or supplied as pre-uploaded URL strings.
- **Multer Middlewares**:
  - `uploadSingleImage("fieldName")` for single image fields (e.g. `logo`, `image`, `icon`).
  - `uploadMultipleImages("fieldName", maxCount)` for array fields (e.g. `gallery`, `image`).
  - `uploadFieldsImages([...])` for multiple named file fields.
  - Form text fields (including multilingual JSON objects) in `multipart/form-data` are automatically parsed by `parseFormDataJson`.
- **Dedicated Upload Endpoints**:
  - `POST /upload`: upload single image -> returns `{ url, filename }`.
  - `POST /upload/multiple`: upload multiple images -> returns `{ urls, count }`.
- **Storage & Static Serving**: Saved into `uploads/` with UUID filenames, served statically via `/uploads`.
- **CRUD Operations**:
  1. **On Create / Add**: Image processed via Multer form-data middleware or accepted as URL; stored in DB as full URL.
  2. **On Update / Edit**: `updateImage(req, newFileOrUrl, "uploads", oldImageUrl)` deletes old physical image if changed.
  3. **On Delete / Remove**: `deleteImage(oldImageUrl)` physically deletes file from `uploads/` BEFORE deleting the database record.

## 6. Tenant Schema Models (`src/models/tenant/`)
Each table in a separate file in `E:\SubAdminECommerce\src\models\tenant/`:
`customers.ts`, `categories.ts`, `brands.ts`, `discounts.ts`, `flashDiscounts.ts`, `popups.ts`, `warranties.ts`, `taxes.ts`, `roles.ts`, `permissions.ts`, `staff.ts`, `paymentMethods.ts`, `products.ts`, `attributes.ts`, `values.ts`, `productAttributes.ts`, `productValues.ts`, `cities.ts`, `zones.ts`, `addresses.ts`, `languages.ts`, `admins.ts`.
Re-exported in `src/models/tenant/index.ts` and `src/models/schema.ts`.

## 7. Multi-Tenant Schema Synchronization & Migration Rules
- **Canonical Table Definitions (`TENANT_TABLE_DEFINITIONS`)**:
  - Located in `src/services/tenantSchemaService.ts` in both projects.
  - Acts as the single source of truth for all 22 tenant tables.
  - Whenever any model, table, or column in `E:\SubAdminECommerce\src\models\tenant/` is added, modified, or removed:
    1. ALWAYS update `TENANT_TABLE_DEFINITIONS` in `src/services/tenantSchemaService.ts` in both projects.
    2. This guarantees that **new tenant schemas** created via `createTenantSchema(subdomain)` immediately receive the latest structure.
- **Migrating Existing Tenants (`npm run db:migrate:tenants`)**:
  - Whenever tenant models are updated, execute `npm run db:migrate:tenants`.
  - It inspects `INFORMATION_SCHEMA` across all registered tenants from central `users`:
    - Automatically creates any missing tables.
    - Automatically adds any missing columns via `ALTER TABLE ... ADD COLUMN ...`.
    - Preserves live user data without drop or data loss.
    - Seeds default initial data (languages `ar`, `en` and role `admin`) if missing.

## 8. Pagination Rules for All Fetch (`getAll`) Endpoints (MANDATORY across all modules)
- Every `getAll` endpoint (e.g. `getAllProducts`, `getAllCategories`, `getAllAttributes`, etc.) MUST support pagination.
- Query parameters:
  - `page`: default `1`
  - `limit`: default `10`
  - `offset`: `(page - 1) * limit`
- Response structure MUST include a `pagination` object:
  ```json
  {
    "[element]": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
  ```
- Helper functions available in `src/utils/pagination.ts`: `getPaginationParams(req)` and `buildPaginationMeta(total, page, limit)`.
- Dropdown endpoints (`/select`, `/{element}/lists`) remain unpaginated to supply all available options for relational forms.

