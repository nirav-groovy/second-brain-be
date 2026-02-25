# src/controller/authController.ts

## Responsibilities:
- Handle user registration requests.
- Handle user login requests.
- Password hashing and verification.
- JWT token generation.

## Methods:
- `register`: Validates if user exists, hashes password, saves new user.
- `login`: Validates credentials, compares hashed password, returns JWT and user info.
