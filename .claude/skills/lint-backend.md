# Lint Backend Code

Run the backend linter to check for code quality and style issues.

## Current Status

⚠️ **The backend does not currently have a linter configured.**

To add ESLint to the backend:

1. Install ESLint and TypeScript ESLint:
   ```bash
   cd backend
   npm install --save-dev eslint @eslint/js typescript-eslint
   ```

2. Create an `eslint.config.js` file in the backend directory

3. Add a lint script to `backend/package.json`:
   ```json
   "scripts": {
     "lint": "eslint ."
   }
   ```

## Once Configured

After setting up ESLint, run the linter with:
```bash
cd backend && npm run lint
```

## Style Guide Reference

When fixing linting errors, refer to the TypeScript Style Guide:
- **Style Guide**: `documentation/typescript-style-guide.md`
- The style guide includes:
  - Naming conventions
  - Type system best practices
  - Async/await patterns
  - Formatting rules (2 spaces, single quotes, semicolons)
  - Common patterns and anti-patterns

## TypeScript Configuration

The backend currently has TypeScript configured at:
- `backend/tsconfig.json` - TypeScript compiler options
- Type checking can be run with: `cd backend && npx tsc --noEmit`

## Auto-fixing

Once ESLint is configured, many issues can be auto-fixed:
```bash
cd backend && npm run lint -- --fix
```
