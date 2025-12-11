# GK-Nexus

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-ff6b35?logo=hono&logoColor=white)](https://hono.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

**GK-Nexus** is a comprehensive business management platform designed specifically for **Gaskin Ceres Management Consultancy (GCMC)** and **K.A. Juman-Yassin & Associates (KAJ)** in Guyana. The platform streamlines client management, matter tracking, document handling, and deadline monitoring, providing a centralized solution for professional services firms.

Built as a modern, type-safe monorepo application, GK-Nexus combines the power of React, TanStack Router, Hono, and PostgreSQL to deliver a robust, scalable solution for managing complex business operations.

## Features

- 👥 **Client Management** - Comprehensive client profiles with contact information, classification, and relationship tracking
- 📋 **Matter Tracking** - Organize and monitor cases, projects, and client engagements with detailed status tracking
- 📄 **Document Management** - Centralized document storage with categorization, version control, and secure access
- 📅 **Deadline Calendar** - Never miss important dates with integrated deadline tracking and notifications
- 📊 **Dashboard** - Real-time insights into active matters, upcoming deadlines, and recent activities
- 🔐 **Role-based Access Control** - Secure authentication and authorization with Better-Auth integration

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19, TanStack Router, TailwindCSS, shadcn/ui |
| **Backend** | Hono, oRPC (type-safe APIs) |
| **Database** | PostgreSQL 17 |
| **Authentication** | Better-Auth |
| **ORM** | Drizzle |
| **Runtime** | Bun |
| **Monorepo** | Turborepo |
| **Code Quality** | Ultracite (Biome), Husky |
| **Additional** | PWA Support, Tauri Desktop, Starlight Docs |

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (or use Bun runtime)
- **Bun** 1.0+ - [Install Bun](https://bun.sh/)
- **PostgreSQL** 17+ - [Install PostgreSQL](https://www.postgresql.org/download/)
- **Git** - For version control

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/SYNERGY-GY.git
cd SYNERGY-GY
```

2. **Install dependencies**

```bash
bun install
```

### Environment Setup

1. **Create environment files**

   Create a `.env` file in `apps/server/` directory:

```bash
cp apps/server/.env.example apps/server/.env
```

2. **Configure environment variables**

   Edit `apps/server/.env` with your PostgreSQL connection details:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/gk_nexus

# Better-Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Server
PORT=3000
NODE_ENV=development
```

### Database Setup

1. **Start PostgreSQL** (ensure your PostgreSQL server is running)

2. **Create the database**

```bash
createdb gk_nexus
```

3. **Push schema to database**

```bash
bun run db:push
```

4. **(Optional) Seed the database with sample data**

```bash
bun run db:seed
```

5. **Open Drizzle Studio to view your database**

```bash
bun run db:studio
```

### Running the Development Server

Start all applications (web, server, and docs):

```bash
bun run dev
```

Or start individual applications:

```bash
# Frontend only
bun run dev:web

# Backend only
bun run dev:server

# Documentation site only
cd apps/docs && bun run dev
```

**Access the applications:**

- 🌐 **Web Application**: [http://localhost:3001](http://localhost:3001)
- 🔌 **API Server**: [http://localhost:3000](http://localhost:3000)
- 📚 **Documentation**: [http://localhost:4321](http://localhost:4321)

### Building for Production

```bash
# Build all applications
bun run build

# Type check all applications
bun run check-types

# Run code quality checks
npx ultracite check
```

## Project Structure

This is a **Turborepo monorepo** with the following structure:

```
SYNERGY-GY/
├── apps/
│   ├── web/              # Frontend React application
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── routes/      # TanStack Router pages
│   │   │   ├── lib/         # Utilities and helpers
│   │   │   └── utils/       # API client setup
│   │   └── package.json
│   │
│   ├── server/           # Hono backend server
│   │   ├── src/
│   │   │   ├── index.ts     # Server entry point
│   │   │   └── lib/         # Server utilities
│   │   └── package.json
│   │
│   └── docs/             # Starlight documentation site
│       ├── src/
│       │   └── content/     # Markdown documentation
│       └── package.json
│
├── packages/
│   ├── api/              # oRPC API definitions & routers
│   │   ├── src/
│   │   │   ├── routers/     # API route handlers
│   │   │   ├── context.ts   # Request context
│   │   │   └── index.ts     # API exports
│   │   └── package.json
│   │
│   ├── auth/             # Better-Auth configuration
│   │   ├── src/
│   │   │   └── index.ts     # Auth setup
│   │   └── package.json
│   │
│   ├── db/               # Drizzle ORM & database schema
│   │   ├── src/
│   │   │   ├── schema/      # Database tables
│   │   │   ├── index.ts     # DB exports
│   │   │   └── seed.ts      # Sample data
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   └── config/           # Shared configurations
│       ├── tsconfig.base.json
│       └── package.json
│
├── specs/                # Technical specifications & docs
├── .claude/              # Claude AI agent configuration
├── turbo.json            # Turborepo configuration
├── biome.json            # Biome linter/formatter config
└── package.json          # Root package configuration
```

## Documentation

- 📋 **[Technical Specifications](/specs/)** - Detailed architecture and implementation specs
- 🐛 **[GitHub Issues](https://github.com/yourusername/SYNERGY-GY/issues)** - Bug reports and feature requests
- 📝 **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- 🚀 **[GITHUB.md](GITHUB.md)** - GitHub workflow and contribution guidelines

## Available Scripts

### Root Level

- `bun run dev` - Start all applications in development mode
- `bun run build` - Build all applications for production
- `bun run check-types` - Type check across all packages
- `bun run check` - Run Biome linting and formatting checks
- `npx ultracite fix` - Auto-fix linting and formatting issues

### Database Commands

Run from root or server workspace:

- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open Drizzle Studio (database GUI)
- `bun run db:generate` - Generate Drizzle migration files
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed database with sample data

### Application-Specific

```bash
# Web app
cd apps/web
bun run dev              # Start web dev server
bun run build            # Build for production
bun run desktop:dev      # Start Tauri desktop app
bun run desktop:build    # Build Tauri desktop app
bun run generate-pwa-assets  # Generate PWA icons

# Documentation
cd apps/docs
bun run dev              # Start docs dev server
bun run build            # Build documentation
```

## Contributing

We welcome contributions to GK-Nexus! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the code standards
4. **Run code quality checks** (`npx ultracite fix`)
5. **Commit your changes** with conventional commits
6. **Push to your branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Standards

This project uses **Ultracite** for code quality enforcement:

- Run `npx ultracite fix` before committing
- All code must pass TypeScript type checking
- Follow the guidelines in [CLAUDE.md](/CLAUDE.md)
- Write meaningful commit messages

### Development Workflow

1. Create an issue for bugs or feature requests
2. Reference the issue in your commits
3. Ensure all tests pass (when implemented)
4. Update documentation as needed
5. Request review from maintainers

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**Built with** ❤️ **by the GCMC/KAJ team using [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)**

For questions or support, please [open an issue](https://github.com/yourusername/SYNERGY-GY/issues) or contact the development team.
