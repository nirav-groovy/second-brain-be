# src/models/User.ts

## Responsibilities:
- Defines the data structure for Users (Brokers) in MongoDB.
- Manages user profiles, authentication credentials, and verification statuses.

## Fields:
- `firstName`: User's first name.
- `lastName`: User's last name.
- `email`: Unique email address for login and communication.
- `phone`: Unique mobile number for SMS notifications and verification.
- `password`: Hashed password for secure authentication.
- `companyName`: (Optional) The real estate firm the broker is associated with.
- `licenseNumber`: (Optional) Professional license ID.
- `emailVerified`: Boolean indicating if the email has been verified via OTP.
- `phoneVerified`: Boolean indicating if the phone number has been verified via OTP.
- `emailOTP`: Current OTP sent to the user's email.
- `emailOTPExpires`: Expiration timestamp for the email OTP.
- `phoneOTP`: Current OTP sent to the user's phone via SMS.
- `phoneOTPExpires`: Expiration timestamp for the phone OTP.
- `createdAt`: Timestamp indicating when the user account was created.
