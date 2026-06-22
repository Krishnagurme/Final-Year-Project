# 🌐 LearnSphere

> **An AI-powered Learning Management Platform designed to adapt to student weaknesses and deliver dynamic, textbook-centric academic growth.**

![LearnSphere Tech Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20Python-indigo)
![License](https://img.shields.io/badge/License-MIT-emerald)

LearnSphere is a modern, modular educational platform that seamlessly integrates a rich **React/Tailwind** frontend with a robust **Node/Express** backend. What sets LearnSphere apart is its advanced internal **DeepTutor AI Workspace**, powering features from dynamic RAG-based context parsing to intelligent, weakness-targeted student assessments.

---

## 🎨 Features & Architecture

### Sleek, Modern User Interface
- **Premium Glassmorphism Design:** Beautiful translucent overlays, glowing `.btn-primary` gradients, and meticulously smooth hover-state animations.
- **Dynamic Adapting Dashboards:** Distinct visual layouts separating Student capabilities from Instructor course-creation controls.

### The AI Workspace
- **Retrieval-Augmented Generation (RAG):** Upload PDFs or text documents, and the embedded AI creates instant, persistent semantic chunks allowing it to answer deep questions grounded entirely in your uploaded course materials.
- **Durable Memory & Streaming:** Experience fast Server-Sent Events (SSE) token streaming alongside a local database configuration that natively simulates answers gracefully if external LLM keys are absent.
- **Cascading Data Security:** Built-in safeguards ensure that deleting documents immediately strips active RAG functionality and cleans historical vectors automatically.

### Adaptive Assessments
- Instead of static quizzes, LearnSphere features dynamic tests generating **academic, textbook-centric questions**. The AI engine reads historical assessment data and heavily targets topics the student previously failed, guaranteeing educational growth instead of rote memorization.

---

## ⚙️ Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Framer Motion, Redux Toolkit
- **Backend:** Node.js, Express.js, Mongoose/MongoDB
- **AI Microservices:** Python, OpenAI Integration, Local Simulation Fallbacks
- **Deployment:** Docker & `docker-compose`

---

## 🚀 Quick Start

Ensure you have your `.env` configured inside both the `backend` and `frontend` directories. You will need a standard MongoDB URI running locally or via Atlas.

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run the Development Environment
LearnSphere utilizes `concurrently` to run the frontend and backend servers seamlessly from the root folder.

```bash
npm run dev
```

### 3. Access the App
- Frontend Live: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 📦 Project Structure Overview
```text
learnSphere/
├── backend/            # Express REST APIs, Mongoose Models, AI service integrations
├── frontend/           # Vite/React SPA featuring the Glassmorphism UI framework
├── DeepTutor/          # Standalone Python microservice architecture 
├── docs/               # Advanced System Diagrams & Planning Docs
└── scripts/            # Helper binaries and archived development scripts
```

---

*Authored by the LearnSphere Team.*
