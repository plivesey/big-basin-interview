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

## Tailwind CSS Best Practices

> Based on official Tailwind documentation and community best practices for design systems

### Core Principles

**Utility-First Philosophy**
- Tailwind is designed for utility classes in markup
- Component abstraction should be your first approach
- Use `@apply` as a last resort, not a default pattern

**The Hierarchy of Abstraction**
1. **Component Abstraction (Preferred)**: Create React/Vue components
2. **Utility Composition**: Use utility classes directly in JSX/templates
3. **@apply Directive (Sparingly)**: Only for small, highly reusable patterns

### When to Use @apply

Use `@apply` ONLY for:
- Very small, highly reusable components (buttons, form controls)
- Cases where component extraction feels too heavy
- Third-party integration that requires CSS classes

**Good use cases:**
```css
/* Small, reusable button that's used everywhere */
.btn-primary {
  @apply px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg;
  @apply hover:bg-indigo-700 transition-colors duration-200;
}

/* Form input with consistent styling */
.input {
  @apply w-full px-4 py-2.5 border border-slate-300 rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-indigo-100;
}
```

**Bad use cases:**
```css
/* Don't extract one-off layouts */
.hero-section {
  @apply flex flex-col items-center justify-center min-h-screen px-4;
}

/* Don't replace component abstraction */
.user-card {
  @apply bg-white rounded-lg shadow p-6 flex items-start space-x-4;
}
/* Instead: Create a <UserCard> component */
```

### Component Abstraction Pattern

**Prefer React components over @apply:**

```tsx
// Good: Component abstraction
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'medium', children }: ButtonProps) {
  return (
    <button className={`
      px-5 py-2.5 font-medium rounded-lg transition-colors
      ${variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
      ${variant === 'secondary' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : ''}
      ${size === 'small' ? 'px-4 py-2 text-sm' : ''}
      ${size === 'large' ? 'px-6 py-3 text-lg' : ''}
    `}>
      {children}
    </button>
  );
}

// Usage
<Button variant="primary" size="large">Click me</Button>
```

This approach provides:
- Better TypeScript integration
- Props for variants instead of class names
- Easier refactoring and maintenance
- Better IDE support

### Design Tokens in Config

**Centralize design decisions in `tailwind.config.js`:**

```javascript
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: {
            pale: '#E0E7FF',
            light: '#6366F1',
            DEFAULT: '#4F46E5',
            dark: '#4338CA',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
}
```

**Benefits:**
- Single source of truth for design tokens
- Tokens available across all utilities (`bg-brand-indigo`, `text-brand-indigo`)
- Easy to maintain and update globally
- Enforces design consistency

### Avoiding @apply Overuse

**Why @apply can be problematic:**
- Defeats the purpose of utility-first CSS
- Loses the benefits of seeing all styles in markup
- Makes it harder to find where styles are defined
- Reduces the effectiveness of PurgeCSS/tree-shaking
- Creates implicit dependencies between CSS and markup

**Signs you're overusing @apply:**
- Every component has a corresponding CSS class
- Your CSS file is growing significantly
- You're extracting unique, one-off styles
- You have deeply nested @apply directives

### Dynamic Styling in Components

**For dynamic styles, use inline utilities or conditional classes:**

```tsx
// Good: Dynamic utilities
function Alert({ type }: { type: 'success' | 'error' }) {
  return (
    <div className={`
      p-4 rounded-lg
      ${type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}
    `}>
      Alert content
    </div>
  );
}

// Better: Use a library like clsx or classnames
import clsx from 'clsx';

function Alert({ type }: { type: 'success' | 'error' }) {
  return (
    <div className={clsx(
      'p-4 rounded-lg',
      type === 'success' && 'bg-green-50 text-green-800',
      type === 'error' && 'bg-red-50 text-red-800'
    )}>
      Alert content
    </div>
  );
}
```

### Responsive Design

**Use Tailwind's responsive prefixes directly:**

```tsx
// Good: Inline responsive utilities
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Avoid: Extracting responsive patterns with @apply
.card-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}
```

### Ordering Utilities

**Recommended order for utility classes:**
1. Layout (display, position, flex, grid)
2. Spacing (margin, padding)
3. Sizing (width, height)
4. Typography (font, text)
5. Visual (background, border, shadow)
6. State (hover, focus, active)
7. Responsive prefixes

```tsx
// Well-organized utilities
<button className="
  flex items-center justify-center
  px-5 py-2.5
  w-full
  font-medium text-white
  bg-indigo-600 rounded-lg shadow-sm
  hover:bg-indigo-700
  sm:w-auto
">
  Submit
</button>
```

### Configuration Best Practices

**Keep your config modular and maintainable:**

```javascript
// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Only extend, don't replace default theme
      colors: {
        // Add brand colors without losing default palette
      },
    },
  },
  plugins: [
    // Add plugins sparingly
  ],
}
```

### Plugin Usage

**Use official plugins when needed:**
- `@tailwindcss/forms` - Better form styling
- `@tailwindcss/typography` - Prose content styling
- `@tailwindcss/aspect-ratio` - Aspect ratio utilities

**Avoid:**
- Installing too many third-party plugins
- Creating complex custom plugins when utilities suffice

### Performance Considerations

**Optimize for production:**
- Configure content paths correctly for PurgeCSS
- Keep utility usage consistent to benefit from compression
- Avoid generating unused variants
- Use `safelist` sparingly (only when dynamic classes are unavoidable)

```javascript
// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Only when absolutely necessary
    'bg-red-500',
    'bg-green-500',
  ],
}
```

### Summary: The Golden Rule

**Component Abstraction First, @apply Second**

1. Create React/Vue components for reusable UI patterns
2. Use utility classes directly in markup for most styling
3. Only use `@apply` for small, highly reusable CSS patterns
4. Centralize design tokens in `tailwind.config.js`
5. Keep the utility-first philosophy - don't turn Tailwind into traditional CSS

### References

- [Reusing Styles - Tailwind CSS](https://tailwindcss.com/docs/reusing-styles)
- [Tailwind CSS Best Practices & Design System Patterns](https://dev.to/frontendtoolstech/tailwind-css-best-practices-design-system-patterns-54pi)
- [Extracting Components - Tailwind CSS](https://v1.tailwindcss.com/docs/extracting-components)
