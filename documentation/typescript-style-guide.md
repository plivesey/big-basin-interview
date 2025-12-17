# TypeScript Style Guide

> This style guide is aligned with the project's ESLint and TypeScript configuration.
>
> **Linter**: ESLint with `typescript-eslint`, React hooks, and React refresh plugins
> **TypeScript**: Strict mode enabled with all strict type-checking options
> **Formatter**: 2-space indentation, single quotes, semicolons required

## Naming Conventions

- **Classes/Interfaces/Types/Enums**: `PascalCase`
- **Variables/Functions/Properties**: `camelCase`
- **Constants**: `CONSTANT_CASE`
- **Files**: `camelCase` (e.g., `userService.ts`), or `PascalCase` for components (e.g., `UserProfile.tsx`)
- Avoid abbreviations; use descriptive names
- No `I` prefix for interfaces

## Variables & Declarations

- Always use `const` or `let`; never use `var`
- Declare one variable per statement
- Use `const` by default; `let` only when reassignment is needed

## Type System

- Rely on type inference for trivial types
- Prefer `unknown` over `any`
- Use `T[]` for array types; `Array<T>` for complex types
- Prefer `interface` for object shapes and extension
- Use `type` for unions, intersections, and mapped types
- Prefer optional properties (`field?: T`) over union with undefined
- Prefer `undefined` over `null` for missing values

**Enforced by TypeScript config:**
- Strict mode is enabled (all strict type-checking options)
- No unused locals or parameters
- No fallthrough cases in switch statements
- Must handle all code paths in functions with return types

## Functions

- Prefer function declarations for named functions
- Use arrow functions for callbacks and nested functions
- Add explicit return types for public APIs
- Use parameter properties to reduce boilerplate in classes

## Classes

- Use `readonly` for non-reassigned properties
- Use TypeScript visibility modifiers (`private`, `protected`, `public`)
- Omit semicolons after class declarations
- Separate methods with single blank lines

## Imports & Exports

- Prefer named exports for utilities, services, and types
- Use default exports for React components (framework convention)
- Prefer relative imports (`./foo`) within projects
- Use namespace imports for large APIs
- Order: external imports → internal imports → types
- No side-effect imports unless necessary

## Control Flow & Comparisons

- Always use braces, even for single-statement blocks
- Prefer `===` and `!==` over `==` and `!=`
- Exception: `==null` to check both null and undefined
- Use `for...of` for array iteration
- Include `default` case in all switch statements

## Async Control Flow & Promises

- Prefer `async/await` over raw promises for better readability
- Always handle promise rejections with `try/catch` blocks
- Use `Promise.all()` for parallel operations; `Promise.allSettled()` when some failures are acceptable
- Avoid mixing `async/await` with `.then()/.catch()` chains in the same function
- Mark functions as `async` when they return promises
- Catch errors as `unknown` type and narrow with type guards (e.g., `err instanceof Error`)
- Don't use `await` unnecessarily; return promises directly when possible
- For React effects, cleanup functions cannot be async; use IIFEs for async operations

```typescript
// Good: async/await with proper error handling
async function fetchData() {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (err) {
    console.error('Failed to fetch:', err instanceof Error ? err.message : 'Unknown error')
    throw err
  }
}

// Good: parallel operations
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
])

// Good: React effect with async
useEffect(() => {
  const loadData = async () => {
    try {
      const data = await fetchData()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  loadData()
}, [])

// Bad: mixing patterns
async function badExample() {
  return fetch('/api/data')
    .then(res => res.json())  // Don't mix .then() with async/await
}

// Bad: unnecessary await
async function returnDirectly() {
  return await somePromise()  // Just return somePromise()
}
```

## Strings & Templates

- Use single quotes (`'`) for ordinary strings
- Use template literals for complex concatenation or multi-line strings
- No line continuations with backslash

## Error Handling

- Only throw `Error` instances (or subclasses)
- Catch errors as `unknown` and narrow appropriately
- Document empty catch blocks with comments

## Comments & Documentation

- Use `/** JSDoc */` for public APIs and user-facing code
- Use `//` for implementation comments
- Write documentation in Markdown format

## Formatting

- Use 2 spaces for indentation
- Always use semicolons
- Single blank line between sections
- No trailing whitespace

## Disallowed Patterns

- No wrapper objects (`new String()`, `new Boolean()`)
- No `eval` or `Function(string)`
- No `var` keyword
- No `with` keyword
- No modification of built-in prototypes
- No reliance on Automatic Semicolon Insertion
