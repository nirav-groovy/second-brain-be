# AI Meeting Memory - API Test Cases

This document outlines the test cases for each API endpoint in the system. Use these for manual testing (Postman/Insomnia) or as a basis for automated integration tests.

---

## 🔐 1. Authentication APIs (`/api/auth`)

### 1.1 Register a New Broker
- **Endpoint:** `POST /api/auth/register`
- **Request Body (JSON):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "password": "Password123",
  "companyName": "Skyline Realty",
  "licenseNumber": "RE-998877"
}
```
- **Success Criteria (201 Created):**
  - Returns message "User registered successfully".
- **Error Cases (400 Bad Request):**
  - Missing required fields.
  - Email already exists.

### 1.2 Login
- **Endpoint:** `POST /api/auth/login`
- **Request Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```
- **Success Criteria (200 OK):**
  - Returns `token` (JWT) and `user` data object.

---

## 🎙️ 2. Meeting APIs (`/api/meetings`)

### 2.1 Process a New Meeting (Real Audio)
- **Endpoint:** `POST /api/meetings`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data:**
  - `title`: "Client Site Visit - Apartment 4B"
  - `recording`: [Attach .mp3/.wav/.m4a file]
- **Success Criteria (201 Created):**
  - Returns initial meeting object with `status: "transcribe-generating"`.
- **Error Cases:**
  - `400`: Missing title or recording file.
  - `403`: Meeting limit reached (if user is unverified and already has 5 meetings).

### 2.2 List All Meetings
- **Endpoint:** `GET /api/meetings`
- **Headers:** `Authorization: Bearer <token>`
- **Success Criteria (200 OK):**
  - Returns an array of meeting objects.

### 2.3 Get Meeting Intelligence Detail
- **Endpoint:** `GET /api/meetings/get/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Success Criteria (200 OK):**
  - Returns full meeting details with transcript and AI intelligence.

---

## 📅 3. CRM & Dashboard APIs (`/api/meetings`)

### 3.1 Search & Filter
- **Endpoint:** `GET /api/meetings?search=Patel&type=Seller`
- **Success Criteria (200 OK):**
  - Returns filtered results for specific clients or property types.

### 3.2 CRM Statistics
- **Endpoint:** `GET /api/meetings/stats`
- **Success Criteria (200 OK):**
  - Returns aggregated data (total deals, average probability, lead counts).
