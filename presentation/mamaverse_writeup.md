# MaMaVerse: Responsible, Medically Curated AI Assistance for Pregnancy & Parenthood

### Deployed Architecture and Agentic Ecosystem for the "Agent for Good" Submission Track

---

## Executive Summary
**MaMaVerse** is a modern, responsive web application and backend platform engineered to serve as a secure, medically validated, and highly personalized companion for expecting and new mothers. Recognizing that maternal health information is highly sensitive, MaMaVerse addresses the critical danger of unverified or AI-hallucinated online advice through a **Human-in-the-Loop (HITL) review system** and specialized, topic-specific AI agents.

By combining Google Gemini 2.5 Flash/Pro models, Cloud Firestore, Firebase Authentication, and Next.js, MaMaVerse delivers real-time maternal guidance grounded strictly in verified guidelines (such as the **World Health Organization (WHO)**, **Indian Council of Medical Research (ICMR)**, and **American Academy of Pediatrics (AAP)**). This submission is entered in the **Agent for Good** track, demonstrating how advanced agentic architectures can be securely and responsibly leveraged to improve maternal wellness, reduce parental anxiety, and support early child development.

---

## 1. Problem Definition & Vision

### 1.1 The Maternal Information Crisis
For pregnant women and new mothers, the transition into parenthood is accompanied by a massive influx of physical, psychological, and dietary changes. Sifting through search engines, parenting blogs, and social video platforms leads to three severe issues:
1.  **Anxiety and Overwhelm**: Conflicting advice on minor symptoms (e.g., occasional cramping or feeding frequency) causes unnecessary stress and anxiety during a delicate biological period.
2.  **Unverified & Dangerous Advice**: Search algorithms prioritize engagement over medical validity, exposing mothers to unsafe home remedies, unscientific diets, or outdated sleep practices.
3.  **Lack of Personalization**: A mother at week 12 of pregnancy requires completely different nutritional, test, and wellness recommendations compared to a mother at week 36 or a new mom with a 3-month-old infant.

### 1.2 Vision: The "Agent for Good" Grounding
To solve this, MaMaVerse establishes a **Responsible AI Pipeline** that ensures zero unverified content reaches the user:
*   **Medical Sourcing**: AI ingestion is restricted to reputable domains (WHO, ICMR-NIN, NHS, AAP, CDC).
*   **Strict Admin Validation**: AI-generated article drafts must be reviewed, edited, and approved by a human administrator in the Admin Portal before they are published to the database.
*   **Phase-Specific Personalization**: Specialized agents adapt weekly and monthly summaries, custom vegetarian/vegan diet plans, and wellness guidelines to the exact week of pregnancy or child's age.

---

## 2. Solution Design & System Architecture

MaMaVerse is built on a clean, decoupled, containerized client-server architecture:

```
                            ┌───────────────────────────────────┐
                            │      Next.js Client Frontend      │
                            │       (Framer Motion / CSS)       │
                            └─────────────────┬─────────────────┘
                                              │
                                              │ Secure REST APIs (HTTPS)
                                              ▼
                            ┌───────────────────────────────────┐
                            │     FastAPI Server Container      │
                            │      (Pydantic / SlowAPI)         │
                            └─────────────────┬─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
        │ Firebase Auth Service │ │ Firestore DB Instance │ │ Google Gemini API     │
        │     (Google OAuth)    │ │   (Native Database)   │ │  (2.5 Flash / Pro)    │
        └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

### 2.1 Backend Pipeline (FastAPI)
The backend is written in Python using **FastAPI** for high performance and automatic OpenAPI schema generation. It uses **Pydantic** for rigid input validation and **SlowAPI** for client-specific rate limiting to protect API endpoints from abuse.

### 2.2 Frontend Client (Next.js 14)
The user interface is built on Next.js 14 utilizing React 18, vanilla CSS, and **Framer Motion** for premium, fluid layout transitions. It includes:
*   **Authentication Hub**: Seamless Google Sign-In and a frictionless Guest Mode.
*   **Personalization Wizard**: A responsive slider enabling users to choose their current phase (pregnancy week or baby age in months) and dietary preferences (Vegetarian, Non-Vegetarian, Vegan).
*   **Dynamic Dashboard**: Displays published, medically-sourced articles matching the user's phase.
*   **AI Chat Interface**: Interactive chat pane letting users query specific agents (Pregnancy, New Mom, Nutrition, Wellness, Healthcare, Admin).

---

## 3. Specialized Multi-Agent Ecosystem

The core value of MaMaVerse lies in its network of **Specialized AI Agents**, each given distinct system prompts, medical context parameters, and temperature configurations to excel at their respective domains:

```mermaid
graph TD
    User([User Query]) --> Orchestrator{Orchestrator}
    Orchestrator -->|Pregnancy Phase| PregnancyAgent[Pregnancy Agent]
    Orchestrator -->|Postpartum / Infant| NewMomAgent[New Mom Agent]
    Orchestrator -->|Dietary Plans| NutritionAgent[Nutrition Agent]
    Orchestrator -->|Emotional / Fitness| WellnessAgent[Wellness Agent]
    Orchestrator -->|Local Doctors / Clinics| PlacesAgent[Healthcare Agent]
    Orchestrator -->|Ingestion / Admin Review| AdminAgent[Admin Ingestion Agent]
```

### 3.1 Pregnancy Knowledge Agent
*   **Role**: Guides expecting mothers through fetal development, trimester-specific symptoms, and prenatal tests.
*   **Grounding**: Configured with standard obstetric timelines. It explains fetal development using child-friendly metaphors (e.g., "At week 12, your baby is the size of a lemon") to make the experience engaging and positive.

### 3.2 New Mom Agent
*   **Role**: Assists mothers during the "fourth trimester" and early parenthood.
*   **Grounding**: Guides mothers on postpartum physical recovery, emotional healing, breastfeeding, newborn vaccination schedules, and safe infant sleep guidelines (grounded in AAP recommendations to prevent SIDS).

### 3.3 Nutrition Agent
*   **Role**: Creates custom 7-day meal plans and nutritional advice.
*   **Grounding**: Tailored specifically for Indian dietary contexts. It respects vegetarian, non-vegetarian, and vegan preferences, and draws heavily from the **ICMR-NIN (National Institute of Nutrition, India)** guidelines, focusing on micronutrients like iron, calcium, and folic acid.

### 3.4 Wellness Agent
*   **Role**: Supports maternal mental wellness and safe physical fitness.
*   **Grounding**: Provides guided breathing routines, mindfulness techniques, and direct contact resources for postpartum depression helplines in India.

### 3.5 Healthcare Discovery Agent
*   **Role**: Identifies local medical facilities, pediatricians, and gynecologists.
*   **Grounding**: Integrates with the **Google Places API** to allow real-time city or geographical coordinates queries, returning verified contact details of local healthcare centers.

### 3.6 Admin Ingestion Agent (Human-in-the-Loop)
*   **Role**: Processes and curates new medical content.
*   **Grounding**: Analyzes web sources provided by administrators, checks for factual accuracy, flags duplicate records, evaluates potential medical risks, and prepares draft articles. These drafts remain hidden until reviewed and approved by a human administrator.

---

## 4. Implementation Quality, Security & Privacy

### 4.1 Security Framework
Given the sensitivity of health data, MaMaVerse integrates multiple security layers:
1.  **Authentication**: Firebase Authentication manages user credentials. Client requests contain the Firebase ID Token in the `Authorization: Bearer <Token>` header.
2.  **Role-Based Access Control (RBAC)**: The backend decodes Firebase tokens and checks for the custom `role: admin` claim. The Admin Portal and database seeding tools are completely locked behind this validation.
3.  **Privacy Options**: Users can choose to sign in as a Guest. Guest session profiles are stored strictly in `sessionStorage` on the client and are never sent to Firestore, ensuring zero data footprint for privacy-conscious users. Signed-in users can wipe their profile data from Firestore instantly via their settings.

### 4.2 Database Optimization (In-Memory Slicing)
To prevent Firestore from throwing `FailedPrecondition` errors (which require complex, manual composite index creations in the Firebase console), the backend service layer queries Firestore documents and performs sorting (`published_at`) and pagination (`limit`) **in-memory** in Python. This guarantees high reliability, zero index-management overhead, and fast, predictable response times.

### 4.3 Resilience & Hydration Safety Fallbacks
Client-side Next.js applications often crash or get locked on loading screens if Firebase initialization fails during browser hydration (e.g. if an API key is missing or misconfigured at build-time). 
*   **Try-Catch Wrapper**: Firebase initialization in `firebase.ts` is wrapped in a fail-safe block. If it fails, it creates a mock interface that falls back gracefully.
*   **Safety Timeout**: The main `AuthProvider` features a 3-second safety timeout. If the Firebase authentication callback hangs, it automatically forces loading to end, allowing the guest login and onboarding pages to render normally.
*   **Axios Path Guard**: The Axios global interceptor prevents infinite loops by ensuring a 401 error redirect is never triggered when the browser is already rendering the `/login` route.

---

## 5. Course Concepts Integration & Agent Technologies

### 5.1 Advanced LLM Orchestration
MaMaVerse showcases key agentic concepts:
*   **Context-Based Prompts**: Prompts are dynamically compiled using the user's pregnancy week, baby age, dietary preferences, and localized guidelines.
*   **Safety Guardrails**: Strict instructions prevent agents from prescribing prescription drugs, forcing them to always output a prominent **Medical Disclaimer** advising users to consult a qualified physician for clinical decisions.
*   **Model Selection**: Utilizes **Gemini 2.5 Flash** for rapid, low-latency chatbot interactions, and **Gemini 2.5 Pro** for deep, structured analysis like generating custom week-by-week summaries.

---

## 6. Overall User Value & The Project Story

### 6.1 Compelling Project Story
The genesis of MaMaVerse was to build an "Agent for Good" that addresses the severe anxiety faced by new mothers. By creating a unified portal that consolidates week-by-week summaries, dietary plans, wellness guidelines, and local hospital searches, MaMaVerse simplifies maternal health into a single, supportive hub.

### 6.2 Overall User Value
*   **Zero-Friction Access**: Expecting mothers can enter their details and get personalized advice as a guest in under 10 seconds.
*   **Safety-First Design**: The human approval workflow ensures all content guidelines are verified and safe.
*   **Medically Curated Nutrition**: Grounded meal planning ensures balanced nutrition tailored to Indian food cultures.

MaMaVerse stands as a compelling proof-of-concept of how AI, when combined with strong human-in-the-loop validation, strict privacy measures, and thoughtful software architecture, can act as a profound force for good.

---

## 7. Public Code Repository & Detailed Setup Instructions

### 7.1 GitHub Repository Link
The complete codebase for both the Next.js frontend, FastAPI backend, and deployment automation configurations is publicly available at:
👉 **[GitHub Code Repository: MaMaVerse](https://github.com/kiniarchana23-code/MaMaVerse)**

### 7.2 Live Deployed Endpoints
*   **Frontend Client**: [https://mamaverse-frontend-983146308842.asia-south1.run.app](https://mamaverse-frontend-983146308842.asia-south1.run.app)
*   **Backend REST API**: [https://mamaverse-backend-983146308842.asia-south1.run.app](https://mamaverse-backend-983146308842.asia-south1.run.app)

---

### 7.3 Detailed Local Setup Instructions

#### 🛠️ Prerequisites
Before starting, ensure you have:
1.  **Node.js** (v18.0.0 or higher)
2.  **Python** (v3.12.0 or higher)
3.  A **Google Cloud Platform (GCP)** project with billing and Firestore enabled.

---

#### 1️⃣ Clone the Repository
Clone the codebase to your local machine:
```bash
git clone https://github.com/kiniarchana23-code/MaMaVerse.git
cd MaMAVerse
```

---

#### 2️⃣ Backend Configuration & Execution
1.  Navigate into the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  Install all Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file in the `backend/` directory:
    ```env
    ENV=development
    GCP_PROJECT_ID=project-7e1f15c5-7bea-42ce-ad3
    FIREBASE_PROJECT_ID=project-7e1f15c5-7bea-42ce-ad3
    GEMINI_API_KEY=your_gemini_api_key
    GOOGLE_PLACES_API_KEY=AIzaSyCIoMtjwOm1-OZobCYc5EqpfZARLH-GZXg
    ```
5.  Launch the FastAPI server using Uvicorn:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The API docs will be interactive and accessible at [http://localhost:8000/api/docs](http://localhost:8000/api/docs).

---

#### 3️⃣ Frontend Configuration & Execution
1.  Open a new terminal session and navigate into the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install all node modules:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the `frontend/` directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDK97NUGrp1QG9ao3HmTr0izbtcdRP0Xuk
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-7e1f15c5-7bea-42ce-ad3.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-7e1f15c5-7bea-42ce-ad3
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-7e1f15c5-7bea-42ce-ad3.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=983146308842
    NEXT_PUBLIC_FIREBASE_APP_ID=1:983146308842:web:c8c50e417ff2497fc38891
    ```
4.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the running application locally.

