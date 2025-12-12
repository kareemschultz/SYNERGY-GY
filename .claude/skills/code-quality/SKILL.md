---
name: code-quality
description: Enforce Ultracite/Biome code quality standards and TypeScript best practices. Use when writing code, fixing linting errors, or improving code quality. Triggers on: lint, format, code quality, TypeScript errors, Biome, Ultracite.
---

# Code Quality Standards

## Quick Commands
```bash
# Fix all issues (run before every commit)
npx ultracite fix

# Check without fixing
npx ultracite check

# TypeScript type checking
bun run check-types
```

## TypeScript Rules

### No `any` Type
```typescript
// BAD
function process(data: any) { ... }

// GOOD
function process(data: unknown) { ... }
function process(data: Record<string, unknown>) { ... }
function process<T>(data: T) { ... }
```

### Explicit Return Types (for public functions)
```typescript
// BAD
export function calculate(a, b) {
  return a + b;
}

// GOOD
export function calculate(a: number, b: number): number {
  return a + b;
}
```

### Use `unknown` for Error Handling
```typescript
// BAD
catch (error: any) {
  console.log(error.message);
}

// GOOD
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  }
}
```

## Modern JavaScript Patterns

### Arrow Functions for Callbacks
```typescript
// BAD
items.map(function(item) { return item.name; });

// GOOD
items.map((item) => item.name);
```

### Use `for...of` Over `.forEach()`
```typescript
// BAD
items.forEach((item) => {
  process(item);
});

// GOOD
for (const item of items) {
  process(item);
}
```

### Optional Chaining and Nullish Coalescing
```typescript
// BAD
const name = user && user.profile && user.profile.name;
const value = input !== null && input !== undefined ? input : 'default';

// GOOD
const name = user?.profile?.name;
const value = input ?? 'default';
```

### Template Literals Over Concatenation
```typescript
// BAD
const message = 'Hello, ' + name + '! Welcome.';

// GOOD
const message = `Hello, ${name}! Welcome.`;
```

### Destructuring
```typescript
// BAD
const name = user.name;
const email = user.email;

// GOOD
const { name, email } = user;
```

### Use `const` by Default
```typescript
// BAD
var items = [];
let count = 0; // if never reassigned

// GOOD
const items = [];
let count = 0; // only if reassigned later
```

## Async/Promise Rules

### Always Await Promises in Async Functions
```typescript
// BAD
async function save() {
  db.insert(data); // Promise not awaited!
}

// GOOD
async function save() {
  await db.insert(data);
}
```

### Use async/await Over Promise Chains
```typescript
// BAD
function getData() {
  return fetch(url)
    .then(res => res.json())
    .then(data => process(data));
}

// GOOD
async function getData() {
  const res = await fetch(url);
  const data = await res.json();
  return process(data);
}
```

### Proper Error Handling
```typescript
// BAD
async function fetch() {
  const data = await api.get(); // Unhandled rejection
}

// GOOD
async function fetch() {
  try {
    const data = await api.get();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error; // or handle appropriately
  }
}
```

## React Rules

### Function Components Only
```typescript
// BAD
class MyComponent extends React.Component { ... }

// GOOD
function MyComponent() { ... }
// or
const MyComponent = () => { ... };
```

### Hooks at Top Level
```typescript
// BAD
if (condition) {
  const [state, setState] = useState();
}

// GOOD
const [state, setState] = useState();
if (condition) {
  // use state here
}
```

### Complete Hook Dependencies
```typescript
// BAD
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency

// GOOD
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Keys for Lists
```typescript
// BAD
items.map((item, index) => <Item key={index} />); // Index as key

// GOOD
items.map((item) => <Item key={item.id} />); // Unique ID
```

### Semantic HTML
```typescript
// BAD
<div onClick={handleClick}>Click me</div>

// GOOD
<button onClick={handleClick}>Click me</button>
```

## Security Rules

### External Links
```typescript
// BAD
<a href={url} target="_blank">Link</a>

// GOOD
<a href={url} target="_blank" rel="noopener noreferrer">Link</a>
```

### No dangerouslySetInnerHTML (unless necessary)
```typescript
// AVOID
<div dangerouslySetInnerHTML={{ __html: content }} />

// PREFER
<div>{sanitizedContent}</div>
```

### Input Validation
```typescript
// ALWAYS validate user input with Zod
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
});
```

## Error Handling

### Throw Error Objects
```typescript
// BAD
throw 'Something went wrong';
throw { message: 'error' };

// GOOD
throw new Error('Something went wrong');
throw new ORPCError('BAD_REQUEST', { message: 'Invalid input' });
```

### User-Friendly Messages
```typescript
// BAD
throw new Error('ECONNREFUSED');

// GOOD
throw new Error('Unable to connect to server. Please try again.');
```

## Code Organization

### Early Returns
```typescript
// BAD
function process(user) {
  if (user) {
    if (user.isActive) {
      // deep nesting
    }
  }
}

// GOOD
function process(user) {
  if (!user) return;
  if (!user.isActive) return;
  // main logic
}
```

### Extract Complex Conditions
```typescript
// BAD
if (user.role === 'ADMIN' && user.isActive && !user.isLocked && user.permissions.includes('write')) {
  // ...
}

// GOOD
const canWrite = user.role === 'ADMIN'
  && user.isActive
  && !user.isLocked
  && user.permissions.includes('write');

if (canWrite) {
  // ...
}
```

## Critical Rules Summary

1. **No `any` types** - Use `unknown` or proper generics
2. **Always await promises** in async functions
3. **Use `const` by default** - `let` only when reassigning
4. **Arrow functions** for callbacks
5. **`for...of`** over `.forEach()`
6. **Semantic HTML** - `button`, `nav`, `main`, etc.
7. **Complete hook deps** - Include all dependencies
8. **Early returns** - Reduce nesting
9. **Throw Error objects** - Not strings
10. **Run `npx ultracite fix`** before every commit
