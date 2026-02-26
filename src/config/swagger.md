# src/config/swagger.ts

## Responsibilities:
- Configures the OpenAPI (Swagger) specification for the API.
- Defines metadata such as title, version, and description.
- Sets up security definitions, including Bearer Authentication (JWT).
- Specifies the file paths for scanning JSDoc comments to generate documentation.

## Details:
- Uses `swagger-jsdoc` to generate the specification.
- Defines the development server URL.
- Enables global security for all documented endpoints using JWT.
- Exports `specs` which is consumed by `swagger-ui-express` in `app.ts`.
