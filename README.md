# BIS Sahayak – AI Assistant for Indian Standards & BIS Services

**BIS Sahayak** is an official-grade, full-stack regulatory AI assistant designed for Indian manufacturers, importers, MSMEs, test laboratories, and consumers. It provides instant, retrieval-grounded guidance on Indian Standards (IS), mandatory Quality Control Orders (QCO), ISI Mark licensing (Scheme I), Compulsory Registration (CRS Scheme II), Gold Hallmarking (HUID), and Foreign Manufacturers Certification Scheme (FMCS).

---

## 🌟 Key Features

1. **Retrieval-Grounded AI Consultation (`/api/chat`)**:
   - BM25 and keyword scoring across curated BIS schemes with exact Indian Standard number boosting (e.g. `IS 302-2-21`, `IS 4151`, `IS 15393`).
   - Grounded strictly in official documents with confidence scoring (High / Medium / Low) and authoritative citations.
   - Guardrails against hallucinations: If a query is not covered in the knowledge base, it returns a safe "not found" response directing to the official BIS Care helpline (`1800-11-0001`) and portals.
2. **Indian Standards (IS) Catalog & QCO Finder (`/api/standards`)**:
   - Search across 30+ categorized standards with live filters for category, scheme, and QCO mandatory enforcement status.
   - Comprehensive detail drawer displaying testing parameters, mandatory gazette enforcement dates, and official Manak Online links.
3. **Certification Roadmap Wizard (`/api/certification-guide`)**:
   - Interactive wizard for domestic and foreign manufacturers with MSME Udyam concessions.
   - Generates structured roadmaps, timeline estimates, ordered procedures, and printable document checklists with PDF export.
4. **License Verification & AI Label Scanner (`/api/verify-license` & `/api/label-scan`)**:
   - Instant verification of ISI CM/L numbers, CRS R-numbers, and Gold Jewellery HUIDs.
   - Vision-powered product label inspector extracting ISI logos, standard numbers, and registration codes.
5. **Formal Legal Complaint Helper (`/api/complaint-draft`)**:
   - Generates formal consumer and business grievance letters cited under Sections 17 & 29 of the BIS Act 2016 for counterfeit marks and substandard products.
6. **Voice Input Transcription (`/api/transcribe`)**:
   - Microphone recording and audio transcription via Gemini.
7. **Multi-Language Support**:
   - Available in English, Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), and Marathi (मराठी).
8. **Admin Analytics Console (`/api/admin/stats`)**:
   - Protected by `ADMIN_KEY` to track queries, thumbs-up/down rates, user feedback, and top unanswered inquiries.

---

## 🚀 Quick Start & Run Steps

### 1. Prerequisites
- Node.js 18+ or 20+
- A valid Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
ADMIN_KEY="bis-admin-secret-key"
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Both the Express API server and Vite React frontend will be served seamlessly on `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📂 Replacing the Sample Data

All seed datasets are organized in the `/data` directory in clean JSON format:

1. **Knowledge Base (`data/knowledge.json`)**:
   - Contains text chunks for BM25 retrieval.
   - To add or update circulars, append objects to the `chunks` array:
     ```json
     {
       "id": "unique-chunk-id",
       "title": "Title of the Scheme or Order",
       "keywords": ["keyword1", "is number", "product"],
       "content": "Official factual text of the standard, scheme, or QCO.",
       "source": "Ministry Gazette / BIS Regulation",
       "url": "https://www.bis.gov.in",
       "lastUpdated": "2026-03-01"
     }
     ```
2. **Standards Catalog (`data/standards.json`)**:
   - Contains metadata for the standards finder.
   - To add a standard, add an entry to the `standards` array with `isNumber`, `title`, `year`, `scopeSummary`, `productCategory`, `scheme`, `qcoApplicable`, and `labTestParameters`.
3. **Demo License Records (`data/licenses.json`)**:
   - Contains sample verified license entries. Replace or extend entries in `licenses`.
4. **Persistent In-Memory Database (`data/db.json`)**:
   - Automatically managed by `server/db.ts` to store feedback, session history, and unanswered queries.

---

## 🏛️ Official BIS Contacts & References
- **Official BIS Website**: [bis.gov.in](https://www.bis.gov.in)
- **e-BIS / Manak Online**: [manakonline.in](https://www.manakonline.in)
- **CRS Electronics Portal**: [crsbis.in](https://www.crsbis.in)
- **Toll-Free Care Line**: `1800-11-0001`
- **Grievance Email**: `complaints@bis.gov.in`
