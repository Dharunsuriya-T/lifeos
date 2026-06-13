# LifeOS Architecture Specification

This document details the software architecture, database design, technology integrations, and security models of the LifeOS personal execution platform.

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           React Web Client (Vite)           │
│       Runs offline-first (localStorage)     │
└──────────────┬──────────────────────────────┘
               │ API Sync / Google Drive Sync
               ▼
┌─────────────────────────────────────────────┐
│       Spring Boot 3.5 API (Java 21)         │
│   Manages JWT Auth & Transparent Encryption  │
└──────────────┬──────────────────────────────┘
               │ JPA/Hibernate (Flyway)
               ▼
┌─────────────────────────────────────────────┐
│          PostgreSQL Database Server         │
│   Foreign Key Indexes & Encrypted Columns   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         React Native App (Expo)             │
│    Local SQLite / AsyncStorage Cache        │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend API
- **Java 21 & Spring Boot 3.5.x** — Application server.
- **Spring Security & JWT** — Authentication, authorization, and secure endpoints.
- **Spring Data JPA & Hibernate** — Object Relational Mapping (ORM) layer.
- **Flyway** — Database migrations and schema version controls.
- **PostgreSQL** — Production database database.
- **Maven** — Dependency manager.

### Frontend Web
- **React 19 & TypeScript** — Frontend UI library.
- **Vite** — Fast dev server and client builder.
- **Vanilla CSS** — Custom styling (Outfit display font, glassmorphism card variables, responsive styling).
- **Google OAuth** — Integration for "Continue with Google" sign-in.
- **React Hook Form** — Form validations.

### Mobile Application
- **React Native & Expo 51** — Cross-platform mobile client.
- **AsyncStorage** — Client-side offline cache database.

---

## 🔒 Security & Privacy Model

### 1. Database Column-Level Encryption (Journal Protection)
To ensure that private journal records are not readable if the database gets compromised, we employ transparent AES encryption:
- **JPA CryptoConverter**: Intercepts JPA transactions on `Journal` entity fields (`wins`, `challenges`, `lessonsLearned`, `gratitude`).
- **AES-128 Encryption**: Uses Advanced Encryption Standard (AES) with key sizes specified in properties.
- **Backwards Compatibility**: Built-in decryption failure catch-blocks fallback to plain text. This allows seamless transitions for legacy databases.

### 2. JWT Tokens & Refresh Token Rotation
- **Stateless Sessions**: Authentication is verified using JWT tokens (expiration: 15 minutes).
- **Refresh Tokens**: Stored securely in the database, verifying sessions and refreshing JWT tokens silently.

---

## ⚡ Performance Optimization Design

### 1. Database Indexing
Flyway schema migration `V5` creates database indexes on all foreign key columns. This ensures that:
- Deletions cascade quickly.
- Join queries by `user_id`, `goal_id`, or `project_id` execute in logarithmic time, speeding up synchronization.

### 2. Memoized Client-side Calculations
To resolve lag when switching dashboard tabs, the application calculates Growth scores, journal streaks, and goal compliance ratios using `useMemo` hooks. This ensures calculation is performed exactly once when data changes, eliminating React double-renders.

---

## 🗄️ Database Schema Migration Plan

- **V1__initial_schema**: Initial schema.
- **V2__create_users_table**: Introduces users mapping table.
- **V3__create_refresh_tokens_table**: Implements JWT refresh rotation keys.
- **V4__create_lifeos_core_schema**: Establishes core tables (goals, roadmaps, roadmap_nodes, tasks, habits, habit_logs, journals, learning_items, projects, notes).
- **V5__add_performance_indexes**: Indexes all foreign keys to optimize query, join, and sync responses.
