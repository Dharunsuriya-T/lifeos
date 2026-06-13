# LifeOS Frontend Client

A premium, responsive, and privacy-first web application built with **React 19**, **TypeScript**, and **Vite**. It features high-fidelity luxurious styling, offline-first client architecture, Google Drive synchronization, and a custom context feedback system.

---

## ✨ Features & Architecture

- **Offline-First & Local Storage**: Stores all user workspace data locally in `localStorage` for instant load times and complete offline usability.
- **Google Drive Sync**: Connects securely to the user's personal Google Drive via OAuth2, merging local changes and backing up data to `lifeos_backup.json`.
- **Premium Classic Luxurious Aesthetics**: Styled in Outfit/Jakarta fonts with elegant slate/zinc tones, theme-aware contrast elements, and fine borders.

---

## ⚡ Performance Optimizations

To guarantee maximum responsiveness and eliminate UI lags:
- **Memoized Data Calculations**: Replaced double-rendering `useEffect`/`useState` combinations with `useMemo` in [DashboardTab.tsx](file:///d:/projects/lifeos/frontend/src/components/DashboardTab.tsx) and [AnalyticsTab.tsx](file:///d:/projects/lifeos/frontend/src/components/AnalyticsTab.tsx). Heavy calculations (like composite Growth Scores, streak tallies, and analytics data) are calculated exactly once when inputs change and render immediately.
- **Scroll Cutoff Prevention**: Added vertical scrolling (`overflow-y: auto`) with styled ultra-thin Webkit scrollbars to the sidebar in [index.css](file:///d:/projects/lifeos/frontend/src/index.css). This prevents cutoffs on manual backup, theme switches, and logout options on smaller heights.

---

## 🎨 Custom Notifications & Dialogs System

Replaced native browser popups with a beautiful context-driven inline overlay:
- **Feedback Provider**: The `FeedbackProvider` in [useFeedback.tsx](file:///d:/projects/lifeos/frontend/src/hooks/useFeedback.tsx) exposes `showToast(...)` and `showConfirm(...)` methods.
- **Inline Toasts**: Animates soft background alerts with custom SVG success/error icons in the bottom-right corner.
- **Glassmorphic Confirm Modals**: Displays centered confirmation cards over a blurred backdrop overlay, ensuring warning interactions (deletions) feel integrated and polished.

---

## 📂 Directories Layout

```
frontend/src/
├── api/             # Axiom configuration and Auth/LifeOS request bindings
├── components/      # Tab containers (Dashboard, Goals, Kanban Tasks, Notes, Habits)
├── hooks/           # useLifeOsSync (data lifecycle), useFeedback (toasts/confirmations)
├── pages/           # View pages (LoginPage, RegisterPage, DashboardPage)
├── routes/          # ProtectedRoute navigation guard
├── types/           # Domain and Auth TypeScript interface declarations
├── utils/           # Auth token management and stats calculators
├── index.css        # Core design tokens, theme styles, and animations
└── main.tsx         # React application root entry point
```

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` root:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   VITE_API_URL=http://localhost:8081/api
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Verify and Build**:
   To test build compilation:
   ```bash
   npm run build
   ```
