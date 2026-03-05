# SecondBrain: Service Cost & Usage Review

This document provides a breakdown of the estimated operational costs for the services used in the SecondBrain project.

## 1. Speech-to-Text (STT)

We use **Sarvam AI** as the primary provider for Indian language support and **Deepgram** as a high-performance fallback.

| Provider      | Model                   | Cost (INR/hr) | Cost (USD/hr) | Free Tier / Trial            |
| :------------ | :---------------------- | :------------ | :------------ | :--------------------------- |
| **Sarvam AI** | Saaras V3 (Diarization) | **₹45**       | ~$0.54        | ₹1,000 Free Credits          |
| **Deepgram**  | Nova-2                  | ~₹29          | **$0.348**    | $200 Free Credits (~575 hrs) |

- **Sarvam AI** is preferred for multilingual/code-mixed (Hinglish, etc.) conversations.
- **Deepgram** is used as a fallback or for pure English meetings due to its high efficiency and generous free tier.

---

## 2. AI Intelligence & Analysis (LLM)

We use **Azure OpenAI** for extracting deal intelligence and identifying speakers/roles.

| Model           | Input (per 1k tokens) | Output (per 1k tokens) | Notes                                           |
| :-------------- | :-------------------- | :--------------------- | :---------------------------------------------- |
| **GPT-4o**      | $0.0025 (~₹0.21)      | $0.0100 (~₹0.83)       | High reasoning, used for complex analysis.      |
| **GPT-4o mini** | $0.00015 (~₹0.01)     | $0.0006 (~₹0.05)       | 15x cheaper; recommended for simple extraction. |

- **Caching:** Azure offers a **50% discount** on input tokens for repetitive prompts.
- **Batching:** Non-urgent tasks can use the Batch API for a **50% discount**.

---

## 3. SMS Services (OTP)

We use **Twilio** for phone number verification via OTP.

| Region    | Cost per SMS (Segment) | Carrier Fees       | Monthly Number Rent |
| :-------- | :--------------------- | :----------------- | :------------------ |
| **India** | ~$0.002 (₹0.17)        | N/A (DLT required) | N/A                 |
| **USA**   | ~$0.0079 (₹0.65)       | $0.002 - $0.005    | $1.15 - $2.15       |

- **Note:** Sending SMS to India requires mandatory DLT (Distributed Ledger Technology) registration per TRAI regulations.

---

## 4. Email Services (OTP & Notifications)

We use **Mailtrap** for transactional emails (OTPs).

| Plan              | Monthly Limit          | Daily Limit | Cost      |
| :---------------- | :--------------------- | :---------- | :-------- |
| **Free Sandbox**  | 500 emails (Test only) | N/A         | **Free**  |
| **Free API/SMTP** | 4,000 emails           | 150 emails  | **Free**  |
| **Individual**    | 10,000 emails          | Unlimited   | $10/month |

- Current implementation uses the Free tier, which is sufficient for up to 150 OTPs per day.

---

## 5. Estimated Cost per Meeting

Assuming a **30-minute meeting** with a 5,000-word transcript (~7,000 tokens):

| Task                 | Provider     | Estimated Cost      |
| :------------------- | :----------- | :------------------ |
| Transcription (30m)  | Sarvam AI    | ₹22.50 ($0.27)      |
| AI Analysis (GPT-4o) | Azure OpenAI | ~$0.08 (₹6.60)      |
| Total per Meeting    |              | **~₹29.10 ($0.35)** |

_Using GPT-4o mini would reduce the AI cost to less than ₹0.50 per meeting._

---

## 6. Projected Bill for Example Scenarios

Based on the **Smart Language Routing** architecture (random sampling for accurate Deepgram vs Sarvam routing), here is the estimated bill assuming a 50/50 mix of English and Indian languages (Weighted avg STT cost: ~₹37/hr).

| Scenario                          | Total Audio              | STT Cost (Mix) | AI Cost (GPT-4o) | Total (INR)   | Total (USD) |
| :-------------------------------- | :----------------------- | :------------- | :--------------- | :------------ | :---------- |
| **10 recordings** (~5 min each)   | 50 min                   | ₹30.80         | ~₹6.25           | **₹37.05**    | $0.45       |
| **20 recordings** (~10 min each)  | 200 min                  | ₹123.30        | ~₹16.70          | **₹140.00**   | $1.70       |
| **50 recordings** (~30+ min each) | 1,500 min                | ₹925.00        | ~₹83.75          | **₹1,008.75** | $12.15      |
| **GRAND TOTAL**                   | **1,750 min (29.2 hrs)** | **₹1,079.10**  | **₹106.70**      | **₹1,185.80** | **$14.30**  |

## 7. Projected Monthly Operational Costs (Client View)

This table outlines the estimated monthly API consumption assuming a balanced mix of English and Non-English meetings. The **Smart Language Routing** logic ensures we hit these optimized targets by accurately identifying when to use Deepgram (~35% cheaper).

| Scenario                        | Monthly Volume | Total Audio Hours | Est. STT Cost (Mix) | Est. AI Cost (GPT-4o) | **Total Monthly Cost** |
| :------------------------------ | :------------- | :---------------- | :------------------ | :-------------------- | :--------------------- |
| **Individual Pro**              | 20 Meetings    | 10 Hours          | ₹370                | ₹132                  | **₹502 (~$6)**         |
| **Small Sales Team (10 Users)** | 150 Meetings   | 75 Hours          | ₹2,775              | ₹990                  | **₹3,765 (~$45)**      |
| **Mid-Market Dept (50 Users)**  | 750 Meetings   | 375 Hours         | ₹13,875             | ₹4,950                | **₹18,825 (~$226)**    |
| **Enterprise Scale**            | 2,500 Meetings | 1,250 Hours       | ₹46,250             | ₹16,500               | **₹62,750 (~$756)**    |

### 🚀 Optimization: The "GPT-4o mini" + "Deepgram Routing" Impact

By combining **GPT-4o mini** with our **Smart Routing** logic, the "Enterprise" tier cost is reduced by over 30% compared to a Sarvam-only/GPT-4o stack:

- **AI Cost (GPT-4o mini):** ~₹1,250
- **STT Cost (Smart Routing):** ₹46,250
- **New Optimized Enterprise Total:** **₹47,500 (~$572)** (Old: ₹72,750 - **34% total savings**)

---

## Cost Optimization

1.  **Switched to GPT-4o mini:** For standard meeting summaries and speaker ID, GPT-4o mini is significantly cheaper with comparable results for this use case.
2.  **Smart Language Routing:** We use a randomized sampling technique (preserving the 8KB header + a random 504KB chunk) with Deepgram's detection engine. This avoids bias from initial greetings (often in English) and ensures we accurately route English-primary meetings to Deepgram for a **~35% cost saving** compared to Sarvam AI.
3.  **Minimal Detection Overhead:** By using only a 512KB sample for language detection instead of transcribing the whole file, we keep the routing cost near zero ($<0.005) while maximizing the savings on the full transcription.
4.  **Local Caching:** Ensure transcripts and AI responses are cached in the database (already implemented) to avoid redundant API calls.
