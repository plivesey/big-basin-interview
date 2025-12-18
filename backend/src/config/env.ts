import { z, ZodIssue } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_PATH: z.string().default('./data/app.db'),
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-5'),
  CLAUDE_MAX_TOKENS: z.coerce.number().default(2048),
  AI_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_MAX_RETRIES: z.coerce.number().default(5),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().default('primary'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate all environment variables and fail fast with clear error messages.
 * Lists all missing and invalid variables to help with troubleshooting.
 *
 * Note: Uses process.stderr.write directly because logger depends on env being validated first.
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missingVars: string[] = [];
    const invalidVars: string[] = [];

    parsed.error.issues.forEach((issue: ZodIssue) => {
      const varName = issue.path.join('.');
      // Check for missing variables (invalid_type with undefined received)
      if (issue.code === 'invalid_type' && 'received' in issue && issue.received === 'undefined') {
        missingVars.push(varName);
      } else {
        invalidVars.push(`${varName}: ${issue.message}`);
      }
    });

    process.stderr.write('\n');
    process.stderr.write('========================================\n');
    process.stderr.write('  ENVIRONMENT VALIDATION FAILED\n');
    process.stderr.write('========================================\n\n');

    if (missingVars.length > 0) {
      process.stderr.write('Missing required environment variables:\n');
      missingVars.forEach((v) => process.stderr.write(`  - ${v}\n`));
      process.stderr.write('\n');
    }

    if (invalidVars.length > 0) {
      process.stderr.write('Invalid environment variables:\n');
      invalidVars.forEach((v) => process.stderr.write(`  - ${v}\n`));
      process.stderr.write('\n');
    }

    process.stderr.write('Please check your .env file or environment configuration.\n');
    process.stderr.write('See backend/.env.example for required variables.\n\n');
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();

// Helper to check if required API keys are present for specific features
export function requireAnthropicKey(): string {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for AI features');
  }
  return env.ANTHROPIC_API_KEY;
}

export function requireGoogleCalendarConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new Error('Google Calendar configuration (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI) is required');
  }
  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  };
}
