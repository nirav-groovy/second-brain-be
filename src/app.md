# src/app.ts

## Responsibilities:
- Main Express server entry point.
- Middlewares initialization (CORS, JSON parsing).
- Static file serving for `/uploads`.
- API Documentation setup using Swagger.
- MongoDB connection setup.
- Route registration (`/api/auth`, `/api/meetings`).
- Global error handling (Multer errors, custom errors, 500s).
- Server listening on configured PORT.

## Configuration:
- Uses `dotenv` for environment variables.
- Uses `express.json()` for parsing request bodies.
- Uses `cors()` for cross-origin requests.
- Uses `swagger-ui-express` for `/api-docs`.
- Uses `mongoose` for MongoDB connection.
