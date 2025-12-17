# Lint Frontend Code

Run the frontend linter to check for code quality and style issues.

## Steps

1. Navigate to the frontend directory and run the linter:
   ```bash
   cd frontend && npm run lint
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

The frontend linter uses:
- **ESLint** with `typescript-eslint`, React hooks, and React refresh plugins
- **TypeScript** in strict mode
- Configuration file: `frontend/eslint.config.js`
- TypeScript config: `frontend/tsconfig.app.json`

## Auto-fixing

ESLint can automatically fix many issues. To auto-fix:
```bash
cd frontend && npx eslint . --fix
```

Note: Not all issues can be auto-fixed; some require manual intervention.
