# src/controllers/authController.ts

## Responsibilities:
- Manages user authentication and verification workflows.
- Handles broker registration with multi-field profiles.
- Provides a flexible API for requesting verification OTPs for email and phone.
- Issues JWT tokens for authenticated sessions.

## Methods:
- `register`: 
    - Creates a new broker account with profile details.
    - Returns a JWT along with the initial verification status (`false` for both email and phone).
- `login`: 
    - Authenticates users and returns a JWT along with their verification status (`emailVerified`, `phoneVerified`).
- `requestOTP`: 
    - Generic endpoint for sending a 6-digit verification code via email or phone.
    - Accepts `type` ('email' or 'phone').
    - Saves the generated OTP to the database and sends it via `emailService` or `smsService`.
- `verifyEmail`: 
    - Validates the 6-digit OTP and updates the user's `emailVerified` status to `true`.
- `verifyPhone`: 
    - Validates the 6-digit OTP and updates the user's `phoneVerified` status to `true`.
