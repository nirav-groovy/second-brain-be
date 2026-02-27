# AI Meeting Memory & Broker CRM

An AI-driven real estate CRM platform designed for brokers to capture meeting recordings, automatically transcribe them (supporting Hinglish/Gujarati), extract deal intelligence, and manage their client pipeline with advanced search and statistics.

---

## 🚀 Key Features

- **Multilingual STT:** Powered by **Sarvam AI** and **Deepgram**, supporting English, Hindi, Gujarati, and Hinglish.
- **AI Deal Intelligence:** Uses **Azure OpenAI (GPT-4o)** to extract lead type, budget, urgency, and specific property requirements.
- **Automated CRM:** Automatically indexes client names, deal probability scores, and strategic "Broker Takeaways".
- **Smart Scheduling:** Detects follow-up dates in conversation and automatically adds them to a calendar.
- **Secure Auth:** JWT-based authentication with dual-factor (Email/Phone) OTP verification.
- **Dashboard Stats:** High-level metrics for brokers to track their pipeline health.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, TypeScript, Express
- **Database:** MongoDB (Mongoose)
- **AI/ML:** Azure OpenAI, Sarvam AI, Deepgram
- **Testing:** Jest, Supertest, MongoDB Memory Server
- **CI/CD:** GitHub Actions

---

## 📋 Prerequisites

- Node.js (v20.x or higher)
- npm or yarn
- MongoDB (Local or Atlas)
- API Keys for Azure OpenAI, Sarvam AI, and Deepgram

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory and populate it with the following variables:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your_super_secret_jwt_key

# Database
MONGO_URI=mongodb://localhost:27017/secondbrain

# AI Services - Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# AI Services - STT
SARVAM_API_KEY=your_sarvam_key
DEEPGRAM_API_KEY=your_deepgram_key

# Email Service (Nodemailer)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_user
EMAIL_PASS=your_pass

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🚀 Getting Started

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd secondBrain
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the development server:**

   ```bash
   npm start
   ```

   The server will start at `http://localhost:5000`.

4. **Access API Documentation:**
   Open `http://localhost:5000/api-docs` in your browser to view the interactive Swagger documentation.

---

## 🧪 Running Tests

The project includes a comprehensive suite of 33+ automated tests covering Auth, Meetings, and CRM logic.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

---

## 📂 Project Structure

- `src/controllers`: Business logic for API endpoints.
- `src/models`: Mongoose schemas for User, Meeting, and Calendar.
- `src/services`: External integrations (AI, STT, Email, SMS).
- `src/routes`: API route definitions and Swagger docs.
- `src/__tests__`: Integration and security test cases.
- `.github/workflows`: CI/CD automation.

---

## 📄 License

This project is licensed under the ISC License.
