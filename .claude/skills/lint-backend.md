# Lint Backend Code

Run the backend linter to check for code quality and style issues.

## Steps

1. Navigate to the backend directory and run the linter:
   ```bash
   cd backend && npm run lint
   ```

2. Review the output for any errors or warnings

3. If there are linting errors, refer to the TypeScript Style Guide for fixing common issues:
   - **Style Guide**: `documentation/typescript-style-guide.md`
   - The style guide is aligned with the ESLint configuration and includes:
     - Naming conventions
     - Type system best practices
     - Async/await patterns
     - Formatting rules
     - Common patterns and anti-patterns

## Configuration

The backend linter uses:
- **ESLint** with `typescript-eslint`
- Configuration file: `backend/eslint.config.mjs`
- TypeScript config: `backend/tsconfig.json`

## Auto-fixing

ESLint can automatically fix many issues. To auto-fix:
```bash
cd backend && npm run lint -- --fix
```

Note: Not all issues can be auto-fixed; some require manual intervention.

## TypeScript Type Checking

You can also run TypeScript type checking separately:
```bash
cd backend && npx tsc --noEmit
```
