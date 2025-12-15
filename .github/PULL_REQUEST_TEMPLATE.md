## Description
Brief description of changes and why they're needed.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Security fix (vulnerability remediation)
- [ ] Performance improvement
- [ ] Database migration

## Related Issue
Closes #(issue number)

**GitHub Issue Required:** All PRs must reference an existing issue. If no issue exists, create one first.

## Checklist

### Code Quality
- [ ] Code follows Ultracite style guidelines (`npx ultracite fix`)
- [ ] TypeScript compiles without errors (`bun run check-types`)
- [ ] No `any` types (use `unknown` for genuinely unknown types)
- [ ] Self-review completed

### Documentation
- [ ] **CHANGELOG.md** updated under `[Unreleased]` section (MANDATORY)
- [ ] Spec files updated (if feature change)
- [ ] API documentation updated (if endpoint changes)
- [ ] README updated (if setup instructions change)

### Testing
- [ ] Manual testing completed
- [ ] Tests added/updated (if applicable)
- [ ] E2E tests pass (`bun run test:e2e`)
- [ ] No regression in existing functionality

### Deployment
- [ ] Database migrations tested (if applicable)
- [ ] Breaking changes documented
- [ ] Environment variables documented (if new vars added)
- [ ] Docker build tested (if Dockerfile/compose changes)

### UI Changes (if applicable)
- [ ] Screenshots attached
- [ ] Mobile responsiveness verified
- [ ] Accessibility checked (keyboard navigation, ARIA labels)
- [ ] Dark mode tested

## Testing Instructions
How to test this PR:

1. **Setup:**
   ```bash
   git checkout <branch-name>
   bun install
   ```

2. **Database migrations (if applicable):**
   ```bash
   bun run db:push  # Development
   # OR
   bun run db:migrate  # Production-style migration
   ```

3. **Run application:**
   ```bash
   bun run dev  # Starts web + server
   ```

4. **Test steps:**
   - Step 1...
   - Step 2...
   - Step 3...

5. **Expected behavior:**
   - What should happen...

## Screenshots (if applicable)
Add screenshots here (before/after for UI changes).

## Database Changes
- [ ] No database changes
- [ ] Schema changes (migration included)
- [ ] Seed data changes
- [ ] Migration tested locally

## Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes documented below

**If breaking changes, explain:**
- What breaks?
- How to migrate?
- Impact on existing data?

## Security Considerations
- [ ] No security impact
- [ ] Security reviewed
- [ ] Secrets properly handled (no hardcoded credentials)
- [ ] Input validation added
- [ ] Authorization checks in place

## Performance Impact
- [ ] No performance impact
- [ ] Performance tested and acceptable
- [ ] Database indexes added (if query changes)
- [ ] Large file uploads tested (if upload changes)

## Deployment Notes
Special instructions for deploying this change:
- Environment variables to add/update
- Manual steps required
- Rollback procedure (if needed)

## Reviewer Notes
Additional information, context, or questions for reviewers.
