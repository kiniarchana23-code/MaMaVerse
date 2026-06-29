# MaMaVerse — AI Pregnancy & Parenthood Platform 🍼✨

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Responsible AI](https://img.shields.io/badge/AI-Responsible_Human_in_Loop-indigo.svg)](#admin-approval-workflow)
[![Google Cloud Run](https://img.shields.io/badge/Deployed-Google_Cloud_Run-blue.svg)](#cloud-deployment)
[![GCP Project ID](https://img.shields.io/badge/GCP_Project_ID-project--7e1f15c5--7bea--42ce--ad3-teal.svg)](#architecture)

> **"Your trusted AI companion from pregnancy to parenthood. Medically curated, admin-validated intelligence at your fingertips."**

---

## 📖 Vision & Problem Definition

During pregnancy and early motherhood, parents are bombarded with conflicting advice from search engines, blogs, and social video platforms. Sifting through this volume of information causes anxiety, takes up valuable time, and risks exposure to unverified, incorrect, or harmful advice. 

**MaMaVerse** solves this by establishing a **Human-in-the-Loop, medically-curated knowledge pipeline**:
1. **Source Sourcing**: Specialized AI agents ingest and summarize content *only* from verified, trusted domains (e.g., **WHO**, **ICMR**, **NHS**, **AAP**, **CDC**).
2. **Confidence & Risk Checks**: AI automatically grades accuracy, categorizes the subject, and flags potential risks or duplicates.
3. **Human Validation**: Admin review portal ensures nothing goes live without explicit human verification.
4. **Tailored Personalization**: Once published, the profile agents present month-by-month and week-by-week diet, tests, baby care, and wellness advice tailored to the mother's exact phase.

---

## 🏗️ Solution Architecture

```
                    ┌───────────────────┐
                    │  Next.js Frontend │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  FastAPI Backend  │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │ Firebase Auth│ │  Firestore DB│ │  Gemini API  │
     └──────────────┘ └──────────────┘ └──────────────┘
```

### Specialized Agents

- **Profile Agent**: Tailors data according to the exact pregnancy week or baby's age.
- **Pregnancy Knowledge Agent**: Provides fetal development, Indian-specific medical tests, and risk warnings.
- **New Mom Agent**: Guides postpartum recovery, breastfeeding, safe infant sleep, and milestone timelines.
- **Nutrition Agent**: Custom 7-day regional Indian diet plans (ICMR-NIN grounded).
- **Wellness Agent**: Safe breathing routines, emotional support, and direct access to Indian crisis helplines.
- **Healthcare Discovery Agent**: Geolocation/city name hospital search via Google Places API.
- **Admin Review Agent**: Fetches URLs, checks risks, prevents duplicates, and queues drafts for admin approval.

---

## 🔒 Security & Privacy Measures

Health data is sensitive. MaMaVerse incorporates several enterprise-grade security protocols:
- **Authentication**: Google OAuth combined with strict Firebase ID token verification. Zero-friction Guest Mode restricts access safely.
- **Data Protection**: Encryption-in-transit (HTTPS/TLS) and Encryption-at-rest (Firestore).
- **Role-based Access Control**: Custom claims via Firebase Auth (`role: admin`) protect the Admin Portal.
- **GDPR Compliance**: Direct data deletion options allow users to wipe their profiles completely.
- **AI Safety**: Input sanitization blocks prompt-injection attempts; safety filters block dangerous inputs.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion, Axios, Lucide Icons.
- **Backend**: Python FastAPI, Uvicorn, Pydantic, SlowAPI (rate limiter).
- **Database**: Cloud Firestore.
- **Authentication**: Firebase Auth (Google OAuth).
- **AI Engine**: Google Gemini API (`google-generativeai`).
- **APIs**: Google Places API.
- **Deployment**: Google Cloud Run, Google Secret Manager, Cloud Build.

---

## 🚀 Local Setup

### 1. Pre-requisites
- Node.js 18+ & Python 3.12
- A Google Cloud Platform (GCP) Account with Billing enabled.

### 2. Backend Config
Navigate to the `backend/` directory, create a `.env` file:
```env
ENV=development
GCP_PROJECT_ID=project-7e1f15c5-7bea-42ce-ad3
FIREBASE_PROJECT_ID=project-7e1f15c5-7bea-42ce-ad3
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_PLACES_API_KEY=your_places_api_key
```

Run Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Config
Navigate to the `frontend/` directory, create a `.env` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-7e1f15c5-7bea-42ce-ad3
```

Run Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Cloud Deployment

The project is fully structured for direct deployment to **Google Cloud Run** using Google Cloud Build:

```bash
# Submit build to container registry
gcloud builds submit --config infrastructure/cloudbuild.yaml

# Deploy backend container to Cloud Run
gcloud run deploy mamaverse-backend \
  --image gcr.io/project-7e1f15c5-7bea-42ce-ad3/backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
