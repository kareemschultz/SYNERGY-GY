# Contributing to GK-Nexus

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `bun install`
4. Copy `.env.example` to `.env` and configure
5. Start development: `bun run dev`

## Development Workflow

### Branch Naming

- `feature/issue-number-description`
- `fix/issue-number-description`
- `docs/description`

### Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

### Code Style

- Run `npx ultracite fix` before committing
- TypeScript strict mode
- React functional components
- Explicit types for function parameters

### Pull Requests

1. Create PR against `master`
2. Fill out PR template
3. Link related issue
4. Wait for review

## Project Structure

```
apps/
  web/        # React frontend
  server/     # Hono backend
  docs/       # Documentation site
packages/
  api/        # oRPC routers
  auth/       # Authentication
  db/         # Database schema
specs/        # Specifications
```

## Testing

- Run tests: `bun test`
- API tests in `packages/api/__tests__/`
- Component tests in `apps/web/__tests__/`

## Need Help?

- Check existing issues
- Read the specs in `/specs/`
- Ask in discussions
