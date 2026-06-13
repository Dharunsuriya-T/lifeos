# LifeOS

A privacy-first personal life management platform designed to help you capture thoughts, organize information, manage tasks, track goals, and maintain progress—all across web and mobile devices.

## 🎯 Core Philosophy

1. **Capture Fast** — Quickly record thoughts and ideas
2. **Organize Simply** — Keep information structured and accessible
3. **Track Progress** — Measure growth across goals, tasks, and habits
4. **Protect Privacy** — Your data stays yours with offline-first design
5. **Build For Long-Term Growth** — Support sustained personal development

## ✨ Features

- **Authentication** — Secure login with local accounts and Google OAuth
- **Goals & Roadmaps** — Define long-term goals with visual roadmap timelines
- **Tasks & Projects** — Organize work with priority-based task lists and project milestones
- **Habits & Habits Tracking** — Build consistency through habit logging and frequency tracking
- **Notes & Journal** — Capture reflections, organize notes by category, and maintain daily journal entries
- **Time Horizon Goals** — Break down long-term goals into Weekly, Monthly, and Yearly targets
- **Analytics Dashboard** — Monitor composite Growth Score and weekly performance trends
- **Offline-First Sync** — Work offline and sync data when connected
- **Data Export/Import** — Export workspace as JSON or import backups locally

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           React Web (Vite)                  │
│       frontend/ — TypeScript/React          │
└──────────────────┬──────────────────────────┘
                   │ API Calls (Axios)
                   ▼
┌─────────────────────────────────────────────┐
│      Spring Boot 3.5 API (Java 21)          │
│  backend/ — REST API + JWT Auth             │
└──────────────────┬──────────────────────────┘
                   │ JPA/SQL
                   ▼
┌─────────────────────────────────────────────┐
│          PostgreSQL Database                │
│   Migrations via Flyway                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│      React Native (Expo)                    │
│    mobile/ — TypeScript/React Native        │
└──────────────────┬──────────────────────────┘
                   │ Same API
```

## 🛠️ Tech Stack

### Backend
- **Java 21** — Language
- **Spring Boot 3.5.x** — Framework
- **Spring Security** — Authentication & authorization
- **Spring Data JPA** — Database access
- **PostgreSQL** — Database
- **Flyway** — Database schema versioning
- **JWT (JJWT)** — Token-based authentication
- **Google API Client** — OAuth integration
- **Maven** — Build tool

### Frontend Web
- **React 19** — UI framework
- **TypeScript** — Type-safe JavaScript
- **Vite** — Build tool
- **React Router** — Client-side routing
- **Axios** — HTTP client
- **React Hook Form** — Form handling
- **React Query** — Server state management
- **Google OAuth** — Sign-in integration
- **ESLint** — Code linting

### Mobile App
- **React Native 0.74** — Mobile framework
- **Expo 51** — Development & deployment platform
- **React Navigation** — Mobile routing
- **AsyncStorage** — Local storage
- **Axios** — HTTP client
- **TypeScript** — Type safety

### Infrastructure
- **Docker** — Containerization
- **Git/GitHub** — Version control
- **Render** — Backend hosting (planned)
- **Vercel** — Frontend hosting (planned)

## 📁 Project Structure

```
lifeos/
├── backend/                          # Spring Boot API server
│   ├── src/main/java/com/lifeos/backend/
│   │   ├── auth/                     # Authentication controller
│   │   ├── user/                     # User entities, DTOs, service
│   │   ├── security/                 # JWT, Google token, auth filter
│   │   ├── config/                   # Security & CORS config
│   │   ├── dashboard/                # Dashboard API
│   │   ├── sync/                     # Sync service
│   │   ├── analytics/                # Analytics calculations
│   │   ├── note/                     # Notes module
│   │   ├── journal/                  # Journal module
│   │   ├── habit/                    # Habits module
│   │   ├── task/                     # Tasks module
│   │   ├── goal/                     # Goals module
│   │   ├── roadmap/                  # Roadmaps module
│   │   ├── project/                  # Projects & milestones module
│   │   ├── learning/                 # Learning items module
│   │   └── common/                   # Base entities, exceptions
│   ├── src/main/resources/
│   │   ├── db/migration/             # Flyway migration scripts
│   │   ├── application.yaml          # App config
│   │   ├── application-local.yml     # Local dev config
│   │   ├── application-prod.yml      # Production config
│   │   ├── static/                   # Static files
│   │   └── templates/                # Email templates (if needed)
│   ├── pom.xml                       # Maven dependencies
│   └── Dockerfile
│
├── frontend/                         # React web app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx         # Login form
│   │   │   ├── RegisterPage.tsx      # Registration form
│   │   │   └── DashboardPage.tsx     # Main app with tabs
│   │   ├── components/
│   │   │   ├── DashboardTab.tsx      # Task dashboard
│   │   │   ├── GoalsTab.tsx          # Goals list
│   │   │   ├── RoadmapsTab.tsx       # Visual roadmaps
│   │   │   ├── TasksTab.tsx          # Task management
│   │   │   ├── NotesTab.tsx          # Notes notebook
│   │   │   ├── JournalTab.tsx        # Daily journal
│   │   │   ├── HabitsTab.tsx         # Habit tracking
│   │   │   ├── HorizonGoalsTab.tsx   # Time horizon goals
│   │   │   └── AnalyticsTab.tsx      # Growth analytics
│   │   ├── api/
│   │   │   ├── axios.ts              # Configured Axios instance
│   │   │   ├── authApi.ts            # Auth endpoints
│   │   │   └── lifeOsApi.ts          # Data endpoints
│   │   ├── routes/
│   │   │   └── ProtectedRoute.tsx    # Route guard
│   │   ├── types/
│   │   │   ├── auth.ts               # Auth type definitions
│   │   │   └── lifeOs.ts             # Domain type definitions
│   │   ├── utils/
│   │   │   ├── auth.ts               # Token management
│   │   │   └── calculators.ts        # Growth score calculations
│   │   ├── hooks/
│   │   │   └── useLifeOsSync.ts      # Data sync hook
│   │   ├── App.tsx                   # Root component
│   │   └── main.tsx                  # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── mobile/                           # React Native / Expo app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── GoalsScreen.tsx
│   │   │   ├── TasksScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── api/
│   │   │   ├── axios.ts              # API client with auth
│   │   │   └── lifeOsApi.ts          # Data API calls
│   │   ├── types/
│   │   │   └── lifeOs.ts             # Type definitions
│   │   ├── utils/
│   │   │   ├── auth.ts               # Token management
│   │   │   └── calculators.ts        # Calculations
│   │   ├── hooks/
│   │   │   └── useMobileSync.ts      # Data sync hook
│   │   └── App.tsx                   # Root component
│   ├── index.ts                      # Entry point
│   ├── app.json                      # Expo config
│   └── package.json
│
├── infrastructure/
│   └── docker-compose.yml            # Local dev environment
│
├── docs/                             # Documentation
│   ├── architecture.md               # Architecture decisions
│   ├── progress.md                   # Development progress
│   ├── decisions.md                  # ADRs
│   └── roadmap.md                    # Project roadmap
│
└── README.md                         # This file
```

## 🚀 Getting Started

### Prerequisites
- Java 21
- Node.js 18+
- npm or yarn
- PostgreSQL 12+ (or Docker)
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Set up PostgreSQL (with Docker):**
   ```bash
   cd ../infrastructure
   docker-compose up -d
   cd ../backend
   ```

3. **Configure environment:**
   - Create or update `src/main/resources/application-local.yml` with database credentials
   - Set JWT secrets and Google OAuth credentials

4. **Build and run:**
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

   Backend runs on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Create `.env.local` or update `vite.config.ts` with:
     ```
     VITE_API_BASE_URL=http://localhost:8080/api/v1
     ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173`

### Mobile Setup

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Expo:**
   ```bash
   npm run start
   ```

   Then press:
   - `a` for Android emulator
   - `i` for iOS simulator
   - `w` for web preview

## 🔐 Authentication Flow

### Local Authentication
1. User registers with email and password
2. Backend hashes password and stores user
3. On login, credentials validated, JWT tokens issued
4. Access token (short-lived) used for API calls
5. Refresh token (long-lived) stored for token renewal

### Google OAuth
1. User clicks "Sign in with Google"
2. Frontend redirects to Google login
3. Backend verifies Google ID token
4. New user auto-created if needed
5. JWT tokens issued for LifeOS session

### Token Refresh
- Axios interceptors automatically refresh expired tokens
- 401 response triggers refresh flow
- New access token obtained and request retried

## 🔄 Data Sync

### Sync Endpoints
- `POST /api/v1/sync` — Bidirectional data sync
- `GET /api/v1/dashboard` — Dashboard data
- `GET /api/v1/analytics` — Analytics data

### Offline-First Design
- Mobile and web cache data locally
- Changes queued when offline
- On reconnection, sync merges local and server changes
- Conflict resolution uses `updatedAt` timestamps

### Data Export/Import
- Export all workspace data to JSON
- Import JSON backups to restore state
- Merge logic prevents data loss

## 📊 Planned V1 Modules

- ✅ Authentication
- ✅ Goals
- ✅ Projects & Milestones
- ✅ Progress Tracking
- ✅ Tasks
- ✅ Habits
- ✅ Notes
- ✅ Journal
- ⏳ Reminders
- ✅ Dashboard
- ⏳ Search
- ⏳ Tags
- ⏳ Calendar
- ✅ Google Login
- ✅ Analytics

## 🎯 Future Roadmap

### Phase 2
- AI Roadmap Generation
- Roadmap Sharing
- Advanced Offline Sync
- End-to-End Encryption

### Phase 3
- Collaboration Features
- Team Workspaces
- Real-time Sync
- Mobile Push Notifications

## 🛠️ Development Workflow

The preferred development workflow:

```
Database Design
    ↓
Backend Implementation
    ↓
Backend Tests
    ↓
Frontend Implementation
    ↓
Frontend Tests
    ↓
Deployment
```

This ensures the frontend consumes stable APIs.

## 📦 Building & Deployment

### Backend Deployment
```bash
cd backend
./mvnw clean package
# Deploy JAR to Render
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Mobile Deployment
```bash
cd mobile
# Build with EAS (Expo Application Services)
eas build
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests (placeholder)
```bash
cd frontend
npm run test
```

### Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend (via IDE or Maven plugins)
```

## 🔑 Environment Variables

### Backend (`application-local.yml`)
```yaml
spring.datasource.url: jdbc:postgresql://localhost:5432/lifeos
spring.datasource.username: postgres
spring.datasource.password: your_password

jwt.secret: your-long-secret-key
jwt.expiration: 3600000

google.oauth.client-id: your-google-client-id
```

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Mobile (`.env` or hardcoded for development)
```
REACT_APP_API_BASE_URL=http://your-backend-ip:8080/api/v1
```

## 📚 API Documentation

### Auth Endpoints
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login with email/password
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Logout and revoke token
- `POST /api/v1/auth/google` — Login with Google

### Data Endpoints
- `GET /api/v1/dashboard` — Get dashboard data
- `GET /api/v1/analytics` — Get analytics data
- `POST /api/v1/sync` — Sync data changes

### Health
- `GET /api/v1/health` — Health check endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Code Standards
- Use clear, descriptive commit messages
- Follow the existing code style
- Write tests for new features
- Update documentation as needed

## 📝 Architecture Decisions

See [docs/decisions.md](docs/decisions.md) for detailed ADRs on:
- UUID vs auto-increment IDs
- Flyway for schema management
- PostgreSQL Docker for local dev
- Backend-first development approach

## 📄 License

[Add your license here]

## 💬 Support

For questions or issues:
1. Check existing documentation in `/docs`
2. Review code comments and type definitions
3. Open an issue on GitHub

## 🙏 Acknowledgments

Built with:
- Spring Boot & Java ecosystem
- React & React Native communities
- Expo for mobile development
- PostgreSQL for data reliability

---

**LifeOS** — Capture, Organize, Track, Grow.
