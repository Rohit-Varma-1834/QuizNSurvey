# 🧠 QuiznSurvey

A full-stack web application for creating, sharing, and analyzing quizzes and surveys — with QR code sharing, real-time analytics, and a beautiful modern UI.

![QuiznSurvey Dashboard](https://placeholder.com/dashboard-screenshot.png)

---

## ✨ Features

- 🔐 **JWT Authentication** — Register, login, secure dashboard
- 📋 **Form Builder** — 7 question types: Multiple choice, Checkbox, Short answer, Paragraph, True/False, Rating, Dropdown
- 🧠 **Quiz Mode** — Auto-grading, scoring, pass/fail, timers, show correct answers
- 📝 **Survey Mode** — Anonymous responses, confirmation messages, expiry dates
- 📱 **QR Code Sharing** — Every published form gets a scannable QR code
- 🔗 **Public Links** — Shareable URLs for anyone to respond
- 📊 **Analytics** — Charts, score distributions, question breakdowns, response trends
- 🌙 **Dark Mode** — Full dark/light theme toggle
- 📱 **Mobile Responsive** — Works on all devices
- 🔍 **Search/Filter/Sort** — Find forms quickly
- 🔄 **Duplicate Forms** — Clone any form with one click

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Chart.js, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| QR Code | qrcode (backend), qrcode.react (frontend) |
| Styling | Custom CSS with CSS Variables, Google Fonts |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas (DB) |

---

## 📁 Folder Structure

```
quiznsurvey/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Login/register/logout
│   │   ├── formController.js      # CRUD + publish + stats
│   │   ├── responseController.js  # Submit + view responses
│   │   ├── analyticsController.js # Charts data
│   │   ├── publicController.js    # Public form access
│   │   └── userController.js      # Profile updates
│   ├── middleware/
│   │   └── auth.js                # JWT protect + optional
│   ├── models/
│   │   ├── User.js
│   │   ├── Form.js
│   │   └── Response.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── forms.js
│   │   ├── responses.js
│   │   ├── analytics.js
│   │   ├── public.js
│   │   └── users.js
│   ├── utils/
│   │   └── seed.js                # Demo data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Main entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── dashboard/
        │   │   ├── FormCard.js
        │   │   └── ShareModal.js
        │   ├── forms/
        │   │   └── QuestionEditor.js
        │   ├── layout/
        │   │   └── Navbar.js
        │   └── ui/
        │       ├── Common.js
        │       ├── LoadingScreen.js
        │       └── Modal.js
        ├── context/
        │   ├── AuthContext.js
        │   └── ThemeContext.js
        ├── pages/
        │   ├── LandingPage.js
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   ├── FormBuilderPage.js
        │   ├── FormResponsePage.js
        │   ├── AnalyticsPage.js
        │   ├── ResponsesPage.js
        │   ├── ProfilePage.js
        │   └── NotFoundPage.js
        ├── services/
        │   └── api.js             # Axios instance
        ├── App.js
        ├── index.js
        └── index.css              # Global styles + design system
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.mongodb.net/quiznsurvey
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BASE_URL=http://localhost:3000
```

---

## 🚀 Local Setup (Step by Step)

### Prerequisites
- Node.js v18+ — [nodejs.org](https://nodejs.org)
- npm v9+ (comes with Node)
- MongoDB Atlas account — [mongodb.com/atlas](https://www.mongodb.com/atlas) (free tier)
- Git — [git-scm.com](https://git-scm.com)

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/quiznsurvey.git
cd quiznsurvey
```

### Step 2: Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### Step 3: Setup Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### Step 4: Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App opens on http://localhost:3000
```

### Step 5: (Optional) Seed Demo Data
```bash
cd backend
npm run seed
# Creates demo accounts:
# alice@demo.com / password123
# bob@demo.com / password123
```

---

## 🌐 Deployment

### Option A: Vercel (Frontend) + Render (Backend) [Recommended Free]

#### Deploy Backend to Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo, set **Root Directory** to `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables (same as `.env`)
7. Copy your Render backend URL (e.g., `https://quiznsurvey-api.onrender.com`)

#### Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo, set **Root Directory** to `frontend`
3. Add environment variable:
   - `REACT_APP_API_URL` = `https://quiznsurvey-api.onrender.com/api`
   - `REACT_APP_BASE_URL` = `https://your-vercel-app.vercel.app`
4. Deploy!

#### Update Backend CORS
Update `FRONTEND_URL` in Render to your Vercel URL.

### Option B: Railway (Both in one)
1. Go to [railway.app](https://railway.app)
2. Deploy backend and frontend as separate services
3. Add MongoDB Plugin or use Atlas URI

---

## 📤 GitHub Upload

```bash
# In project root
git init
git add .
git commit -m "Initial commit: QuiznSurvey full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quiznsurvey.git
git push -u origin main
```

---

## 🧪 Testing the App

1. Open `http://localhost:3000`
2. Click **Get Started** → Register an account
3. From dashboard, click **Create New Form**
4. Choose **Quiz** type, add a title
5. Add questions (try Multiple Choice with correct answers)
6. Click **Save** then **Publish**
7. Click **Share** on the form card to see QR code + link
8. Open the public link in a new tab to respond
9. Go back to dashboard → **Analytics** to see results

---

## 🐛 Common Errors & Fixes

| Error | Fix |
|---|---|
| `Cannot connect to MongoDB` | Check your `MONGODB_URI` in `.env`. Make sure your IP is whitelisted in Atlas. |
| `CORS error` | Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL exactly |
| `401 Unauthorized` | JWT token expired or invalid. Try logging out and back in. |
| `npm install fails` | Delete `node_modules` and `package-lock.json`, run `npm install` again |
| `Port already in use` | Kill the process: `npx kill-port 5000` or `npx kill-port 3000` |
| `QR code not showing` | Form must be published first. Click the Publish button. |
| React build fails | Make sure all imports are correct. Run `npm run build` to see exact errors. |

---

## 📸 Screenshots

> Add screenshots here after deployment:
- `![Landing Page](screenshots/landing.png)`
- `![Dashboard](screenshots/dashboard.png)`
- `![Form Builder](screenshots/builder.png)`
- `![Analytics](screenshots/analytics.png)`
- `![Public Form](screenshots/form.png)`

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first.

---

## 📜 License

MIT License — free to use for personal and commercial projects.

---

Made with ❤️ by the QuiznSurvey team
