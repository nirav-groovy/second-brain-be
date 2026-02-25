# AI Meeting Memory + Deal Intelligence - TODO

## 1. Project Initialization
- [x] npm init & install dependencies
- [x] tsconfig.json setup (CommonJS + Path Aliases)
- [x] Folder structure creation
- [x] Basic Express server setup (src/app.ts)

## 2. Authentication & User Management
- [x] User Model (Broker)
- [x] Register/Login APIs
- [x] Auth Middleware (JWT)
- [x] Centralized Auth Validation (src/middleware/validations/authValidation.ts)

## 3. Meeting Processing (Core Logic)
- [x] Meeting/Deal Model
- [x] File upload implementation with Multer
- [x] Recording processing endpoint
- [x] Speech-to-Text Integration Stub
- [x] AI Extraction Service Stub
- [x] Centralized Meeting Validation (src/middleware/validations/meetingValidation.ts)
- [x] **Validation for recording file (Required)**

## 4. Deal Intelligence API
- [x] Get Client Cards (List/Summary)
- [x] Get Specific Deal Detail
- [~] Search/Filter clients (Removed per user request)

## 5. Documentation
- [x] Swagger Documentation implementation
- [x] .md files for each core file/component

## 6. Advanced Features (Post-MVP)
- [ ] Auto Follow-up reminders
- [ ] Objection Detection
- [ ] Builder Comparison
