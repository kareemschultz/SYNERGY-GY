# Codebase Restructuring & Cleanup

## Overview

This prompt covers comprehensive codebase restructuring and cleanup:

1. **Specs Archive** - Archive old specs, keep FEATURE_INVENTORY as source of truth
2. **Console Cleanup** - Remove console.log, KEEP console.error/warn
3. **Dead Code Removal** - Remove unused files, imports, exports
4. **Documentation Consolidation** - Organize docs folders
5. **Dependency Audit** - Remove unused packages
6. **Configuration Cleanup** - Consolidate config files

---

## DECISIONS MADE

| Item | Decision |
|------|----------|
| **Specs folder** | Archive old specs to `specs/archive/` |
| **Console logs** | Remove `console.log`, KEEP `console.error` and `console.warn` |

---

## PHASE 1: Archive Old Specs

### 1.1 Create Archive Structure

```bash
# Create archive directory
mkdir -p specs/archive

# Move old phase specs to archive (keep structure)
mv specs/phase-1 specs/archive/
mv specs/phase-2 specs/archive/
mv specs/phase-3 specs/archive/
mv specs/architecture specs/archive/
mv specs/business-rules specs/archive/
mv specs/implementations specs/archive/

# Keep these at root of specs/:
# - specs/README.md (update to point to archive)
# - specs/FEATURE_INVENTORY.md (source of truth)
```

### 1.2 Update specs/README.md

After archiving, update the README to reflect new structure:

```markdown
# GK-Nexus Technical Specifications

## Current Documentation

| Document | Description |
|----------|-------------|
| [FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md) | **Source of Truth** - Complete feature list with routes and endpoints |

## Archived Specifications

Historical planning and specification documents are archived in the [archive/](./archive/) folder:

- [Phase 1 Specs](./archive/phase-1/) - Core features (✅ Complete)
- [Phase 2 Specs](./archive/phase-2/) - Advanced features (✅ Complete)
- [Phase 3 Specs](./archive/phase-3/) - Future integrations (📅 Planned)
- [Architecture](./archive/architecture/) - System design docs
- [Business Rules](./archive/business-rules/) - Guyana-specific rules
- [Implementations](./archive/implementations/) - Historical implementation logs

> **Note:** These specs were created during planning. For current implementation status, always refer to FEATURE_INVENTORY.md.
```

### 1.3 Move Other Spec Files

```bash
# Check for other spec files at specs/ root
ls specs/*.md

# Move these to archive if they're old planning docs:
# mv specs/api-patterns.md specs/archive/
# mv specs/document-requirements.md specs/archive/
# mv specs/production-readiness.md specs/archive/
# etc.

# Keep only:
# - specs/README.md
# - specs/FEATURE_INVENTORY.md
```

---

## PHASE 2: Console Log Cleanup

### 2.1 Find Console Statements

```bash
# Find ALL console statements first
echo "=== ALL CONSOLE STATEMENTS ==="
grep -rn "console\." apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "\.spec\." | grep -v "\.test\."

# Count by type
echo ""
echo "=== COUNTS ==="
echo "console.log:"
grep -rn "console\.log" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l

echo "console.error:"
grep -rn "console\.error" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l

echo "console.warn:"
grep -rn "console\.warn" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l
```

### 2.2 Remove ONLY console.log (Keep error/warn)

```bash
# IMPORTANT: Only remove console.log, NOT console.error or console.warn

# Option A: Comment them out (safer)
find apps/ packages/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\.log" | while read file; do
  sed -i 's/console\.log/\/\/ console.log/g' "$file"
done

# Option B: Remove entire line (more aggressive)
# find apps/ packages/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '/console\.log/d'

# NEVER touch console.error or console.warn - they are important for production debugging!
```

### 2.3 Verify Console Cleanup

```bash
# Should show 0 console.log statements
echo "Remaining console.log:"
grep -rn "console\.log" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "^//" | wc -l

# These should still exist (that's OK!)
echo "Kept console.error:"
grep -rn "console\.error" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l

echo "Kept console.warn:"
grep -rn "console\.warn" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l
```

---

## PHASE 4: Dependency Cleanup

### 4.1 Check for Unused Dependencies

```bash
# Install depcheck if not available
bun add -D depcheck

# Run depcheck
bunx depcheck

# Or manually check package.json
cat package.json | jq '.dependencies, .devDependencies'
```

### 4.2 Check for Outdated Dependencies

```bash
# Check for outdated packages
bun outdated

# Update safely (patch versions only)
bun update
```

### 4.3 Check for Duplicate Dependencies

```bash
# Check if same package is in multiple package.json files
for pkg in react typescript drizzle-orm; do
  echo "=== $pkg ==="
  grep -r "\"$pkg\"" . --include="package.json" | grep -v node_modules
done
```

---

## PHASE 5: Configuration Cleanup

### 5.1 Consolidate Config Files

```bash
# List all config files
echo "=== CONFIG FILES ==="
find . -name "*.config.*" -o -name ".*rc" -o -name ".*rc.json" | grep -v node_modules | sort
```

### 5.2 Check for Duplicate Configs

Common duplicates to check:
- Multiple tsconfig files (should extend base)
- Multiple biome/eslint configs
- Multiple tailwind configs

### 5.3 Verify .gitignore

```bash
# Check .gitignore is comprehensive
cat .gitignore

# Should include:
# - node_modules
# - dist
# - .env (not .env.example)
# - .env.*
# - !.env.example
# - *.log
# - .DS_Store
# - coverage/
# - e2e-results/
# - e2e-report/
```

---

## PHASE 6: Final Verification

### 6.1 Run All Checks

```bash
# Type check
bun run check-types

# Lint check
bun run check

# Build check
bun run build
```

### 6.2 Verify Project Structure

```bash
# Final structure overview
tree -L 2 -I "node_modules|dist|.git" .
```

### 6.3 Commit Changes

```bash
git add -A
git status

# Review changes before committing
git diff --cached --stat

git commit -m "chore: codebase restructuring and cleanup

- Consolidated documentation structure
- Removed unused files and dead code
- Cleaned up console statements
- Removed unused dependencies
- Organized configuration files"

git push origin master
```

---

## Execution Checklist

```
Restructuring & Cleanup:

## Phase 1: Archive Specs
[ ] Create specs/archive/ directory
[ ] Move phase-1, phase-2, phase-3 to archive
[ ] Move architecture, business-rules, implementations to archive
[ ] Move other old spec files to archive
[ ] Update specs/README.md to point to archive
[ ] Keep only: specs/README.md, specs/FEATURE_INVENTORY.md

## Phase 2: Console Cleanup
[ ] Find all console.log statements
[ ] Remove/comment console.log (NOT error/warn!)
[ ] Verify console.error and console.warn still exist
[ ] Run lint check

## Phase 3: Code Cleanup
[ ] Remove unused imports (bun run check --fix)
[ ] Identify and remove dead code files
[ ] Remove empty directories

## Phase 4: Dependencies
[ ] Check for unused dependencies
[ ] Remove unused dependencies
[ ] Update outdated packages (patch only)

## Phase 5: Configuration
[ ] Verify .gitignore is comprehensive
[ ] Clean up any duplicate configs

## Phase 6: Verification
[ ] bun run check-types (pass)
[ ] bun run check (pass)
[ ] bun run build (pass)
[ ] Commit and push
```

---

## Quick Start Command for Claude Code

```
Perform codebase restructuring and cleanup. Decisions already made:
- ARCHIVE old specs (don't delete)
- REMOVE console.log only (KEEP console.error and console.warn)

Execute in this order:

1. ARCHIVE SPECS:
   mkdir -p specs/archive
   mv specs/phase-1 specs/archive/
   mv specs/phase-2 specs/archive/
   mv specs/phase-3 specs/archive/
   mv specs/architecture specs/archive/
   mv specs/business-rules specs/archive/
   mv specs/implementations specs/archive/
   
   Move any other old .md files from specs/ root to specs/archive/
   Keep ONLY: specs/README.md and specs/FEATURE_INVENTORY.md
   
   Update specs/README.md to explain archive structure

2. CONSOLE CLEANUP:
   Find and REMOVE only console.log statements (comment out or delete)
   DO NOT touch console.error or console.warn - keep those!
   Skip test files (.spec.ts, .test.ts)

3. CODE CLEANUP:
   Run: bun run check --fix (removes unused imports)
   Find and remove any dead code files
   Remove empty directories

4. DEPENDENCY CHECK:
   Run depcheck or manually review package.json
   Remove any unused dependencies

5. VERIFY:
   bun run check-types
   bun run check
   bun run build

6. COMMIT:
   git add -A
   git commit -m "chore: restructure specs to archive, cleanup console.log statements

   - Archived old specs to specs/archive/
   - FEATURE_INVENTORY.md is now source of truth
   - Removed console.log statements (kept error/warn)
   - Cleaned up unused imports
   - Verified all checks pass"
   
   git push origin master
```
