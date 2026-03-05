# SecondBrain: Service Cost & Usage Review

This document provides a breakdown of the estimated operational costs for the services used in the SecondBrain project.

## 0. Centralized Infrastructure (Fixed & Tiered)

The system runs on a centralized infrastructure. While the VM is fixed, the Database and Storage scale in tiers as usage grows.

| Component    | Specification             | Cost (Monthly) | Notes                                   |
| :----------- | :------------------------ | :------------- | :-------------------------------------- |
| **Cloud VM** | 2 vCPUs, 4 GiB RAM        | **₹3,546.76**  | Centralized server for all users.       |
| **Storage**  | 100 GB Managed Disk / S3  | **₹415 ($5)**  | Capable of ~100,000 mins (\~1,600 hrs). |
| **Database** | MongoDB Atlas / Cosmos DB | **Variable**   | See Tiers below.                        |

### Database Pricing Tiers (MongoDB Atlas)

| Tier              | Monthly Cost (Approx) | Suitable For                         |
| :---------------- | :-------------------- | :----------------------------------- |
| **Free/Learning** | ₹0                    | Testing / Prototype (<512MB storage) |
| **Development**   | **₹664 ($8)**         | Small teams / Beta (~50 Users)       |
| **Small Prod**    | **₹4,731 ($57)**      | ~100-500 Users                       |
| **Medium Prod**   | **₹14,940 ($180)**    | ~500-2,000 Users                     |
| **Enterprise**    | **₹58,100 ($700)**    | 5,000+ Users / Large Scale           |

---

## 1. Speech-to-Text (STT) - Variable

| Provider      | Model                   | Cost (INR/hr) | Cost (USD/hr) |
| :------------ | :---------------------- | :------------ | :------------ |
| **Sarvam AI** | Saaras V3 (Diarization) | **₹45**       | ~$0.54        |
| **Deepgram**  | Nova-2                  | ~₹29          | **$0.348**    |

- **Smart Routing:** English meetings route to Deepgram (~35% savings). Weighted avg: **₹37/hr**.

---

## 2. AI Intelligence (Azure OpenAI)

| Model           | Input (per 1k tokens) | Output (per 1k tokens) |
| :-------------- | :-------------------- | :--------------------- |
| **GPT-4o mini** | ₹0.01                 | ₹0.05                  |

- **Intelligence Cost:** Less than **₹0.50 per 30m meeting** (Highly optimized).

---

## 3. Storage Economics (1MB per 1 Minute)

Assuming a standard audio compression (e.g., MP3/AAC):

- **1 Minute Recording** = ~1 MB
- **30 Minute Meeting** = ~30 MB
- **100 GB ($5/mo)** = ~102,400 MB = **\~3,413 meetings** of 30 mins each.
- **Cost contribution:** ~₹0.12 per meeting.

---

## 4. Unit Economics: Cost per 30m Recording

| Component               | Provider           | Estimated Cost |
| :---------------------- | :----------------- | :------------- |
| Transcription (30m)     | Weighted Avg (Mix) | ₹18.50         |
| AI Analysis             | GPT-4o mini        | ₹0.50          |
| Storage (30MB)          | Managed Disk       | ₹0.12          |
| **Total per Recording** |                    | **₹19.12**     |

---

## 5. Scaling Scenarios (Cost per User & Growth)

This table breaks down the **Centralized Infrastructure** into individual components (VM, DB, Disk) alongside API costs.

| Scenario                   | Monthly Vol | VM     | DB      | Disk   | API (Var) | **Total**    | **Cost/User** | **Cost/Rec** |
| :------------------------- | :---------- | :----- | :------ | :----- | :-------- | :----------- | :------------ | :----------- |
| **Free / Prototype**       | 5 Recs      | ₹3,547 | **₹0**  | **₹0** | ₹95       | **₹3,642**   | ₹1,821        | ₹728.40      |
| **Small (10 Users)**       | 150 Recs    | ₹3,547 | ₹664    | ₹415   | ₹2,850    | **₹7,476**   | ₹747          | ₹49.84       |
| **Growth (50 Users)**      | 750 Recs    | ₹3,547 | ₹4,731  | ₹415   | ₹14,250   | **₹22,943**  | ₹459          | ₹30.59       |
| **Mid-Market (200 Users)** | 2,500 Recs  | ₹3,547 | ₹14,940 | ₹415   | ₹47,500   | **₹66,402**  | ₹332          | ₹26.56       |
| **Enterprise (1k Users)**  | 15k Recs    | ₹3,547 | ₹58,100 | ₹1,875 | ₹285k     | **₹348,522** | ₹348          | ₹23.23       |

### 🛑 Free Tier Limits

- **DB Free Tier (M0):** Max **512MB** storage. Suitable for ~2,000 meeting _records_ (excluding audio).
- **Disk Free Tier:** Most providers offer ~1GB to 5GB free. At 1MB/min, this lasts for **\~30 to 150 meetings** before requiring the $5/100GB upgrade.

---

## 6. Scaling Strategy & Best Practices

1.  **Centralized Efficiency:** The VM cost is fixed. At 1,000 users, the VM cost per user is only ₹3.50. Focus on scaling the **Database** and **API efficiency**.
2.  **Storage Pruning:** At 1,000 users making 15,000 recordings, you use 450GB/month. Implement a **30-day retention policy** or move files to **Azure Blob Cold Tier / AWS Glacier** to keep the primary storage cost low.
3.  **Database Indexing:** As you scale to 15,000+ recordings, ensure MongoDB indexes are optimized for `projectId` and `userId` to avoid high RU (Request Unit) consumption.
4.  **Concurrency Management:** 1,000 users might trigger simultaneous transcription requests. Implement a **Queue System (Redis/BullMQ)** to level out API spikes.

---

## 7. Cost Optimization Summary

- **Smart Language Routing:** Saves ~35% on STT by identifying English vs Indian languages using random 512KB sampling.
- **GPT-4o mini:** Reduces intelligence layer cost by 90%+ compared to GPT-4o.
- **Local Caching:** Avoids redundant STT/AI calls for the same file.
