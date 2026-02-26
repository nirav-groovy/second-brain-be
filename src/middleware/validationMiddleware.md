# src/middleware/validationMiddleware.ts

## Responsibilities:
- Centralizes the handling of request validation results using `express-validator`.
- Ensures that API requests meet defined schema requirements before reaching controllers.

## Logic:
- Uses `validationResult(req)` to check for errors collected by validation rules in routes.
- If errors exist, it halts the request and returns a `400 Bad Request` with a structured list of validation failures.
- If no errors are found, it passes control to the next middleware or controller.
