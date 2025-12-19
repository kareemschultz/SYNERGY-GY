# Error Discovery Summary

## Date: 2025-12-18

## TypeScript Errors: 35 total

### packages/api/src/routers/admin.ts (12 errors)
- Lines 344, 365, 366, 562, 563, 571, 572, 620, 621, 629, 630
- Issue: Property access on union types (`{ [x: string]: any; } | { [x: string]: any; }[]`)
- Properties: `email`, `name`

### packages/api/src/routers/invoices.ts (6 errors)
- Lines 680-683, 1149, 1150
- Issue: Property access on union types
- Properties: `displayName`, `email`, `address`, `tinNumber`, `referenceNumber`

### packages/api/src/routers/matters.ts (6 errors)
- Lines 218, 225, 277, 365
- Issue: Implicit any types, property access on union types
- Properties: `displayName`

### packages/api/src/routers/portal.ts (4 errors)
- Lines 2273, 2348, 2350, 2351
- Issue: Property access on union types
- Properties: `name`, `email`

### packages/api/src/routers/service-catalog.ts (5 errors)
- Lines 702, 706-709
- Issue: Property access on union types
- Properties: `name`, `id`, `displayName`, `description`

### packages/api/src/routers/time-tracking.ts (1 error)
- Line 522
- Issue: Property access on union types
- Properties: `business`

### packages/db/src/schema/services.ts (2 errors)
- Lines 95, 139
- Issue: Circular type reference in relations

## Biome Lint Errors: 7 total

1. `apps/server/src/index.ts:224` - useTopLevelRegex
2. `apps/web/e2e/*.spec.ts` - noEmptyBlockStatements, useAwait (multiple files)
3. `apps/web/package.json:69` - noDuplicateDependencies (@radix-ui/react-progress)
4. `apps/web/src/components/admin/category-form-dialog.tsx:65` - noInvalidUseBeforeDeclaration, useExhaustiveDependencies
5. `apps/web/src/components/admin/service-form-dialog.tsx:99` - noInvalidUseBeforeDeclaration, useExhaustiveDependencies

## Biome Lint Warnings: 478 total

### Performance
- useTopLevelRegex (3)
- noBarrelFile (2)
- noNamespaceImport (1)

### Correctness
- useExhaustiveDependencies (2)
- noUnusedVariables (1)
- noUnusedFunctionParameters (3)

### Style
- noNestedTernary (15+)
- noNonNullAssertion (4)
- noNestedTernary (many)

### Complexity
- noExcessiveCognitiveComplexity (10+)

### Suspicious
- noExplicitAny (4)
- noEmptyBlockStatements (5)
- useAwait (4)
- noEvolvingTypes (1)
- noArrayIndexKey (2)

### Nursery
- noLeakedRender (40+)
- noShadow (5+)
- noIncrementDecrement (2)

### Accessibility
- noLabelWithoutControl (2)
- noSvgWithoutTitle (1)

## Build Status: SUCCESS

- Large bundle warning: 2,318KB (over 500KB limit)
- Need code splitting

## CI Status: FAILING

- TypeScript errors blocking CI
- Docker builds succeeding

## Priority Fix Order

1. TypeScript errors (blocking CI)
2. Biome lint errors (7)
3. Critical biome warnings (accessibility, correctness)
4. Performance warnings
5. Code quality warnings
