# LifeOS Architecture

## Project Overview

LifeOS is a privacy-first personal life management platform that helps users:

- Capture thoughts quickly
- Organize information
- Manage tasks
- Track goals and milestones
- Measure progress
- Maintain private journals
- Receive reminders

The platform will support:

- Web (React)
- Mobile (React Native)
- Backend API (Spring Boot)
- PostgreSQL Database

---

## Core Philosophy

1. Capture Fast
2. Organize Simply
3. Track Progress
4. Protect Privacy
5. Build For Long-Term Growth

---

## Architecture

React Web
↓
Spring Boot API
↓
PostgreSQL

React Native
↓
Spring Boot API
↓
PostgreSQL

---

## Technology Stack

### Backend

- Java 21
- Spring Boot 3.5.x
- Spring Security
- Spring Data JPA
- Flyway
- PostgreSQL
- Maven

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS

### Mobile

- React Native
- Expo

### Infrastructure

- Docker
- Git
- GitHub

### Deployment

- Render (Backend)
- Vercel (Frontend)

---

## Architectural Decisions

### Decision 001

Use UUIDs instead of auto-increment IDs.

Reason:

- Better security
- Better mobile support
- Better offline-sync support
- Easier distributed systems support

Status: Accepted

---

### Decision 002

Use Flyway for all database schema changes.

Reason:

- Version-controlled database changes
- Safe deployments
- Easier rollback and debugging

Status: Accepted

---

### Decision 003

Use PostgreSQL in Docker for local development.

Reason:

- Consistent environment
- Easy setup
- Easier onboarding
- Production-like workflow

Status: Accepted

---

### Decision 004

Backend-first development approach.

Workflow:

Database
→ Backend
→ Tests
→ Frontend
→ Tests
→ Deployment

Reason:

Frontend should consume stable APIs.

Status: Accepted

---

## Planned V1 Modules

- Authentication
- Goals
- Milestones
- Progress Tracking
- Tasks
- Checklists
- Notes
- Journal
- Reminders
- Dashboard
- Search
- Tags
- Calendar
- Google Login

---

## Future Releases

- AI Roadmap Generation
- Roadmap Sharing
- Offline Synchronization
- Advanced Analytics
- End-to-End Encryption
- Collaboration Features

---

## Current Status

Phase: Foundation Complete

Completed:

- Git Repository
- Docker PostgreSQL
- Spring Boot Setup
- Flyway Setup
- Health Endpoint

Next:

Authentication Module
