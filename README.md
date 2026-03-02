# Real Estate AI Meeting Intelligence

An AI-driven platform for real estate brokers to capture, transcribe, and analyze meetings. The system automatically extracts deal intelligence (buyer/seller intent, budget, requirements) from recordings and helps manage a client pipeline through project-based organization.

---

## 🚀 Key Features

- **Multilingual STT:** High-accuracy transcription supporting English, Hindi, and Gujarati via Sarvam AI and Deepgram.
- **AI Deal Intelligence:** Powered by Azure OpenAI (GPT-4o) to extract lead type, budget, urgency, and specific property requirements.
- **Project Management:** Organize meetings into projects for better client and deal tracking.
- **Automated CRM:** Automatically indexes client names, deal probability scores, and strategic broker insights.
- **Smart Scheduling:** Detects follow-up dates in conversations and integrates with calendar services.
- **Secure Auth:** JWT-based authentication with role-based access control (Admin/User).

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

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your_jwt_secret

# Database
MONGO_URI=mongodb://localhost:27017/secondbrain

# AI Services - Azure OpenAI
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# AI Services - STT
SARVAM_API_KEY=your_sarvam_key
DEEPGRAM_API_KEY=your_deepgram_key

# Email & SMS (OTP)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_user
EMAIL_PASS=your_pass
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run initialization:**
   The first run automatically seeds the database with a demo admin (`admin@secondbrain.com` / `Admin@123`).

3. **Start the server:**

   ```bash
   npm start
   ```

4. **Access API Docs:**
   Visit `http://localhost:5000/api-docs` for Swagger documentation.

---

## 🧪 Testing

```bash
npm test
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
