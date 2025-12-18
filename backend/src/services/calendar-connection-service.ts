import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { google, Auth } from 'googleapis';
import { db, calendarConnections, CalendarConnection, NewCalendarConnection } from '../db';
import { requireGoogleCalendarConfig } from '../config/env';
import { logger } from '../utils/logger';

/**
 * OAuth2 client singleton
 */
let oauth2Client: Auth.OAuth2Client | null = null;

/**
 * Get the OAuth2 client for Google Calendar
 */
export function getOAuth2Client(): Auth.OAuth2Client {
  if (!oauth2Client) {
    const config = requireGoogleCalendarConfig();
    oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }
  return oauth2Client;
}

/**
 * Generate the OAuth URL for user to connect their calendar
 */
export function getOAuthUrl(): string {
  const oauth2 = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date; email: string | null }> {
  const oauth2 = getOAuth2Client();

  logger.debug('Exchanging authorization code for tokens');

  const { tokens } = await oauth2.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get access or refresh token from Google');
  }

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600000));

  // Get user email from Google
  let email: string | null = null;
  try {
    oauth2.setCredentials(tokens);
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const userInfo = await oauth2Api.userinfo.get();
    email = userInfo.data.email || null;
  } catch (error) {
    logger.warn('Failed to get user email from Google', { error: String(error) });
  }

  logger.info('Successfully exchanged code for tokens', { email });

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
    email,
  };
}

/**
 * Get calendar connection for a user
 */
export async function getConnection(userId: string = 'default_user'): Promise<CalendarConnection | null> {
  logger.debug('Getting calendar connection', { userId });

  const result = await db
    .select()
    .from(calendarConnections)
    .where(eq(calendarConnections.userId, userId))
    .limit(1);

  if (result.length === 0) {
    logger.debug('No calendar connection found', { userId });
    return null;
  }

  return result[0];
}

/**
 * Save or update calendar connection for a user (upsert)
 */
export async function saveConnection(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  },
  email: string | null
): Promise<CalendarConnection> {
  logger.debug('Saving calendar connection', { userId, email });

  const now = new Date();

  // Check if connection exists
  const existing = await getConnection(userId);

  if (existing) {
    // Update existing connection
    await db
      .update(calendarConnections)
      .set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        email,
        updatedAt: now,
      })
      .where(eq(calendarConnections.userId, userId));

    logger.info('Calendar connection updated', { userId, email });

    return {
      ...existing,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      email,
      updatedAt: now,
    };
  }

  // Create new connection
  const newConnection: NewCalendarConnection = {
    id: uuidv4(),
    userId,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    calendarId: 'primary',
    email,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(calendarConnections).values(newConnection);

  logger.info('Calendar connection created', { userId, email });

  return newConnection as CalendarConnection;
}

/**
 * Delete calendar connection for a user
 */
export async function deleteConnection(userId: string = 'default_user'): Promise<boolean> {
  logger.debug('Deleting calendar connection', { userId });

  const result = await db
    .delete(calendarConnections)
    .where(eq(calendarConnections.userId, userId));

  const deleted = result.changes > 0;

  if (deleted) {
    logger.info('Calendar connection deleted', { userId });
  } else {
    logger.debug('No calendar connection to delete', { userId });
  }

  return deleted;
}

/**
 * Refresh token if needed and update the database
 * Returns the updated connection with fresh tokens, or null if not connected
 */
export async function refreshTokenIfNeeded(
  userId: string = 'default_user'
): Promise<CalendarConnection | null> {
  const connection = await getConnection(userId);

  if (!connection) {
    return null;
  }

  // Check if token is about to expire (within 5 minutes)
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (connection.expiresAt > fiveMinutesFromNow) {
    // Token is still valid
    return connection;
  }

  logger.info('Refreshing expired calendar token', { userId });

  try {
    const oauth2 = getOAuth2Client();
    oauth2.setCredentials({
      refresh_token: connection.refreshToken,
    });

    const { credentials } = await oauth2.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    const expiresAt = new Date(Date.now() + (credentials.expiry_date || 3600000));

    // Update database with new tokens
    await db
      .update(calendarConnections)
      .set({
        accessToken: credentials.access_token,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.userId, userId));

    logger.info('Calendar token refreshed successfully', { userId });

    return {
      ...connection,
      accessToken: credentials.access_token,
      expiresAt,
      updatedAt: new Date(),
    };
  } catch (error) {
    logger.error('Failed to refresh calendar token', {
      userId,
      error: String(error),
    });
    return null;
  }
}
