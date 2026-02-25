# src/app.ts

## Responsibilities:
- Main Express server entry point.
- Middlewares initialization (CORS, JSON parsing).
- MongoDB connection setup.
- Route registration.
- Server listening on configured PORT.

## Configuration:
- Uses `dotenv` for environment variables.
- Uses `express.json()` for parsing request bodies.
- Uses `cors` for cross-origin requests.
