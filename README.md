# Smart Expense Tracker AI (ExpenseSense AI 2.0)

A modern, production-ready intelligent personal finance application built with React 19, Vite, Express, and an adaptive dual-engine storage layer (supporting both MongoDB Atlas and zero-dependency local persistent storage).

Designed for **any screen size** (mobile phones, tablets, laptops, and PCs) and exportable as an **Android APK**.

---

## 🚀 One-Click Cloud Deployment (Render.com)

Deploy to Render for free 24/7 access from any phone, laptop, or tablet in the world without keeping your computer running:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Easy 3-Step Setup on Render:
1. Push this code to your GitHub account:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to **[Render.com](https://render.com)** $\rightarrow$ **New +** $\rightarrow$ **Blueprint**.
3. Select your repository. Render reads `render.yaml`, automatically runs `npm run build`, and launches the app!
   - Your permanent URL will be: `https://<your-app-name>.onrender.com`

---

## 📱 Run on Any Device & Install as an App (PWA)

### Access over Local Wi-Fi (No Internet Required):
- When running locally, any phone or tablet on your Wi-Fi can open:
  ```
  http://192.168.1.20:5000
  ```
- **Install on Android**: Open Chrome $\rightarrow$ tap 3 dots $\rightarrow$ **"Install App"** / **"Add to Home Screen"**.
- **Install on iPhone / iPad**: Open Safari $\rightarrow$ tap Share $\rightarrow$ **"Add to Home Screen"**.
- Runs full-screen with custom app icon and offline shell, feeling 100% like a native app!

---

## 📦 How to Get the Android APK File

### Method 1: Automated GitHub Actions (Cloud APK — 0 Setup)
1. Push this project to GitHub.
2. Go to your repo's **Actions** tab on GitHub.
3. Select **Build Android APK** $\rightarrow$ click **Run workflow**.
4. Once finished, download the **`SmartExpenseTrackerAI-Android-APK`** artifact containing `app-debug.apk`.

### Method 2: PWABuilder (1-Click Google Play Store / APK)
1. Deploy your app to Render (`https://your-app.onrender.com`).
2. Visit **[PWABuilder.com](https://www.pwabuilder.com/)**, paste your URL, and click **Package for Android**.

### Method 3: Local Android Studio
- Open `Frontend/android` in **Android Studio** $\rightarrow$ click **Build $\rightarrow$ Build APK(s)**, or double-click `build-apk.bat`.

---

## 🔑 Quick Demo Login

The demo button is intended only for a locally seeded development account. Do not use demo credentials in production.

---

## ✨ Features & Architecture

1. **Universal Responsive Layout & Screen Ratio Tuning**:
   - Adaptive 2×2 KPI summary grid on mobile (`≤580px`).
   - Mobile transaction cards with a 1-click header switcher between Table and Card views.
   - Smooth horizontal swipeable quick-category selector.
   - Safe-area inset support for iPhone Dynamic Island/notches and Android punch holes.

2. **Backend Server Settings Modal**:
   - Built-in connection tester in the navbar to seamlessly switch between local Wi-Fi, default web `/api`, or cloud deployment URLs.

3. **Adaptive Dual-Engine Storage**:
   - Automatically connects to MongoDB if `MONGO_URI` is supplied.
   - Uses built-in JSON storage only for local development when no `MONGO_URI` is configured; production refuses to start without MongoDB so financial data is not silently written to ephemeral disk.

4. **Security & Financial AI Advisor**:
   - User-level authorization and bcrypt security.
   - Real-time financial health score (0–100), savings rate quotient, and budget concentration alerts.

---

## 🛠️ Local Development Commands

```bash
# Unified Full-Stack Run (Production)
npm run build
npm start

# Development Mode with Hot Reload
# Terminal 1 - Backend:
npm --prefix Backend run dev

# Terminal 2 - Frontend:
npm --prefix Frontend run dev
```

## Production, offline, security, and recovery

The deployable architecture is one Node/Express service plus MongoDB. In a unified deployment the service serves `Frontend/dist` and `/api`; the website uses same-origin `/api`. An Android build must be built with `Frontend/.env.production` containing the public backend URL, for example:

```env
VITE_API_URL=https://your-service.example.com/api
```

Never put `JWT_SECRET`, `MONGO_URI`, `OPENAI_API_KEY`, `RESEND_API_KEY`, or any other private value in `Frontend/.env*`, the APK, or committed files. Copy [Backend/.env.example](Backend/.env.example) to an untracked `Backend/.env` for local development. Production needs a long random `JWT_SECRET`, a hosted MongoDB Atlas URI, and `NODE_ENV=production`; production refuses to start without the database URI and JWT secret.

### Deploy

1. Create a MongoDB Atlas cluster and database user. Add its connection string as `MONGO_URI` in the backend host. Enable backups or scheduled `mongodump`/Atlas backups before real financial data is used.
2. Push the repository to GitHub and create a Render Blueprint from `render.yaml` (or deploy the Dockerfile to another Node/Docker host). Add `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS`, and `PUBLIC_APP_URL` as host secrets. `CORS_ORIGINS` should list the website origin and the Capacitor origins needed by the APK, separated by commas.
3. Wait for `/api/health` to return `status: ok` and `database: MongoDB`. The app is not considered deployed until this check passes on the public URL.
4. For password-reset emails, add `RESEND_API_KEY` and `RESET_FROM_EMAIL` on the backend only. Without them, development exposes a reset token in a response header for local testing; production sends no token to the client, so email delivery must be configured.
5. Build the APK against the deployed service: copy `Frontend/.env.production.example` to the untracked `Frontend/.env.production`, set `VITE_API_URL`, then run `npm.cmd --prefix Frontend run build:android` and `Frontend\android\gradlew.bat assembleRelease`. Configure a release keystore in Android Studio/Gradle before distribution; the existing debug APK is not a store release.

Closing VS Code does not stop a deployed website, backend, MongoDB cluster, or installed APK. It does stop a local `node Backend/server.js` process. If the hosted backend or database is down, cloud sync, login, password reset, and AI-provider explanations are unavailable; cached expenses, totals, charts, and queued additions/edits/deletes continue on the device until storage is cleared or the session expires.

### Offline and sync behavior

The browser/PWA and Capacitor app cache the shell and the signed-in user’s expense list. New records, edits, and deletes are applied optimistically locally and queued with stable mutation IDs. Additions include a server idempotency key, so retries after an interrupted request do not create duplicates. The dashboard shows online/offline state, pending mutations, and the last successful sync timestamp. Invalid or unauthorized queued mutations are removed with a visible pending count change; transient server failures remain queued for a later retry. A 401 clears the session and sends the user to login with an expired-session state.

### AI and privacy

All totals, category sums, averages, health scores, and supporting transaction IDs are calculated by the backend from the authenticated user’s own records. `POST /api/expenses/assistant` is user-authorized and cannot read another user’s expenses. The optional OpenAI pass receives only the question and already-calculated aggregates; it is instructed not to invent facts. If no `OPENAI_API_KEY` is configured or the provider is unavailable, the deterministic assistant remains available. Provider use requires internet and incurs provider usage charges according to the selected model/account; verify current pricing in the provider’s official documentation before enabling it. Passwords are bcrypt-hashed, tokens are kept in browser storage for this existing architecture, and API keys remain backend-only.

### Backup and restore

For MongoDB, use Atlas continuous backup or scheduled `mongodump` stored outside the application host and periodically test restoring to a separate database. The JSON files in `Backend/data` are development-only fallback storage and are not suitable as a production multi-instance database; back them up by copying the files only while the local server is stopped. Never commit either database files or `.env` files.

### Verification and troubleshooting

Run `npm.cmd run build` for the production website, `npm.cmd --prefix Frontend run lint` for source linting, `node --check Backend/server.js` and `node --check Backend/controllers/expenseController.js` for backend syntax, then build Android with the Gradle command above. Lint may still report pre-existing generated files under `Frontend/android/app/src/main/assets/public`; those are copied bundles, not source code. If the APK cannot connect, verify `VITE_API_URL` was present at build time, the URL ends in `/api`, HTTPS is valid on the device, and `CORS_ORIGINS` includes the APK origin. If queued changes never drain, log in again after a 401 and check `/api/health` and the pending-sync count.
