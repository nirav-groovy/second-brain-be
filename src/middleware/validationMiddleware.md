# src/middleware/validationMiddleware.ts

## Responsibilities:
- Intercepts validation results from `express-validator`.
- If validation errors are present, returns a 400 response with a structured error array.
- If validation passes, calls `next()` to proceed to the controller.

## Logic:
- Uses `validationResult(req)` to extract errors.
- Returns `res.status(400).json({ errors: errors.array() })` on failure.
