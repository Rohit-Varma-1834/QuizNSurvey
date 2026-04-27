# QuiznSurvey

AI-powered full-stack quiz and survey builder with analytics, exports, and public response flows.

## Overview

QuiznSurvey lets creators build quizzes or surveys, publish them with a public link and QR code, collect responses, and review analytics in a private dashboard. The project combines a React frontend, Express API, MongoDB database, and OpenAI-powered creator tools.

This repo is positioned as a portfolio-grade full-stack project with:
- authenticated creator workspace
- public response experience without login
- analytics and export tooling
- AI-assisted question generation and response analysis

## Demo Links

- Frontend demo: `YOUR_VERCEL_URL_HERE`
- Backend API: `YOUR_RENDER_OR_RAILWAY_URL_HERE`
- Demo video: `YOUR_LOOM_OR_YOUTUBE_LINK_HERE`

## Screenshots

Replace these placeholders with real screenshots before sharing the project:

- `screenshots/dashboard-overview.png`
- `screenshots/form-builder-ai-generator.png`
- `screenshots/public-form-response.png`
- `screenshots/analytics-ai-summary.png`
- `screenshots/pdf-report-export.png`

## Core Features

- JWT authentication with protected creator routes
- Quiz and survey form builder
- 7 supported question types:
  - `multiple_choice`
  - `checkbox`
  - `short_answer`
  - `paragraph`
  - `true_false`
  - `rating`
  - `dropdown`
- Public form links and QR code sharing
- Quiz auto-scoring, pass/fail, timers, and answer review
- Anonymous survey responses
- Shuffle questions and show correct answers
- Dashboard search, filtering, sorting, duplication, publish/unpublish
- Response management, filtering, and CSV export
- Analytics charts and question-level insights
- PDF analytics report export
- Light/dark theme support

## AI Features

- AI Question Generator
  - creators enter topic, audience, goal, difficulty, and question count
  - backend calls OpenAI and returns structured questions for review before saving
- AI Response Summary
  - summarizes collected response patterns into trends, positives, issues, and suggested actions
- AI Sentiment Analysis
  - analyzes text-based survey answers and returns positive, neutral, and negative percentages

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, React Router v6, Axios, Chart.js, react-chartjs-2, react-hot-toast, react-icons, qrcode.react |
| Backend | Node.js, Express, express-validator, Helmet, CORS, express-rate-limit |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| AI | OpenAI Responses API |
| Exports | CSV generation, PDFKit for PDF reports |
| Deployment | Vercel frontend, Render or Railway backend, MongoDB Atlas |

## Architecture

```text
React Frontend
  -> Axios API client
  -> Express REST API
  -> MongoDB via Mongoose

Public users
  -> /f/:publicId
  -> submit responses without creator login

Authenticated creators
  -> dashboard, builder, responses, analytics
  -> protected backend routes

AI features
  -> backend-only OpenAI calls
  -> API key never exposed to frontend
```

## Project Structure

```text
quiznsurvey/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
├── render.yaml
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas database
- OpenAI API key

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/quiznsurvey.git
cd quiznsurvey
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `backend/.env` with real values.

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Update `frontend/.env` if needed.

### 4. Run locally

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm start
```

### 5. Optional seed

```bash
cd backend
npm run seed
```

## Environment Variables

### Backend: `backend/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/quiznsurvey
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

### Frontend: `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BASE_URL=http://localhost:3000
```

Important:
- `REACT_APP_API_URL` should be the backend origin only, not `/api`
- Correct example: `https://quiznsurvey-api.onrender.com`
- Incorrect example: `https://quiznsurvey-api.onrender.com/api`

If you leave `REACT_APP_API_URL` empty during local development, the CRA proxy in `frontend/package.json` can still forward `/api` requests to `http://localhost:5000`.

## API Routes Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Users

- `PUT /api/users/profile`
- `PUT /api/users/password`
- `PUT /api/users/email`
- `PUT /api/users/avatar`
- `DELETE /api/users/account`

### Forms

- `GET /api/forms`
- `GET /api/forms/stats`
- `GET /api/forms/:id`
- `POST /api/forms`
- `PUT /api/forms/:id`
- `DELETE /api/forms/:id`
- `POST /api/forms/:id/duplicate`
- `POST /api/forms/:id/publish`

### Public + Responses

- `GET /api/public/form/:publicId`
- `POST /api/responses/submit/:publicId`
- `GET /api/responses/form/:formId`
- `GET /api/responses/form/:formId/export`
- `DELETE /api/responses/:id`

### Analytics

- `GET /api/analytics/form/:formId`
- `GET /api/analytics/form/:formId/report.pdf`

### AI

- `POST /api/ai/generate-questions`
- `POST /api/ai/summarize-responses/:formId`
- `POST /api/ai/sentiment/:formId`

## Deployment

### Frontend on Vercel

Current config file:
- `frontend/vercel.json`

Recommended Vercel project settings:
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `build`

Frontend env vars:

```env
REACT_APP_API_URL=https://YOUR_BACKEND_DOMAIN
REACT_APP_BASE_URL=https://YOUR_FRONTEND_DOMAIN
```

### Backend on Render

Current Render blueprint:
- `render.yaml`

Recommended backend env vars on Render:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_atlas_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRE=7d
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

### Backend on Railway

No dedicated `railway.json` is required right now.

Recommended Railway setup:
- create a service from the repo
- set root directory to `backend`
- build command: `npm install`
- start command: `npm start`
- add the same backend env vars listed above

### MongoDB Atlas

- Create a cluster
- Create a database user
- Add your Render/Railway IP rules or allow access as needed
- Use the connection string as `MONGODB_URI`

## Deployment Links Placeholders

- Production frontend: `ADD_VERSEL_LINK_HERE`
- Production backend: `ADD_RENDER_OR_RAILWAY_LINK_HERE`
- MongoDB Atlas cluster name: `ADD_CLUSTER_NAME_HERE`

## Resume Bullet Ideas

Use or adapt these for your resume:

- Built an AI-powered full-stack quiz and survey platform using React, Express, MongoDB, and OpenAI APIs, supporting authenticated creator workflows and public response collection.
- Implemented secure multi-route ownership checks, JWT authentication, anonymous survey handling, CSV export, and PDF analytics reporting for creator-only data access.
- Designed analytics features including response trends, score distributions, question-level insights, AI summaries, and sentiment analysis to turn raw submissions into actionable insights.
- Developed deployment-ready frontend and backend environments for Vercel, Render/Railway, and MongoDB Atlas with production configuration and environment-based API routing.

## Future Improvements

- role-based team collaboration
- reusable form templates
- scheduled reports and email digests
- live real-time analytics
- chart snapshots in PDF reports
- AI-assisted answer quality scoring
- conditional branching logic between questions
- automated tests for backend routes and frontend flows

## Final Deployment Checklist

- Add real screenshots to the README
- Replace demo and deployment placeholders
- Create MongoDB Atlas database and user
- Set backend env vars on Render or Railway
- Set frontend env vars on Vercel
- Make sure `REACT_APP_API_URL` does not end with `/api`
- Make sure `FRONTEND_URL` matches the deployed frontend origin
- Confirm OpenAI API key is set on the backend only
- Deploy backend first, then frontend
- Test:
  - login/register
  - dashboard load
  - public form access
  - response submission
  - analytics page
  - CSV export
  - PDF export
  - AI question generator
  - AI summary
  - AI sentiment
