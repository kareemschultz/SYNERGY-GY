<div align="center">

# 🚀 GK-Nexus

**Modern Business Management Platform for Professional Services**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-ff6b35?logo=hono&logoColor=white)](https://hono.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Bun](https://img.shields.io/badge/Bun-1.2-black?logo=bun&logoColor=white)](https://bun.sh/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

**Developed by:** [Kareem Schultz](https://github.com/kareemschultz) | [Karetech Solutions](https://karetech.solutions)

[Features](#-features) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Tech Stack](#-tech-stack) •
[Deployment](#-deployment) •
[Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**GK-Nexus** is a comprehensive business management platform designed specifically for **Green Crescent Management Consultancy (GCMC)** and **Kareem Abdul-Jabar Tax & Accounting Services (KAJ)** in Guyana. The platform streamlines client management, matter tracking, document handling, invoicing, and deadline monitoring, providing a centralized solution for professional services firms.

### 🏢 Built For

- **GCMC**: Training, consulting, paralegal services, immigration, business development
- **KAJ**: Tax compliance, accounting, NIS services, auditing

### 🎨 Design Philosophy

> ⚠️ **NO MOCK DATA POLICY**: This project does not use mock data, seed scripts, or placeholder content. All data is created by users through the application interface. Empty states are designed for zero-data scenarios to ensure data integrity and prevent confusion between test/production data.

Built as a modern, type-safe monorepo application, GK-Nexus combines the power of React 19, TanStack Router, Hono, and PostgreSQL to deliver a robust, scalable solution for managing complex business operations.

---

## ✨ Features

### 🎉 Phase 1: Core Platform ✅ COMPLETE

- **👥 Client Management**
  - Comprehensive client profiles with contact information
  - Client classification (Individual, Corporate, Government, NGO)
  - Relationship tracking and service history
  - Advanced search and filtering

- **📋 Matter Tracking**
  - Organize cases, projects, and client engagements
  - Status workflow (Open → In Progress → Under Review → Completed/Closed)
  - Assign staff and track progress
  - Link related documents and invoices

- **📄 Document Management**
  - Centralized document storage with categorization
  - Support for multiple file types (PDF, DOCX, images, etc.)
  - Secure access control
  - Document metadata and versioning

- **📅 Deadline Calendar**
  - Never miss important dates
  - Integrated deadline tracking
  - Email notifications (optional)
  - Calendar view with filtering

- **📊 Dashboard**
  - Real-time insights into active matters
  - Upcoming deadlines overview
  - Recent activities feed
  - Key performance metrics

- **🔐 Role-Based Access Control**
  - Secure authentication with Better-Auth
  - 7 role types: Owner, Managers (GCMC/KAJ), Staff, Receptionist
  - Business-specific access (GCMC-only, KAJ-only, Both)
  - Session management and security

### 🚀 Phase 2: Enhanced Features ✅ COMPLETE

- **👤 Admin Panel** - Staff management, user roles, system configuration
- **🌐 Client Portal** - Self-service portal for clients to view matters and documents
- **⚙️ Settings Page** - Application configuration and preferences
- **💰 Service Catalog** - GCMC and KAJ service offerings with pricing
- **🧾 Invoice Generation** - Create professional invoices with PDF export
- **📚 Training Management** - Course schedules, enrollment tracking, certificates
- **📅 Appointment Scheduling** - Booking system with availability management
- **🧮 Tax Calculators** - PAYE, VAT, NIS calculations for Guyana

### 🔮 Phase 3: External Integrations 📅 FUTURE

- **📧 Email Integration** ✅ - Resend transactional emails (complete, moved to Phase 2)
- **📊 Reporting & Analytics** ✅ - Business reports with PDF/Excel export (complete, moved to Phase 2)
- **💬 WhatsApp Integration** 📅 - Client messaging (Planned)
- **🏛️ GRA Integration** 📅 - Guyana Revenue Authority workflows (Planned)
- **🏛️ NIS Integration** 📅 - National Insurance Scheme automation (Planned)

---

## 📸 Screenshots

> 🎨 **Coming Soon**: Screenshots of Dashboard, Client Management, Invoicing, and Client Portal

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%">

### Frontend
- **React 19** - Latest React with Server Components
- **TanStack Router** - Type-safe routing
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **TanStack Query** - Data fetching & caching
- **Vite** - Lightning-fast build tool

</td>
<td width="50%">

### Backend
- **Hono** - Ultrafast web framework
- **oRPC** - Type-safe RPC for APIs
- **Drizzle ORM** - Type-safe database toolkit
- **Better-Auth** - Modern authentication
- **PostgreSQL 17** - Reliable database
- **Bun** - Fast JavaScript runtime

</td>
</tr>
<tr>
<td width="50%">

### DevOps
- **Docker** - 180MB production image
- **Turborepo** - High-performance monorepo
- **Ultracite** - Code quality (Biome-based)
- **Husky** - Git hooks

</td>
<td width="50%">

### Additional
- **PWA** - Progressive Web App support
- **Tauri** - Desktop app (optional)
- **Starlight** - Documentation site
- **Playwright** - E2E testing

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh/)** 1.0+ (recommended) or Node.js 18+
- **[PostgreSQL](https://www.postgresql.org/download/)** 17+
- **[Git](https://git-scm.com/)** - Version control
- **[Docker](https://www.docker.com/)** (optional) - For containerized deployment

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/kareemschultz/SYNERGY-GY.git
cd SYNERGY-GY
```

2. **Install dependencies**

```bash
bun install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. **Run database migrations**

```bash
bun run db:push
```

5. **Start development servers**

```bash
# Start both frontend and backend
bun run dev

# Or start individually:
bun run dev:web    # Frontend on http://localhost:3001
bun run dev:server # Backend on http://localhost:3000
```

6. **Create your first admin account**

Visit `http://localhost:3001/login` and sign up. The first user becomes the Owner.

### Docker Deployment

For production-ready containerized deployment (180MB image):

1. **Copy and configure environment**

```bash
cp .env.example .env
# Edit .env with production values
```

2. **Run database migrations**

```bash
DATABASE_URL="your_connection_string" bun run db:push
```

3. **Build and start services**

```bash
docker compose up -d
```

4. **Verify health**

```bash
curl http://localhost:3000/health
# {"status":"healthy","timestamp":"..."}
```

See **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** for comprehensive deployment guide.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Complete deployment guide (Docker, CI/CD, production) |
| **[DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)** | Docker-specific deployment instructions |
| **[SECURITY.md](SECURITY.md)** | Security policies and vulnerability reporting |
| **[CHANGELOG.md](CHANGELOG.md)** | Detailed changelog following Keep a Changelog |
| **[CLAUDE.md](CLAUDE.md)** | Instructions for AI-assisted development |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Contribution guidelines |
| **[specs/](specs/)** | Technical specifications and feature docs |

---

## 📁 Project Structure

```
SYNERGY-GY/
├── apps/
│   ├── web/              # React 19 frontend (Vite + TanStack Router)
│   ├── server/           # Hono backend (Bun runtime)
│   └── docs/             # Starlight documentation site
├── packages/
│   ├── api/              # oRPC routers and procedures
│   ├── auth/             # Better-Auth configuration
│   ├── db/               # Drizzle schema and migrations
│   └── config/           # Shared configuration
├── docs/                 # Documentation (deployment, security, etc.)
├── specs/                # Technical specifications
├── Dockerfile            # Production Docker image (180MB bundled)
├── docker-compose.yml    # Production Docker Compose
└── .env.example          # Environment variable template
```

---

## 💻 Development

### Common Commands

```bash
# Development
bun run dev              # Start all apps
bun run dev:web          # Frontend only
bun run dev:server       # Backend only

# Database
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio GUI
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations

# Code Quality
npx ultracite fix        # Auto-fix linting/formatting
npx ultracite check      # Check for issues
bun run check-types      # TypeScript type checking

# Testing
bun run test:e2e         # Run E2E tests
bunx playwright test --ui # Playwright UI mode

# Docker
docker compose up -d     # Start production stack
docker compose logs -f   # View logs
docker compose down      # Stop services
```

### Development Workflow

1. **Create a feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** and test locally
3. **Run code quality checks**: `npx ultracite fix`
4. **Update CHANGELOG.md** under `[Unreleased]`
5. **Commit with conventional commits**: `feat(scope): description`
6. **Push and create PR**

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines.

---

## 🐳 Deployment

### Production Docker Image

GK-Nexus uses a **bundled production deployment** for optimal performance:

- **Image Size**: 180MB (75% smaller than unbundled)
- **Build Time**: ~3 minutes (with cache)
- **Startup Time**: ~15 seconds
- **Memory Usage**: ~200MB

### Deployment Options

1. **Docker Compose** (Recommended)
   ```bash
   docker compose up -d
   ```

2. **Kubernetes/Docker Swarm** - See [DEPLOYMENT.md](docs/DEPLOYMENT.md)

3. **Cloud Platforms**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

### CI/CD

Automated deployment pipeline with GitHub Actions:
- ✅ Lint and type checking
- ✅ E2E tests
- ✅ Docker build and push to GHCR
- ✅ Automated deployment to production

See **[.github/workflows/](.github/workflows/)** for CI/CD configuration.

---

## 🔒 Security

### Security Features

- ✅ **Non-root containers** - All Docker containers run as non-root user
- ✅ **Read-only filesystem** - Containers use read-only FS with tmpfs mounts
- ✅ **Dropped capabilities** - ALL capabilities dropped, only NET_BIND_SERVICE added
- ✅ **no-new-privileges** - Prevents privilege escalation
- ✅ **Better-Auth** - Modern, secure authentication
- ✅ **CORS protection** - Configurable CORS origins
- ✅ **SQL injection prevention** - Parameterized queries with Drizzle ORM
- ✅ **XSS protection** - Input sanitization and CSP headers

### Vulnerability Reporting

Found a security vulnerability? Please report it responsibly.

See **[SECURITY.md](SECURITY.md)** for reporting guidelines.

---

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code contributions.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'feat: add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines.

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📄 License

**Proprietary** - © 2024 Green Crescent Management Consultancy & Kareem Abdul-Jabar Tax & Accounting Services

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🙏 Acknowledgments

- Built with ❤️ by [Kareem Schultz](https://github.com/kareemschultz)
- Powered by [Bun](https://bun.sh/), [React](https://react.dev/), [Hono](https://hono.dev/), and [PostgreSQL](https://www.postgresql.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📞 Support

For support and inquiries:

- **Email**: [support@karetech.solutions](mailto:support@karetech.solutions)
- **GitHub Issues**: [Create an issue](https://github.com/kareemschultz/SYNERGY-GY/issues)
- **Documentation**: [docs/](docs/)

---

<div align="center">

**[⬆ back to top](#-gk-nexus)**

Made with 🚀 by [Karetech Solutions](https://karetech.solutions)

</div>
