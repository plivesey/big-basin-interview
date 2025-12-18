import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Integration tests for database operations
 * These tests verify complete CRUD operations and complex queries
 */
describe('Database Integration Tests', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    // Create in-memory database for testing
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    db = drizzle(sqlite, { schema });

    // Create all tables
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
        current_workflow_id TEXT,
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
        context TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_updated INTEGER NOT NULL,
        completed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS workflow_session_id_idx ON workflow_states(session_id);
      CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
    `);
  });

  afterAll(() => {
    sqlite.close();
  });

  describe('Provider CRUD Operations', () => {
    const testProvider = {
      name: 'Integration Test Salon',
      category: 'salon',
      description: 'A test salon for integration testing',
      address: '123 Integration St',
      latitude: 37.7749,
      longitude: -122.4194,
      rating: 4.5,
      reviewCount: 100,
      phoneNumber: '555-0100',
      email: 'test@integration.com',
      website: 'https://integration-test.com',
      workingHours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: null,
        sunday: null,
      },
      services: ['haircut', 'coloring', 'styling'],
    };

    it('should complete full CRUD cycle for provider', () => {
      const now = new Date();
      const providerId = uuidv4();

      // CREATE
      db.insert(schema.providers).values({
        id: providerId,
        ...testProvider,
        createdAt: now,
        updatedAt: now,
      }).run();

      // READ
      const createdResults = db.select().from(schema.providers).where(eq(schema.providers.id, providerId)).all();
      const created = createdResults[0];
      expect(created).toBeDefined();
      expect(created?.name).toBe(testProvider.name);

      // UPDATE
      const newRating = 4.8;
      db.update(schema.providers)
        .set({ rating: newRating, updatedAt: new Date() })
        .where(eq(schema.providers.id, providerId))
        .run();

      const updatedResults = db.select().from(schema.providers).where(eq(schema.providers.id, providerId)).all();
      const updated = updatedResults[0];
      expect(updated?.rating).toBe(newRating);

      // DELETE
      db.delete(schema.providers)
        .where(eq(schema.providers.id, providerId))
        .run();

      const deletedResults = db.select().from(schema.providers).where(eq(schema.providers.id, providerId)).all();
      expect(deletedResults.length).toBe(0);
    });

    it('should filter providers by multiple criteria', () => {
      const now = new Date();

      // Insert test providers with various ratings and categories
      const providers = [
        { name: 'High Rated Salon', category: 'salon', rating: 4.9 },
        { name: 'Low Rated Salon', category: 'salon', rating: 3.5 },
        { name: 'High Rated Mechanic', category: 'mechanic', rating: 4.7 },
        { name: 'Low Rated Mechanic', category: 'mechanic', rating: 3.2 },
      ];

      for (const p of providers) {
        db.insert(schema.providers).values({
          id: uuidv4(),
          name: p.name,
          category: p.category,
          address: '123 Test St',
          latitude: 37.7749,
          longitude: -122.4194,
          rating: p.rating,
          workingHours: {},
          services: [],
          createdAt: now,
          updatedAt: now,
        }).run();
      }

      // Filter: salons with rating >= 4.0
      const highRatedSalons = db.select()
        .from(schema.providers)
        .where(
          and(
            eq(schema.providers.category, 'salon'),
            gte(schema.providers.rating, 4.0)
          )
        )
        .all();

      expect(highRatedSalons.length).toBeGreaterThanOrEqual(1);
      expect(highRatedSalons.every(p => p.category === 'salon')).toBe(true);
      expect(highRatedSalons.every(p => p.rating >= 4.0)).toBe(true);
    });
  });

  describe('Booking Operations with Idempotency', () => {
    let testProviderId: string;

    beforeAll(() => {
      const now = new Date();
      testProviderId = uuidv4();

      db.insert(schema.providers).values({
        id: testProviderId,
        name: 'Booking Integration Provider',
        category: 'salon',
        address: '456 Booking St',
        latitude: 37.7749,
        longitude: -122.4194,
        rating: 4.5,
        workingHours: {},
        services: ['haircut'],
        createdAt: now,
        updatedAt: now,
      }).run();
    });

    it('should handle idempotent booking creation', () => {
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const idempotencyKey = `idempotent:${uuidv4()}`;

      // First creation
      const bookingId = uuidv4();
      db.insert(schema.bookings).values({
        id: bookingId,
        providerId: testProviderId,
        serviceType: 'haircut',
        scheduledAt: scheduledAt,
        duration: 60,
        status: 'pending',
        idempotencyKey: idempotencyKey,
        createdAt: now,
        updatedAt: now,
      }).run();

      // Check for existing booking before second creation
      const existingResults = db.select()
        .from(schema.bookings)
        .where(eq(schema.bookings.idempotencyKey, idempotencyKey))
        .all();
      const existing = existingResults[0];

      expect(existing).toBeDefined();
      expect(existing?.id).toBe(bookingId);

      // Simulate idempotent behavior - return existing instead of creating new
      expect(existing?.idempotencyKey).toBe(idempotencyKey);
    });

    it('should update booking status through lifecycle', () => {
      const now = new Date();
      const bookingId = uuidv4();

      // Create booking
      db.insert(schema.bookings).values({
        id: bookingId,
        providerId: testProviderId,
        serviceType: 'haircut',
        scheduledAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        duration: 60,
        status: 'pending',
        idempotencyKey: `lifecycle:${uuidv4()}`,
        createdAt: now,
        updatedAt: now,
      }).run();

      // Update to confirmed
      db.update(schema.bookings)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(schema.bookings.id, bookingId))
        .run();

      let bookingResults = db.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId)).all();
      expect(bookingResults[0]?.status).toBe('confirmed');

      // Update to cancelled
      db.update(schema.bookings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(schema.bookings.id, bookingId))
        .run();

      bookingResults = db.select().from(schema.bookings).where(eq(schema.bookings.id, bookingId)).all();
      expect(bookingResults[0]?.status).toBe('cancelled');
    });
  });

  describe('Session and Message Operations', () => {
    it('should create session with messages and retrieve chronologically', () => {
      const now = new Date();
      const sessionId = uuidv4();

      // Create session
      db.insert(schema.sessions).values({
        id: sessionId,
        userId: 'test_user',
        createdAt: now,
        lastActivityAt: now,
      }).run();

      // Create conversation messages
      const conversation = [
        { role: 'user', content: [{ type: 'text' as const, text: 'Hi, I need a haircut' }] },
        { role: 'assistant', content: [{ type: 'text' as const, text: 'I can help you find a salon!' }] },
        { role: 'user', content: [{ type: 'text' as const, text: 'Great, show me options nearby' }] },
      ];

      for (let i = 0; i < conversation.length; i++) {
        db.insert(schema.messages).values({
          id: uuidv4(),
          sessionId: sessionId,
          role: conversation[i].role,
          content: conversation[i].content,
          createdAt: new Date(now.getTime() + i * 1000), // Stagger by 1 second
        }).run();
      }

      // Retrieve messages in order
      const messages = db.select()
        .from(schema.messages)
        .where(eq(schema.messages.sessionId, sessionId))
        .orderBy(schema.messages.createdAt)
        .all();

      expect(messages.length).toBe(3);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[2].role).toBe('user');
    });
  });

  describe('Workflow State Transitions', () => {
    let testSessionId: string;

    beforeAll(() => {
      const now = new Date();
      testSessionId = uuidv4();

      db.insert(schema.sessions).values({
        id: testSessionId,
        userId: 'workflow_test_user',
        createdAt: now,
        lastActivityAt: now,
      }).run();
    });

    it('should transition workflow through complete booking flow', () => {
      const now = new Date();
      const workflowId = uuidv4();

      // Create initial workflow in PROVIDER_SEARCH
      db.insert(schema.workflowStates).values({
        id: workflowId,
        sessionId: testSessionId,
        currentState: 'PROVIDER_SEARCH',
        context: { serviceType: 'haircut' },
        createdAt: now,
        lastUpdated: now,
      }).run();

      // Transition: PROVIDER_SEARCH -> PROVIDER_SELECTION
      db.update(schema.workflowStates)
        .set({
          currentState: 'PROVIDER_SELECTION',
          context: {
            serviceType: 'haircut',
            selectedProviders: ['provider_1', 'provider_2'],
          },
          lastUpdated: new Date(),
        })
        .where(eq(schema.workflowStates.id, workflowId))
        .run();

      let workflowResults = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflowId)).all();
      expect(workflowResults[0]?.currentState).toBe('PROVIDER_SELECTION');

      // Transition: PROVIDER_SELECTION -> TIME_SELECTION
      db.update(schema.workflowStates)
        .set({
          currentState: 'TIME_SELECTION',
          context: {
            serviceType: 'haircut',
            selectedProviderId: 'provider_1',
          },
          lastUpdated: new Date(),
        })
        .where(eq(schema.workflowStates.id, workflowId))
        .run();

      workflowResults = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflowId)).all();
      expect(workflowResults[0]?.currentState).toBe('TIME_SELECTION');

      // Transition: TIME_SELECTION -> CONFIRMATION
      db.update(schema.workflowStates)
        .set({
          currentState: 'CONFIRMATION',
          context: {
            serviceType: 'haircut',
            selectedProviderId: 'provider_1',
            selectedTimeSlot: '2025-01-15T10:00:00Z',
          },
          lastUpdated: new Date(),
        })
        .where(eq(schema.workflowStates.id, workflowId))
        .run();

      workflowResults = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflowId)).all();
      expect(workflowResults[0]?.currentState).toBe('CONFIRMATION');

      // Transition: CONFIRMATION -> BOOKING_CREATED
      db.update(schema.workflowStates)
        .set({
          currentState: 'BOOKING_CREATED',
          context: {
            serviceType: 'haircut',
            selectedProviderId: 'provider_1',
            selectedTimeSlot: '2025-01-15T10:00:00Z',
            bookingId: 'booking_123',
          },
          lastUpdated: new Date(),
        })
        .where(eq(schema.workflowStates.id, workflowId))
        .run();

      workflowResults = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflowId)).all();
      expect(workflowResults[0]?.currentState).toBe('BOOKING_CREATED');

      // Transition: BOOKING_CREATED -> COMPLETE
      db.update(schema.workflowStates)
        .set({
          currentState: 'COMPLETE',
          completedAt: new Date(),
          lastUpdated: new Date(),
        })
        .where(eq(schema.workflowStates.id, workflowId))
        .run();

      workflowResults = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflowId)).all();
      expect(workflowResults[0]?.currentState).toBe('COMPLETE');
      expect(workflowResults[0]?.completedAt).toBeDefined();
    });

    it('should support multiple workflows per session', () => {
      const now = new Date();

      // Create two workflows for the same session
      const workflow1Id = uuidv4();
      const workflow2Id = uuidv4();

      db.insert(schema.workflowStates).values({
        id: workflow1Id,
        sessionId: testSessionId,
        currentState: 'PROVIDER_SEARCH',
        context: { serviceType: 'haircut' },
        createdAt: now,
        lastUpdated: now,
      }).run();

      db.insert(schema.workflowStates).values({
        id: workflow2Id,
        sessionId: testSessionId,
        currentState: 'PROVIDER_SEARCH',
        context: { serviceType: 'oil change' },
        createdAt: now,
        lastUpdated: now,
      }).run();

      // Verify both exist and are independent
      const workflows = db.select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.sessionId, testSessionId))
        .all();

      const haircut = workflows.find(w => w.context.serviceType === 'haircut');
      const oilChange = workflows.find(w => w.context.serviceType === 'oil change');

      expect(haircut).toBeDefined();
      expect(oilChange).toBeDefined();

      // Progress one workflow, other should remain unchanged
      db.update(schema.workflowStates)
        .set({
          currentState: 'PROVIDER_SELECTION',
          lastUpdated: new Date(),
        })
        .where(eq(schema.workflowStates.id, workflow1Id))
        .run();

      const w1Results = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflow1Id)).all();
      const w2Results = db.select().from(schema.workflowStates).where(eq(schema.workflowStates.id, workflow2Id)).all();

      expect(w1Results[0]?.currentState).toBe('PROVIDER_SELECTION');
      expect(w2Results[0]?.currentState).toBe('PROVIDER_SEARCH'); // Unchanged
    });
  });

  describe('Index Performance', () => {
    it('should efficiently query messages by session_id using index', () => {
      const now = new Date();
      const sessionId = uuidv4();

      db.insert(schema.sessions).values({
        id: sessionId,
        createdAt: now,
        lastActivityAt: now,
      }).run();

      // Insert many messages
      for (let i = 0; i < 100; i++) {
        db.insert(schema.messages).values({
          id: uuidv4(),
          sessionId: sessionId,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: [{ type: 'text', text: `Message ${i}` }],
          createdAt: new Date(now.getTime() + i * 100),
        }).run();
      }

      // Query should use index
      const start = Date.now();
      const messages = db.select()
        .from(schema.messages)
        .where(eq(schema.messages.sessionId, sessionId))
        .all();
      const elapsed = Date.now() - start;

      expect(messages.length).toBe(100);
      expect(elapsed).toBeLessThan(1000); // Should be fast with index
    });

    it('should efficiently query workflows by session_id using index', () => {
      const now = new Date();
      const sessionId = uuidv4();

      // Create session with multiple workflows
      db.insert(schema.sessions).values({
        id: sessionId,
        createdAt: now,
        lastActivityAt: now,
      }).run();

      // Insert many workflows for this session
      for (let i = 0; i < 50; i++) {
        db.insert(schema.workflowStates).values({
          id: uuidv4(),
          sessionId: sessionId,
          currentState: 'PROVIDER_SEARCH',
          context: { iteration: i },
          createdAt: new Date(now.getTime() + i * 100),
          lastUpdated: new Date(now.getTime() + i * 100),
        }).run();
      }

      // Query workflows by session_id should use index
      const start = Date.now();
      const workflows = db.select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.sessionId, sessionId))
        .all();
      const elapsed = Date.now() - start;

      expect(workflows.length).toBe(50);
      expect(elapsed).toBeLessThan(1000); // Should be fast with index
    });
  });
});
