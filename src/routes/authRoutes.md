# src/routes/authRoutes.ts

## Responsibilities:
- Defines the API endpoints for user authentication, registration, and multi-factor verification.
- Maps incoming HTTP requests to the appropriate `authController` functions.
- Applies request validation middleware to ensure input data integrity.

## Endpoints:
- `POST /api/auth/register`: 
    - Handles broker account creation.
    - Validates name, email, and password.
- `POST /api/auth/login`: 
    - Authenticates a broker.
    - Validates email and password format.
    - Returns a JWT and verification status on success.
- `POST /api/auth/request-otp`:
    - Requests a 6-digit verification code via email or phone.
    - Requires `bearerAuth`.
- `POST /api/auth/verify-email`:
    - Verifies the user's email using the provided OTP.
    - Requires `bearerAuth`.
- `POST /api/auth/verify-phone`:
    - Verifies the user's phone number using the provided OTP.
    - Requires `bearerAuth`.
