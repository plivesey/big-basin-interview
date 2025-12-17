import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

describe('Database Schema', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    // Create in-memory database for testing
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    db = drizzle(sqlite, { schema });

    // Create tables manually for testing (simulating migration)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        rating REAL NOT NULL,
        review_count INTEGER DEFAULT 0,
        phone_number TEXT,
        email TEXT,
        website TEXT,
        working_hours TEXT NOT NULL,
        services TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default_user',
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        last_activity_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default_user',
        provider_id TEXT NOT NULL REFERENCES providers(id),
        service_type TEXT NOT NULL,
        scheduled_at INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        status TEXT NOT NULL,
        calendar_event_id TEXT,
        idempotency_key TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workflow_states (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        current_state TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        context TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_updated INTEGER NOT NULL,
        completed_at INTEGER,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS workflow_session_id_idx ON workflow_states(session_id);
      CREATE INDEX IF NOT EXISTS workflow_status_idx ON workflow_states(status);
      CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
    `);
  });

  afterAll(() => {
    sqlite.close();
  });

  describe('Providers Table', () => {
    it('should insert and retrieve a provider', () => {
      const now = new Date();
      const providerId = uuidv4();
      const provider: schema.NewProvider = {
        id: providerId,
        name: 'Test Salon',
        category: 'salon',
        description: 'A test salon',
        address: '123 Test St',
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.5,
        reviewCount: 10,
        phoneNumber: '555-1234',
        email: 'test@salon.com',
        website: 'https://testsalon.com',
        workingHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: null,
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: null,
          sunday: null,
        },
        services: ['haircut', 'coloring'],
        createdAt: now,
        updatedAt: now,
      };

      db.insert(schema.providers).values(provider).run();

      const results = db.select().from(schema.providers).where(eq(schema.providers.id, providerId)).all();
      const retrieved = results[0];

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Salon');
      expect(retrieved?.category).toBe('salon');
      expect(retrieved?.rating).toBe(4.5);
      expect(retrieved?.services).toEqual(['haircut', 'coloring']);
    });

    it('should enforce required fields', () => {
      expect(() => {
        sqlite.prepare(`
          INSERT INTO providers (id, name, address, latitude, longitude, rating, working_hours, services, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), 'Test', '123 St', 37.7, -122.4, 4.0, '{}', '[]', Date.now(), Date.now());
      }).toThrow(); // Should fail because category is missing
    });

    it('should filter providers by category', () => {
      const now = new Date();
      const salonId = uuidv4();
      const mechanicId = uuidv4();

      db.insert(schema.providers).values({
        id: salonId,
        name: 'Category Test Salon',
        category: 'salon',
        address: '456 Test St',
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.0,
        workingHours: {},
        services: ['haircut'],
        createdAt: now,
        updatedAt: now,
      }).run();

      db.insert(schema.providers).values({
        id: mechanicId,
        name: 'Category Test Mechanic',
        category: 'mechanic',
        address: '789 Test St',
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.2,
        workingHours: {},
        services: ['oil change'],
        createdAt: now,
        updatedAt: now,
      }).run();

      const salons = db.select().from(schema.providers).where(eq(schema.providers.category, 'salon')).all();

      expect(salons.some(p => p.name === 'Category Test Salon')).toBe(true);
      expect(salons.some(p => p.name === 'Category Test Mechanic')).toBe(false);
    });
  });

  describe('Sessions Table', () => {
    it('should create and retrieve a session', () => {
      const now = new Date();
      const sessionId = uuidv4();
      const session: schema.NewSession = {
        id: sessionId,
        userId: 'test_user',
        status: 'active',
        createdAt: now,
        lastActivityAt: now,
      };

      db.insert(schema.sessions).values(session).run();

      const results = db.select().from(schema.sessions).where(eq(schema.sessions.id, sessionId)).all();
      const retrieved = results[0];

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe('test_user');
      expect(retrieved?.status).toBe('active');
    });

    it('should use default values for userId and status', () => {
      const now = new Date();
      const sessionId = uuidv4();

      sqlite.prepare(`
        INSERT INTO sessions (id, created_at, last_activity_at)
        VALUES (?, ?, ?)
      `).run(sessionId, now.getTime(), now.getTime());

      const results = db.select().from(schema.sessions).where(eq(schema.sessions.id, sessionId)).all();
      const retrieved = results[0];

      expect(retrieved?.userId).toBe('default_user');
      expect(retrieved?.status).toBe('active');
    });
  });

  describe('Bookings Table', () => {
    let testProviderId: string;
    let testSessionId: string;

    beforeAll(() => {
      const now = new Date();
      testProviderId = uuidv4();
      testSessionId = uuidv4();

      // Create a provider and session for booking tests
      db.insert(schema.providers).values({
        id: testProviderId,
        name: 'Booking Test Provider',
        category: 'salon',
        address: '123 Booking St',
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.5,
        workingHours: {},
        services: ['haircut'],
        createdAt: now,
        updatedAt: now,
      }).run();

      db.insert(schema.sessions).values({
        id: testSessionId,
        userId: 'test_user',
        status: 'active',
        createdAt: now,
        lastActivityAt: now,
      }).run();
    });

    it('should create a booking with all required fields', () => {
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const bookingId = uuidv4();

      const booking: schema.NewBooking = {
        id: bookingId,
        userId: 'test_user',
        providerId: testProviderId,
        serviceType: 'haircut',
        scheduledAt: scheduledAt,
        duration: 60,
        status: 'pending',
        idempotencyKey: `test:${testProviderId}:${scheduledAt.toISOString()}`,
        createdAt: now,
        updatedAt: now,
      };

      db.insert(schema.bookings).values(booking).run();

      const results = db.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId)).all();
      const retrieved = results[0];

      expect(retrieved).toBeDefined();
      expect(retrieved?.serviceType).toBe('haircut');
      expect(retrieved?.duration).toBe(60);
      expect(retrieved?.status).toBe('pending');
    });

    it('should enforce unique idempotency key', () => {
      const now = new Date();
      const idempotencyKey = `unique:${uuidv4()}`;

      const booking1: schema.NewBooking = {
        id: uuidv4(),
        providerId: testProviderId,
        serviceType: 'haircut',
        scheduledAt: now,
        duration: 60,
        status: 'pending',
        idempotencyKey: idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };

      db.insert(schema.bookings).values(booking1).run();

      // Attempting to insert with the same idempotency key should fail
      expect(() => {
        const booking2: schema.NewBooking = {
          id: uuidv4(),
          providerId: testProviderId,
          serviceType: 'coloring',
          scheduledAt: now,
          duration: 90,
          status: 'pending',
          idempotencyKey: idempotencyKey, // Same key!
          createdAt: now,
          updatedAt: now,
        };
        db.insert(schema.bookings).values(booking2).run();
      }).toThrow();
    });

    it('should enforce foreign key constraint on provider_id', () => {
      const now = new Date();

      expect(() => {
        sqlite.prepare(`
          INSERT INTO bookings (id, provider_id, service_type, scheduled_at, duration, status, idempotency_key, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          'non_existent_provider', // Invalid provider ID
          'haircut',
          now.getTime(),
          60,
          'pending',
          `fk-test:${uuidv4()}`,
          now.getTime(),
          now.getTime()
        );
      }).toThrow();
    });
  });

  describe('Messages Table', () => {
    let testSessionId: string;

    beforeAll(() => {
      const now = new Date();
      testSessionId = uuidv4();

      db.insert(schema.sessions).values({
        id: testSessionId,
        userId: 'test_user',
        status: 'active',
        createdAt: now,
        lastActivityAt: now,
      }).run();
    });

    it('should store and retrieve messages with JSON content', () => {
      const now = new Date();
      const messageId = uuidv4();
      const messageContent: schema.MessageContent[] = [
        { type: 'text', text: 'Hello, I need a haircut' },
      ];

      const message: schema.NewMessage = {
        id: messageId,
        sessionId: testSessionId,
        role: 'user',
        content: messageContent,
        createdAt: now,
      };

      db.insert(schema.messages).values(message).run();

      const results = db.select().from(schema.messages).where(eq(schema.messages.id, messageId)).all();
      const retrieved = results[0];

      expect(retrieved).toBeDefined();
      expect(retrieved?.role).toBe('user');
      expect(retrieved?.content).toEqual(messageContent);
    });

    it('should store messages with tool_use content', () => {
      const now = new Date();
      const messageId = uuidv4();
      const messageContent: schema.MessageContent[] = [
        {
          type: 'tool_use',
          id: 'tool_123',
          name: 'search_providers',
          input: { category: 'salon' },
        },
      ];

      const message: schema.NewMessage = {
        id: messageId,
        sessionId: testSessionId,
        role: 'assistant',
        content: messageContent,
        createdAt: now,
      };

      db.insert(schema.messages).values(message).run();

      const results = db.select().from(schema.messages).where(eq(schema.messages.id, messageId)).all();
      const retrieved = results[0];

      expect(retrieved?.content[0]).toMatchObject({
        type: 'tool_use',
        name: 'search_providers',
      });
    });

    it('should retrieve messages by session in chronological order', () => {
      const sessionId = uuidv4();
      const now = new Date();

      db.insert(schema.sessions).values({
        id: sessionId,
        createdAt: now,
        lastActivityAt: now,
      }).run();

      // Insert messages with different timestamps
      for (let i = 0; i < 3; i++) {
        db.insert(schema.messages).values({
          id: uuidv4(),
          sessionId: sessionId,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: [{ type: 'text', text: `Message ${i + 1}` }],
          createdAt: new Date(now.getTime() + i * 1000),
        }).run();
      }

      const messages = db.select()
        .from(schema.messages)
        .where(eq(schema.messages.sessionId, sessionId))
        .orderBy(schema.messages.createdAt)
        .all();

      expect(messages.length).toBe(3);
      expect((messages[0].content[0] as { text: string }).text).toBe('Message 1');
      expect((messages[2].content[0] as { text: string }).text).toBe('Message 3');
    });
  });

  describe('Workflow States Table', () => {
    let testSessionId: string;

    beforeAll(() => {
      const now = new Date();
      testSessionId = uuidv4();

      db.insert(schema.sessions).values({
        id: testSessionId,
        userId: 'test_user',
        status: 'active',
        createdAt: now,
        lastActivityAt: now,
      }).run();
    });

    it('should create and retrieve workflow state', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const workflowId = uuidv4();

      const workflow: schema.NewWorkflowState = {
        id: workflowId,
        sessionId: testSessionId,
        currentState: 'PROVIDER_SEARCH',
        status: 'active',
        context: {
          serviceType: 'haircut',
          location: 'downtown',
        },
        createdAt: now,
        lastUpdated: now,
        expiresAt: expiresAt,
      };

      db.insert(schema.workflowStates).values(workflow).run();

      const results = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflowId)).all();
      const retrieved = results[0];

      expect(retrieved).toBeDefined();
      expect(retrieved?.currentState).toBe('PROVIDER_SEARCH');
      expect(retrieved?.context.serviceType).toBe('haircut');
    });

    it('should allow multiple workflows per session', () => {
      const sessionId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      db.insert(schema.sessions).values({
        id: sessionId,
        createdAt: now,
        lastActivityAt: now,
      }).run();

      // Create two workflows for the same session
      const workflow1: schema.NewWorkflowState = {
        id: uuidv4(),
        sessionId: sessionId,
        currentState: 'PROVIDER_SEARCH',
        status: 'active',
        context: { serviceType: 'haircut' },
        createdAt: now,
        lastUpdated: now,
        expiresAt: expiresAt,
      };

      const workflow2: schema.NewWorkflowState = {
        id: uuidv4(),
        sessionId: sessionId,
        currentState: 'PROVIDER_SELECTION',
        status: 'active',
        context: { serviceType: 'oil change' },
        createdAt: now,
        lastUpdated: now,
        expiresAt: expiresAt,
      };

      db.insert(schema.workflowStates).values(workflow1).run();
      db.insert(schema.workflowStates).values(workflow2).run();

      const workflows = db.select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.sessionId, sessionId))
        .all();

      expect(workflows.length).toBe(2);
    });

    it('should update workflow state and context', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const workflowId = uuidv4();

      db.insert(schema.workflowStates).values({
        id: workflowId,
        sessionId: testSessionId,
        currentState: 'PROVIDER_SEARCH',
        status: 'active',
        context: {},
        createdAt: now,
        lastUpdated: now,
        expiresAt: expiresAt,
      }).run();

      // Update the workflow
      db.update(schema.workflowStates)
        .set({
          currentState: 'PROVIDER_SELECTION',
          context: { selectedProviderId: 'provider_123' },
          lastUpdated: new Date(),
        })
        .where(eq(schema.workflowStates.id, workflowId))
        .run();

      const results = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflowId)).all();
      const updated = results[0];

      expect(updated?.currentState).toBe('PROVIDER_SELECTION');
      expect(updated?.context.selectedProviderId).toBe('provider_123');
    });
  });
});
