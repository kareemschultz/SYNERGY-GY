# Contributing to GK-Nexus

Thank you for your interest in contributing to GK-Nexus! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to:

- Be respectful and professional
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other community members

Unacceptable behavior includes:
- Harassment, discrimination, or offensive comments
- Trolling, insulting remarks, or personal attacks
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

Violations can be reported to support@karetech.solutions.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh/)** 1.0+ (recommended) or Node.js 18+
- **[PostgreSQL](https://www.postgresql.org/)** 17+
- **[Git](https://git-scm.com/)** - Version control
- **Code Editor** - VS Code recommended with TypeScript support

### Initial Setup

1. **Fork the repository**

   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/SYNERGY-GY.git
   cd SYNERGY-GY
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/kareemschultz/SYNERGY-GY.git
   ```

4. **Install dependencies**

   ```bash
   bun install
   ```

5. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

6. **Run database migrations**

   ```bash
   bun run db:push
   ```

7. **Start development servers**

   ```bash
   # Start both frontend and backend
   bun run dev

   # Or start individually:
   bun run dev:web    # Frontend on http://localhost:3001
   bun run dev:server # Backend on http://localhost:3000
   ```

8. **Create your first admin account**

   Visit `http://localhost:3001/login` and sign up. The first user becomes the Owner.

## 💻 Development Workflow

### 1. Create an Issue

Before starting work, create or find an existing issue:

- Check if an issue already exists for your idea
- If not, create a new issue with:
  - Clear title describing the change
  - Detailed description of the problem or feature
  - Steps to reproduce (for bugs)
  - Expected vs actual behavior
  - Screenshots or examples (if applicable)

### 2. Create a Branch

Create a feature branch from `master`:

```bash
# Update your local master
git checkout master
git pull upstream master

# Create and switch to a new branch
git checkout -b feature/issue-number-short-description

# Or for bug fixes:
git checkout -b fix/issue-number-short-description
```

**Branch naming conventions:**
- `feature/123-add-dark-mode` - New features
- `fix/124-resolve-login-bug` - Bug fixes
- `docs/update-readme` - Documentation only
- `refactor/improve-api-structure` - Code refactoring
- `test/add-e2e-tests` - Test additions

### 3. Make Your Changes

Follow these guidelines while coding:

- **Write clean, readable code** - Code is read more than written
- **Keep changes focused** - One feature/fix per branch
- **Comment complex logic** - Explain WHY, not WHAT
- **Follow existing patterns** - Match the codebase style
- **Run code quality checks** - Use `npx ultracite fix` frequently

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
<type>(<scope>): <description> (#issue-number)

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (no functional changes)
- `refactor` - Code restructuring (no functional changes)
- `test` - Adding or updating tests
- `chore` - Maintenance tasks (dependencies, build config)
- `perf` - Performance improvements
- `ci` - CI/CD changes

**Examples:**
```bash
git commit -m "feat(clients): add bulk import functionality (#45)"
git commit -m "fix(portal): resolve session timeout issue (#52)"
git commit -m "docs(specs): update client portal implementation status"
git commit -m "refactor(api): simplify matter creation procedure (#60)"
```

### 5. Update CHANGELOG.md

**Every functional change must update CHANGELOG.md:**

Add your changes under the `[Unreleased]` section:

```markdown
## [Unreleased]

### Added
- Bulk import for clients (#45)

### Fixed
- Session timeout in client portal (#52)

### Changed
- Simplified matter creation API (#60)
```

### 6. Push to Your Fork

```bash
git push origin feature/123-add-dark-mode
```

### 7. Create a Pull Request

See [Pull Request Process](#pull-request-process) below.

## 📏 Code Standards

### TypeScript Guidelines

- **No `any` types** - Use `unknown` for genuinely unknown types
- **Explicit types** for function parameters and return values
- **Type narrowing** instead of type assertions
- **Const assertions** for immutable values: `as const`
- **Meaningful names** instead of magic numbers

### React Best Practices

- **Function components only** - No class components
- **Hooks at top level** - Never conditionally call hooks
- **Dependency arrays** - Specify all dependencies correctly
- **Key props** - Use unique IDs, not array indices
- **Semantic HTML** - Use proper elements (`<button>`, `<nav>`, etc.)
- **Accessibility** - Include ARIA attributes and alt text

### API Development (oRPC)

- **Input validation** - Use Zod schemas for all inputs
- **Error handling** - Throw descriptive errors with status codes
- **Authorization checks** - Use appropriate procedures (staffProcedure, adminProcedure)
- **Transaction safety** - Wrap multiple DB operations in transactions
- **Activity logging** - Log important actions to activity table

### Database Schema (Drizzle)

- **Soft deletes** - Use `status` or `archivedAt` instead of DELETE
- **Audit fields** - Include `createdAt`, `updatedAt`, `createdById`
- **Indexes** - Add indexes for frequently queried columns
- **Foreign keys** - Use `.references()` for relationships
- **Migrations** - Use `bun run db:generate` to create migration files

### Code Quality Tools

Run these before committing:

```bash
# Auto-fix linting and formatting
npx ultracite fix

# Type checking
bun run check-types

# Run tests
bun run test:e2e
```

## 🧪 Testing Guidelines

### Test Coverage Requirements

- **New features** must include tests
- **Bug fixes** should include regression tests
- **API endpoints** require integration tests
- **UI components** benefit from E2E tests

### Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with Playwright UI
bunx playwright test --ui

# Run specific test file
bunx playwright test apps/web/e2e/login.spec.ts

# Debug mode
bunx playwright test --debug
```

### Writing Tests

**Test file naming:**
- `*.spec.ts` for E2E tests
- `*.test.ts` for unit tests

**Example E2E test:**
```typescript
import { test, expect } from '@playwright/test';

test('user can create a new client', async ({ page }) => {
  await page.goto('http://localhost:3001/login');

  // Login
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to clients
  await page.click('a[href="/app/clients"]');
  await expect(page).toHaveURL(/.*\/app\/clients/);

  // Create client
  await page.click('button:has-text("Add Client")');
  await page.fill('input[name="name"]', 'Test Client');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button:has-text("Save")');

  // Verify success
  await expect(page.locator('text=Test Client')).toBeVisible();
});
```

## 📚 Documentation

### Required Documentation Updates

When making changes, update the following as applicable:

1. **Code comments** - Complex logic should be explained
2. **CHANGELOG.md** - Every functional change
3. **README.md** - New features, setup changes, or major updates
4. **`/specs/`** - Feature specifications and implementation status
5. **CLAUDE.md** - AI assistant instructions (if workflow changes)
6. **SECURITY.md** - Security-related changes

### Specification Documents

Feature specifications live in `/specs/`:

```
specs/
  phase-1/          # Core platform features
  phase-2/          # Enhanced features
  phase-3/          # Integrations
  implementations/  # Implementation logs
  business-rules/   # GCMC and KAJ service details
```

When implementing a feature from specs:
1. Read the spec document thoroughly
2. Mark tasks as complete in the spec as you finish them
3. Document any deviations from the original spec
4. Create an implementation summary in `/specs/implementations/`

## 🔄 Pull Request Process

### Before Creating a PR

- [ ] Run `npx ultracite fix` to fix linting/formatting
- [ ] Run `bun run check-types` to verify TypeScript
- [ ] Update CHANGELOG.md under `[Unreleased]`
- [ ] Add/update tests if applicable
- [ ] Test your changes locally
- [ ] Update documentation if needed
- [ ] Rebase on latest `master` if needed

### Creating the PR

1. **Push your branch** to your fork
2. **Navigate** to the original repository
3. **Click** "New Pull Request"
4. **Select** your branch
5. **Fill out** the PR template:
   - Title: Same as commit message format
   - Description: Explain what and why
   - Link related issue(s)
   - Add screenshots/videos for UI changes
   - List breaking changes if any

### PR Review Process

1. **Automated checks** run (linting, type checking, tests)
2. **Code review** by maintainers
3. **Address feedback** - Push new commits to your branch
4. **Approval** - Once approved, your PR will be merged
5. **Merge** - Maintainers will merge using "Squash and Merge"

### After Your PR is Merged

1. **Delete your branch** (optional but recommended)
2. **Update your local master**:
   ```bash
   git checkout master
   git pull upstream master
   ```
3. **Celebrate!** 🎉 Your contribution is now part of GK-Nexus

## 📝 Issue Guidelines

### Reporting Bugs

When reporting bugs, include:

- **Description** - Clear summary of the issue
- **Steps to Reproduce** - Detailed steps to recreate
- **Expected Behavior** - What should happen
- **Actual Behavior** - What actually happens
- **Screenshots** - If applicable
- **Environment**:
  - Bun version (`bun --version`)
  - PostgreSQL version
  - Operating system
  - Browser (for frontend issues)

### Requesting Features

When requesting features, include:

- **Problem Statement** - What problem does this solve?
- **Proposed Solution** - How should it work?
- **Alternatives** - Other approaches considered
- **Additional Context** - Business justification, mockups, examples
- **Scope** - Is this GCMC-specific, KAJ-specific, or both?

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - Urgent issues
- `gcmc` - GCMC-specific
- `kaj` - KAJ-specific

## 👥 Community

### Getting Help

- **GitHub Discussions** - Ask questions, share ideas
- **GitHub Issues** - Report bugs, request features
- **Email** - support@karetech.solutions

### Recognition

Contributors are acknowledged in:
- CHANGELOG.md (linked to GitHub profile)
- GitHub Contributors graph
- Special recognition for significant contributions

### Stay Updated

- **Watch the repository** - Get notifications for new issues/PRs
- **Star the repository** - Show your support
- **Follow on GitHub** - Stay connected with project updates

## 🙏 Thank You!

Every contribution, no matter how small, makes GK-Nexus better. Whether you're:

- Fixing a typo in documentation
- Reporting a bug
- Suggesting a feature
- Submitting a pull request
- Helping others in discussions

**Your efforts are appreciated!**

---

<div align="center">

**Questions?** Open a [GitHub Discussion](https://github.com/kareemschultz/SYNERGY-GY/discussions) or email support@karetech.solutions

Made with ❤️ by the GK-Nexus community

</div>
