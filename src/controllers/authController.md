# src/controllers/authController.ts

## Responsibilities:
- Manages user authentication and verification workflows.
- Handles broker registration with multi-field profiles.
- Provides a flexible API for requesting verification OTPs for email and phone.
- Issues JWT tokens for authenticated sessions.

## Methods:
- `register`: 
    - Creates a new broker account with profile details.
    - Does NOT automatically send OTPs to avoid cluttering inboxes during simple signups.
- `login`: 
    - Authenticates users and returns a JWT along with their verification status.
- `requestOTP`: 
    - Generic endpoint for sending a 6-digit verification code.
    - Accepts `type` ('email' or 'phone').
    - Saves the generated OTP to the database and sends it via the appropriate service.
- `verifyEmail`: 
    - Validates the 6-digit OTP sent to the user's email.
- `verifyPhone`: 
    - Validates the 6-digit OTP sent to the user's phone via SMS.
