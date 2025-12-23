# SYNERGY-GY Development Rules

> **STRICT RULES** - These rules are mandatory and must be followed for every change.

## 1. Change Tracking (MANDATORY)

### Every Code Change MUST:
1. **Reference a GitHub Issue** - No changes without an issue number
2. **Update CHANGELOG.md** - Add entry under [Unreleased] section
3. **Follow Conventional Commits** - `type(scope): description (#issue)`

### Commit Format:
```
feat(clients): add bulk import functionality (#25)
fix(deadlines): correct timezone calculation (#30)
docs(api): update endpoint documentation (#32)
chore(deps): update dependencies (#40)
refactor(auth): improve session handling (#45)
```

### Commit Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD pipeline changes

### Before Merging:
- [ ] GitHub issue linked
- [ ] CHANGELOG.md updated
- [ ] All tests pass
- [ ] Code reviewed
- [ ] No merge conflicts

## 2. Documentation (MANDATORY)

### When Adding Features:
- [ ] Update relevant spec in `/specs/`
- [ ] Add/update API documentation
- [ ] Update README if user-facing
- [ ] Add JSDoc comments to exported functions
- [ ] Update TypeScript types

### When Fixing Bugs:
- [ ] Document root cause in issue
- [ ] Add test case to prevent regression
- [ ] Update CHANGELOG.md
- [ ] Add inline comments explaining the fix

### Documentation Standards:
- Write clear, concise descriptions
- Include code examples where applicable
- Keep documentation in sync with code
- Use proper markdown formatting

## 3. GitHub Integration (MANDATORY)

### Issue Workflow:
1. Create issue BEFORE starting work
2. Assign yourself to issue
3. Add appropriate labels (bug, feature, docs, etc.)
4. Create branch: `feature/issue-number-description` or `fix/issue-number-description`
5. Reference issue in all commits: `(#issue)`
6. Create PR linking to issue
7. Close issue via PR merge

### Branch Naming Convention:
```
feature/25-bulk-import
fix/30-timezone-bug
docs/32-api-endpoints
refactor/45-session-handling
```

### PR Requirements:
- [ ] Descriptive title with issue reference
- [ ] Summary of changes
- [ ] Testing instructions
- [ ] Screenshots for UI changes
- [ ] CHANGELOG entry included
- [ ] Related issues linked
- [ ] Reviewers assigned

### PR Template Structure:
```markdown
## Summary
Brief description of changes

Fixes #issue-number

## Changes
- Change 1
- Change 2

## Testing
Steps to test the changes

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Code formatted and linted
```

## 4. Code Quality (MANDATORY)

### Before Every Commit:
```bash
npx ultracite fix     # Format code
npx ultracite check   # Check for issues
bun test              # Run tests
```

### TypeScript Rules:
- No `any` types - use `unknown` if needed
- Explicit return types on exported functions
- No unused variables or imports
- Use strict null checks
- Prefer `const` over `let`, never use `var`
- Use meaningful variable names

### Code Review Standards:
- Maximum function length: 50 lines
- Maximum file length: 300 lines
- Maximum cognitive complexity: 15
- DRY principle: Don't repeat yourself
- SOLID principles for classes and modules

### Naming Conventions:
- Components: PascalCase (`UserProfile.tsx`)
- Functions: camelCase (`getUserData`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- Files: kebab-case for non-components (`user-utils.ts`)
- Database tables: snake_case (`user_sessions`)

## 5. Error Handling (MANDATORY)

### User-Facing Errors MUST:
- Explain WHY the error occurred
- Suggest what user can do to resolve it
- Never show technical stack traces
- Log technical details server-side only
- Use toast notifications for non-critical errors
- Use error boundaries for critical errors

### Error Message Examples:
```typescript
// BAD
throw new Error("Invalid input");

// GOOD
throw new Error("Email address is required. Please enter a valid email.");

// BAD
return { error: "DB error" };

// GOOD
return {
  error: "Unable to save changes. Please try again later.",
  code: "DB_CONNECTION_FAILED" // For logging/debugging
};
```

### API Errors MUST:
- Return appropriate HTTP status codes
- Include error code for client handling
- Provide user-friendly message
- Log stack trace server-side
- Use Zod for validation errors

### HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized)
- 404: Not Found
- 409: Conflict (duplicate, constraint violation)
- 500: Internal Server Error

## 6. UI/UX Standards (MANDATORY)

### Every UI Component MUST:
- Have loading state with skeleton or spinner
- Have error state with helpful message
- Have empty state with call-to-action
- Be keyboard accessible (tab navigation)
- Use consistent icons from Lucide
- Support dark mode via theme provider
- Be responsive (mobile, tablet, desktop)

### State Management:
```typescript
// Component states to handle:
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType[]>([]);

// Show loading state
if (isLoading) return <Skeleton />;

// Show error state
if (error) return <ErrorMessage message={error} />;

// Show empty state
if (data.length === 0) return <EmptyState />;

// Show data
return <DataView data={data} />;
```

### Forms MUST:
- Validate in real-time with Zod
- Show specific field errors below inputs
- Indicate required fields with asterisk (*)
- Provide helpful placeholders
- Disable submit during submission
- Show success feedback after submission
- Clear or reset after successful submission

### Accessibility Requirements:
- All images have alt text
- Form inputs have associated labels
- Buttons have descriptive text or aria-labels
- Proper heading hierarchy (h1 > h2 > h3)
- Keyboard shortcuts documented
- Focus visible on all interactive elements

## 7. Testing (MANDATORY for new features)

### Minimum Requirements:
- **API endpoints**: Integration tests with actual database
- **Business logic**: Unit tests with mocks
- **UI components**: Component tests with user interactions
- **Critical flows**: E2E tests for auth, payment, etc.

### Test File Naming:
```
src/
  components/
    UserProfile.tsx
    UserProfile.test.tsx
  utils/
    validators.ts
    validators.test.ts
```

### Test Coverage:
- Minimum 80% code coverage for new code
- 100% coverage for critical business logic
- All edge cases tested
- Error conditions tested

### Test Structure:
```typescript
describe('UserProfile', () => {
  describe('rendering', () => {
    it('should display user name', () => {});
    it('should show loading state', () => {});
    it('should show error state', () => {});
  });

  describe('interactions', () => {
    it('should submit form on button click', () => {});
    it('should validate required fields', () => {});
  });

  describe('edge cases', () => {
    it('should handle missing data', () => {});
    it('should handle network errors', () => {});
  });
});
```

## 8. Security (MANDATORY)

### Every API Endpoint MUST:
- Validate all inputs with Zod schemas
- Check user authentication
- Check user permissions/authorization
- Log sensitive actions (login, data access, deletions)
- Sanitize outputs to prevent XSS
- Use parameterized queries (Drizzle handles this)

### Input Validation:
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin'])
});

// Validate before processing
const result = createUserSchema.safeParse(input);
if (!result.success) {
  return { error: result.error.issues };
}
```

### Security Checklist:
- [ ] No secrets in code (use environment variables)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] CSRF protection enabled
- [ ] Rate limiting on sensitive endpoints
- [ ] Passwords hashed with bcrypt/argon2
- [ ] Sessions use secure, httpOnly cookies
- [ ] External links use `rel="noopener noreferrer"`

### Sensitive Data Logging:
```typescript
// NEVER log:
- Passwords
- API keys
- Session tokens
- Credit card numbers
- Personal identification numbers

// OK to log:
- User IDs (not emails)
- Action types
- Timestamps
- Request IDs
```

## 9. Database Changes (MANDATORY)

### Schema Changes MUST:
1. Update schema files in `/packages/db/src/schema/`
2. Run `bun run db:generate` to create migration
3. Review generated migration file
4. Test migration locally
5. Test rollback if applicable
6. Document in CHANGELOG.md
7. Update `specs/architecture/database-schema.md`

### Migration Workflow:
```bash
# 1. Update schema file
# Edit packages/db/src/schema/users.ts

# 2. Generate migration
cd packages/db
bun run db:generate

# 3. Apply migration locally
bun run db:migrate

# 4. Verify changes
bun run db:studio

# 5. Test in development environment
# 6. Document changes
```

### Schema Design Rules:
- Use snake_case for table and column names
- Always include `id`, `createdAt`, `updatedAt`
- Use foreign keys with proper constraints
- Add indexes for frequently queried columns
- Use enums for fixed sets of values
- Include NOT NULL constraints where appropriate
- Add CHECK constraints for business rules

### Breaking Changes:
- Never drop columns directly (deprecate first)
- Provide migration path for existing data
- Update seed data if affected
- Notify team before deploying

## 10. Automation Hooks

### Pre-commit (enforced by Husky):
```bash
npx ultracite check   # Lint and format check
tsc --noEmit          # Type check
```

### Pre-push:
```bash
bun test              # All tests must pass
# Check for debugging code
grep -r "console.log" src/
grep -r "debugger" src/
```

### CI/CD Pipeline:
- Lint check
- Type check
- Unit tests
- Integration tests
- Build check
- Deploy to staging (on main branch)

## 11. Performance (MANDATORY)

### Frontend Performance:
- [ ] Lazy load routes and components
- [ ] Optimize images (use WebP, proper sizing)
- [ ] Minimize bundle size (check with `bun run build`)
- [ ] Use React.memo for expensive components
- [ ] Debounce user input for search/filters
- [ ] Cache API responses where appropriate
- [ ] Use virtual scrolling for long lists

### Backend Performance:
- [ ] Add database indexes for queries
- [ ] Use database connection pooling
- [ ] Cache frequently accessed data
- [ ] Paginate large result sets
- [ ] Use SELECT only needed columns
- [ ] Avoid N+1 queries
- [ ] Set appropriate timeout values

### Performance Budgets:
- Initial page load: < 3 seconds
- Route transitions: < 500ms
- API response time: < 200ms (p95)
- Bundle size: < 500KB (gzipped)

## 12. Environment Management

### Environment Variables:
- Never commit `.env` files
- Document all variables in `.env.example`
- Use different values for dev/staging/prod
- Validate required variables at startup

### Environment Files:
```
.env                  # Local development (gitignored)
.env.example          # Template (committed)
.env       # Production (never committed)
.env.test             # Test environment
```

## 13. Dependency Management

### Adding Dependencies:
- [ ] Verify package is actively maintained
- [ ] Check bundle size impact
- [ ] Review security advisories
- [ ] Add to appropriate workspace
- [ ] Document why dependency was added

### Update Process:
```bash
# Update dependencies
bun update

# Test after updates
bun test
bun run dev

# Document in CHANGELOG
```

### Version Pinning:
- Pin major versions for stability
- Use `^` for minor/patch updates
- Review breaking changes before major updates

---

## Quick Checklist

### Before EVERY PR:
- [ ] GitHub issue exists and is linked
- [ ] Branch named correctly (`feature/N-description`)
- [ ] Commits follow conventional format
- [ ] CHANGELOG.md updated
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Code formatted (`npx ultracite fix`)
- [ ] No linting errors (`npx ultracite check`)
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] Self-reviewed all changes
- [ ] Screenshots added for UI changes
- [ ] No console.log or debugger statements
- [ ] Environment variables documented

### Before EVERY Deploy:
- [ ] All tests passing
- [ ] No breaking changes (or documented)
- [ ] Database migrations tested
- [ ] Environment variables set
- [ ] Monitoring/logging configured
- [ ] Rollback plan documented
- [ ] Team notified

---

## Enforcement

**Violation of these rules will result in PR rejection.**

### Severity Levels:
- **Critical**: Security issues, breaking changes without approval
- **High**: Missing tests, undocumented breaking changes
- **Medium**: Style violations, missing documentation
- **Low**: Minor formatting, typos in comments

### Review Process:
1. Automated checks run on PR creation
2. At least one approval required for merge
3. All conversations must be resolved
4. Branch must be up to date with target

---

## Questions?

If you're unsure about any rule:
1. Check existing code for examples
2. Ask in team chat/discussions
3. Create an issue for clarification
4. Document the decision for future reference

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0
