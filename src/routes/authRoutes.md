# src/routes/authRoutes.ts

## Responsibilities:
- Defines the API endpoints for user authentication (registration and login).
- Maps incoming HTTP requests to the appropriate `authController` functions.
- Applies request validation middleware to ensure input data integrity.

## Endpoints:
- `POST /api/auth/register`: 
    - Handles broker account creation.
    - Validates name, email, and password.
- `POST /api/auth/login`: 
    - Authenticates a broker.
    - Validates email and password format.
    - Returns a JWT on success.
