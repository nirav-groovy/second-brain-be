# src/middleware/authMiddleware.ts

## Responsibilities:
- Verify JWT tokens in request headers.
- Protect routes from unauthorized access.
- Attach decoded user information to the `req` object.

## Logic:
- Extracts token from `Authorization` header.
- Decodes it using `JWT_SECRET`.
- If valid, proceeds to the next middleware or route handler.
- If invalid or missing, returns a 401 Unauthorized response.
