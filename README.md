# ⚡ HackRadar

> A personal email scraper + dashboard that automatically finds hackathon and competition emails from your Gmail and displays them in a clean, filterable GUI.

🌐 **Live Demo:** [https://hackradar-xw6o.onrender.com/](https://hackradar-xw6o.onrender.com/)

Built for VIT Vellore students (works with `@vitstudent.ac.in` Google Workspace accounts).

![HackRadar Dashboard](https://img.shields.io/badge/status-active-2ed573?style=flat-square) ![Python](https://img.shields.io/badge/python-3.8+-3776AB?style=flat-square&logo=python&logoColor=white) ![React](https://img.shields.io/badge/react-18+-61DAFB?style=flat-square&logo=react&logoColor=black) ![Gmail API](https://img.shields.io/badge/Gmail_API-v1-EA4335?style=flat-square&logo=gmail&logoColor=white)

---

## 📸 Features

- 🔍 **Auto-scrapes** your Gmail for hackathon, competition, contest, emails
- 🔥 **Smart tagging** — flags Urgent deadlines, Upcoming events, and New announcements
- ⏰ **Deadline extraction** — pulls dates from email bodies using regex
- 🎛️ **Filter by status and tag** — sidebar navigation
- 🔎 **Live search** — search subject, sender, or snippet
- ⊞ **Grid / List toggle** — switch layouts
- 📋 **Detail panel** — click any card to see full preview + metadata
- ♻️ **One-click refresh** — re-fetches from Gmail in real time

---

## 🗂️ Project Structure

```
└── hackradar/
    ├── README.md
    ├── app.py
    ├── DEPLOYMENT.md
    ├── LICENSE
    ├── render.yaml
    ├── requirements.txt
    ├── .env.example
    ├── hackradar-ui/
    │   ├── package.json
    │   ├── public/
    │   │   ├── index.html
    │   │   ├── manifest.json
    │   │   └── robots.txt
    │   └── src/
    │       ├── App.css
    │       ├── App.js
    │       ├── App.test.js
    │       ├── index.css
    │       ├── index.js
    │       ├── reportWebVitals.js
    │       └── setupTests.js
    └── .github/
        └── workflows/
            └── deploy.yml

```

---

## 🔑 Step 1 — Get Gmail API Credentials

> You need a `credentials.json` file from Google Cloud Console. **Never commit this file to GitHub.**

### 1.1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your **VIT Google account** (`@vitstudent.ac.in`)
3. Click the project dropdown at the top → **New Project**
4. Name it `HackRadar` → click **Create**

### 1.2 — Enable Gmail API

1. In the left sidebar → **APIs & Services** → **Library**
2. Search for `Gmail API`
3. Click it → click **Enable**

### 1.3 — Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen** (or **Google Auth Platform** → **Branding**)
2. Under **Audience**, select **Internal** *(since you're using a VIT org account — no verification needed)*
3. Click **Next**
4. Fill in:
   - **App name**: `HackRadar`
   - **User support email**: your VIT email
5. Click **Save and Continue**
6. On the **Data Access** step → click **Add or Remove Scopes**
7. Search for `gmail.readonly` → check it → click **Update**
8. Click **Save and Continue** → **Back to Dashboard**

### 1.4 — Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials** (or **Google Auth Platform** → **Clients**)
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type → **Desktop App**
4. Name → `HackRadar Desktop`
5. Click **Create**
6. Click **Download JSON**
7. Rename the downloaded file to `credentials.json`
8. Place it in the `backend/` folder

> ⚠️ **Never push `credentials.json` or `token.pickle` to GitHub.** They are already in `.gitignore`.

---

## ⚙️ Step 2 — Backend Setup

### 2.1 — Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2.2 — Run the server

```bash
python app.py
```

**On first run**, a browser window will open asking you to sign in with your Google account and grant read-only Gmail access. After approval, a `token.pickle` file is saved — you won't need to log in again.

### 2.3 — Verify it works

Open your browser and visit:

```
http://localhost:5000/api/emails
```

You should see a JSON array of your scraped hackathon emails. ✅

---

## 🖥️ Step 3 — Frontend Setup

### Option A — React App (Recommended)

```bash
npx create-react-app hackradar-ui
cd hackradar-ui
```

Replace `src/App.js` with the contents of `frontend/HackRadar.jsx`, then:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### Option B — Quick Preview (No setup)

1. Go to [stackblitz.com](https://stackblitz.com) → New React Project
2. Paste the contents of `HackRadar.jsx` into `App.jsx`
3. Done — live preview instantly

---

## 📦 Backend — `requirements.txt`

```
flask
flask-cors
google-auth
google-auth-oauthlib
google-api-python-client
```

---

## 🔒 Security — `.gitignore`

Make sure your `.gitignore` includes:

```
# Gmail API secrets — NEVER commit these
credentials.json
token.pickle

# Python
__pycache__/
*.pyc
.env

# Node
node_modules/
```

---

## 🧠 How It Works

```
Gmail API (OAuth2)
      ↓
  Flask Backend (app.py)
  • Searches Gmail with keyword queries
  • Extracts subject, sender, date, body preview
  • Detects deadlines using regex
  • Tags emails: hackathon, contest, MLH, SIH, etc.
  • Returns JSON at /api/emails
      ↓
  React Frontend (HackRadar.jsx)
  • Fetches from localhost:5000
  • Renders filterable dashboard
  • Status: Urgent / Upcoming / New
  • Grid and List views
  • Detail panel on click
```

---

## 🔍 Keywords Scraped

The scraper searches your Gmail for emails containing:

`hackathon` · `hack` · `devpost` · `competition` · `contest` · `challenge` · `ideathon` · `datathon` · `buildathon` · `smart india` · `SIH` · `MLH` · `IEEE` · `ACM` · `register now` · `deadline` · `submit project`

You can add more in `app.py` by editing the `KEYWORDS` list.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| `403 org_internal` error | Your VIT org may block external OAuth. Try switching to **External** in the consent screen and add your email as a test user. |
| Browser doesn't open for login | Run `python app.py` in a terminal (not an IDE) so it can open a browser window |
| `token.pickle` error | Delete `token.pickle` and re-run — it will prompt login again |
| No emails showing | Check that your Gmail account actually has hackathon-related emails; try broadening keywords |
| CORS error in frontend | Make sure Flask is running on port 5000 and `flask-cors` is installed |

---

## 🤝 Contributing

Pull requests are welcome! If you're a VIT student and want to add features (e.g., email notifications, calendar integration, auto-apply links), feel free to fork and open a PR.

---

## 📄 License

MIT License — free to use, modify, and share.

---

> Made with ⚡ at VIT Vellore
