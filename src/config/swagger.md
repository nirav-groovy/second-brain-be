# src/config/swagger.ts

## Responsibilities:
- Configure OpenAPI (Swagger) specification for the project.
- Define API metadata (title, version, description).
- Set up security schemes (Bearer Authentication for JWT).
- Specify the source files for JSDoc documentation.

## Details:
- Uses `swagger-jsdoc` to parse JSDoc comments in route files.
- Exports `specs` for use with `swagger-ui-express`.
