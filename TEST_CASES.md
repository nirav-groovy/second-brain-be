# AI Meeting Memory - API Test Cases

This document outlines the test cases for each API endpoint in the system. Use these for manual testing (Postman/Insomnia) or as a basis for automated integration tests.

---

## 🔐 1. Authentication APIs (`/api/auth`)

### 1.1 Register a New User

- **Endpoint:** `POST /api/auth/register`
- **Request Body (JSON):**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "password": "Password123"
}
```

- **Success Criteria:** Returns status `201 Created`. User `status` is `active`.

### 1.2 Login

- **Endpoint:** `POST /api/auth/login`
- **Success Criteria:** Returns `token` (JWT) and `user` data (including `role` and `status`).

---

## 📁 2. Project APIs (`/api/projects`)

### 2.1 Create a Project

- **Endpoint:** `POST /api/projects`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**

```json
{
  "name": "New Property Launch",
  "description": "Meetings related to the downtown project"
}
```

- **Success Criteria:** 201 Created. Project saved with `ownerId`.

### 2.2 List Projects

- **Endpoint:** `GET /api/projects`
- **Success Criteria:** Returns an array of projects owned by the user.

---

## 🎙️ 3. Meeting APIs (`/api/meetings`)

### 3.1 Process a New Meeting

- **Endpoint:** `POST /api/meetings`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data:**
  - `title`: "Client Inquiry - 3BHK"
  - `projectId`: "valid_project_mongo_id" (Optional - if missing, "Unnamed Project" is used)
  - `recording`: [Attach .mp3/.wav/.m4a file]
- **Success Criteria:** 201 Created. Returns meeting object with `status: "TRANSCRIBE_GENERATING"`. If `projectId` was missing, the object will contain the ID of an automatically managed "Unnamed Project".

### 3.2 List All Meetings (with Filtering)

- **Endpoint:** `GET /api/meetings?projectId=<id>&type=Buyer`
- **Success Criteria:** Returns meetings filtered by the specified project and lead type.

---

## 📅 4. CRM & Dashboard APIs (`/api/meetings`)

### 4.1 CRM Statistics

- **Endpoint:** `GET /api/meetings/stats`
- **Success Criteria:** Returns aggregated data (total deals, average probability, lead distribution) for all `COMPLETED` meetings.

### 4.2 Search Intelligence

- **Endpoint:** `GET /api/meetings?search=Budget`
- **Success Criteria:** Returns meetings where search term appears in title, client name, or transcript.
