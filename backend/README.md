# LifeOS Backend API Service

A robust, secure, and privacy-first REST API built using **Spring Boot 3.5.x** and **Java 21**. It manages user workspaces, authorization, daily reflection logging, habit streaks, goals roadmaps, and full data synchronization across web and mobile clients.

---

## 🎯 Architecture & Technology Stack

- **Java 21 & Spring Boot 3.5** — Core runtime and application framework
- **Spring Security & JWT** — Token-based security and CORS handling
- **Spring Data JPA & Hibernate** — Database Object-Relational Mapping (ORM)
- **Flyway** — Automated database migrations version control
- **PostgreSQL / H2** — Production and development databases

---

## 🔒 Security & Privacy: Database Leak Protection

To maintain high data privacy for user journal entries (which contain personal reflections, gratitude lists, wins, challenges, and lessons learned), the backend implements **transparent column-level encryption** at the database layer.

### How it Works
1. **AES Encryption**: The system uses Advanced Encryption Standard (AES) in ECB mode with PKCS5Padding.
2. **Dynamic Key Management**: The secret key is loaded from the `lifeos.encryption.key` application property. Storing the key in the server's environment config prevents exposure if only the database is dumped or leaked.
3. **Transparent Conversions**: The entity class attributes use `@Convert(converter = CryptoConverter.class)` annotations. Hibernate automatically encrypts fields on SQL writes and decrypts them on SQL reads.
4. **Seamless Upgrades**: The converter includes a decryption fallback that returns the raw text on cipher exceptions. This allows pre-existing unencrypted database records to be read seamlessly and automatically encrypted when next saved/updated.

---

## ⚡ Performance Optimizations

To handle high-frequency synchronization requests from web and mobile clients, the database features **Flyway Migration V5**:
- **Foreign Key Indexing**: Automatically indexes all foreign key columns (e.g. `goals(user_id)`, `tasks(goal_id)`, `notes(task_id)`). This eliminates full table scans during joins and makes sync/retrieve operations extremely fast.

---

## 📂 Packages Structure

```
com.lifeos.backend/
├── auth/             # Controller for Login, Registration, and Google Sign-in
├── user/             # User profiles, repositories, and services
├── security/         # JWT filter, access/refresh token handlers, and Google token verifier
├── config/           # CORS settings, Spring Security beans, and Encryption configurations
├── common/           # Mapped superclass (BaseEntity), CryptoUtils, and CryptoConverter
├── journal/          # Journal entity (encrypted), repository, and reflection statistics
├── sync/             # Full data sync service merging local and remote data models
└── [domain]/         # Roadmaps, goals, tasks, projects, habits, and learning items
```

---

## 🚀 Running Locally

1. **Configure Environment Variables**:
   Create a local configuration or add environment variables:
   ```bash
   PORT=8081
   DB_URL=jdbc:postgresql://localhost:5432/lifeos
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_base64_encoded_jwt_signing_key
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   LIFEOS_ENCRYPTION_KEY=LifeOSSecretKey12  # Must be 16, 24, or 32 characters
   ```

2. **Build and Run**:
   Execute the Maven wrapper to build and run:
   ```bash
   # On Windows (PowerShell)
   .\mvnw.cmd spring-boot:run

   # On Linux/macOS
   ./mvnw spring-boot:run
   ```
