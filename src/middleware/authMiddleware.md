# src/middleware/authMiddleware.ts

## Responsibilities:
- Verifies the presence and validity of JSON Web Tokens (JWT) in request headers.
- Protects private routes by ensuring only authenticated users can access them.
- Attaches the decoded user payload to the `req.user` object for downstream use.

## Logic:
- Extracts the token from the `Authorization: Bearer <token>` header.
- Validates the token using the `JWT_SECRET` environment variable.
- Returns a `401 Unauthorized` response if the token is missing, malformed, or expired.
