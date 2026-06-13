# LifeOS Architectural Decisions Records (ADRs)

This document tracks the key architectural decisions made during the design and development of the LifeOS platform.

---

## ADR 001: UUID Primary Keys
- **Date**: 2026-06-11
- **Status**: Accepted
- **Context**: The application requires data synchronization between offline clients (web/mobile) and a centralized backend database.
- **Decision**: All database primary keys will be standard UUIDs instead of auto-incrementing integers.
- **Consequences**:
  - Prevents ID collisions when syncing offline-created records.
  - Improves security by preventing enumeration attacks on resource URLs.
  - Allows clients to generate record IDs locally before sending them to the database.

---

## ADR 002: Flyway Schema Migrations
- **Date**: 2026-06-11
- **Status**: Accepted
- **Context**: Schema evolution must be controlled, versioned, and easily deployable across development, staging, and production environments.
- **Decision**: Use Flyway for tracking and executing database schema migrations.
- **Consequences**:
  - Database schema state is versioned in the source tree under `db/migration`.
  - Ensures clean boots and automatic migrations on server starts.

---

## ADR 003: Offline-First Local Storage Sync
- **Date**: 2026-06-12
- **Status**: Accepted
- **Context**: LifeOS aims to be privacy-first and usable without internet connectivity.
- **Decision**: Web clients utilize browser `localStorage` as the primary operational database, and mobile apps use `AsyncStorage`. An asynchronous sync system connects to Google Drive or the backend server.
- **Consequences**:
  - Immediate loading times and zero latency for user actions.
  - Automatic background sync merges local and remote datasets using timestamps.

---

## ADR 004: Vanilla CSS Over TailwindCSS
- **Date**: 2026-06-12
- **Status**: Accepted
- **Context**: To maintain a classic luxurious design aesthetic with glassmorphism, HSL custom colors, and micro-animations.
- **Decision**: Write modular Vanilla CSS in `index.css` rather than TailwindCSS classes to keep styling highly flexible, maintainable, and clean.
- **Consequences**:
  - Full control over responsive styles and complex transitions.
  - Simpler CSS files without huge bundler overhead.

---

## ADR 005: Custom Context Feedback (No Browser Popups)
- **Date**: 2026-06-13
- **Status**: Accepted
- **Context**: Native browser popups (`alert()` and `confirm()`) look generic, halt Javascript execution, and degrade user experience.
- **Decision**: Implement a custom `FeedbackProvider` in React to handle notifications as inline toasts and glassmorphic modal overlays.
- **Consequences**:
  - User warnings (e.g. deleting steps or resources) feel premium and are visually integrated.
  - Toasts slide in gracefully without blocking browser operations.

---

## ADR 006: Database Leak Protection (AES Column Encryption)
- **Date**: 2026-06-13
- **Status**: Accepted
- **Context**: Journal entries contain private and sensitive user reflections. If the database leaks, this information must not be exposed.
- **Decision**: Implement transparent column-level encryption for journal fields (`wins`, `challenges`, `lessonsLearned`, `gratitude`) using JPA `AttributeConverter` and AES.
- **Consequences**:
  - Data is encrypted in SQL writes and decrypted in reads automatically.
  - Leaked database dumps are useless to attackers since the encryption key is isolated in the server's environment configuration.
  - Backwards compatibility is maintained for pre-existing plain text entries via a graceful fallback.

---

## ADR 007: Performance Optimization (Index Migrations & React Memoization)
- **Date**: 2026-06-13
- **Status**: Accepted
- **Context**: Large sync datasets can cause query delays in the backend and rendering lag on frontend tabs.
- **Decision**:
  1. Add Flyway migration `V5` to automatically index all foreign key columns.
  2. Replace `useEffect` computations in dashboard/analytics tabs with React `useMemo` hooks.
- **Consequences**:
  - SQL joins and sync operations run in logarithmic time instead of performing full table scans.
  - Eliminates double-renders on frontend tab navigation, resulting in instant client redraws.
