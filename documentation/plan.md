# Implementation Plan: Service Booking Assistant

**Version:** 1.1
**Date:** 2025-12-17
**Status:** In Progress

---

## Overview

This document outlines the implementation plan for the Service Booking Assistant, broken into 10 incremental milestones. Each milestone builds on the previous one, delivers testable functionality, and is sized for a single pull request.

**Key Principles:**
- Each milestone adds new, testable functionality
- Comprehensive testing at each stage (unit, integration, manual QA)
- Incremental complexity - simple first, advanced features later
- Each milestone can be demonstrated to stakeholders
- **Riskier components (WebSocket + AI) validated early before REST APIs**

---

## Milestone 1: Project Setup & Database Foundation

**Goal:** Establish project infrastructure, database schema, seed data, and development workflow

### Features
- [x] Backend project structure with TypeScript configuration
- [ ] Frontend project structure with React + Vite + Tailwind
- [x] SQLite database setup with Drizzle ORM
- [x] Database schema implementation (providers, bookings, messages, workflows)
- [x] Database migrations and seed scripts with mock data
- [x] Development scripts (dev, build, test)
- [x] Environment variable configuration

### Implementation Tasks
- [x] Initialize backend with Express + TypeScript + nodemon
- [ ] Configure ESLint + Prettier for both frontend and backend
- [x] Install dependencies: `sqlite3`, `drizzle-orm`, `drizzle-kit`
- [x] Create schema file: `backend/src/db/schema.ts`
  - [x] `providers` table with working hours JSON
  - [x] `bookings` table with idempotency key
  - [x] `messages` table for conversation history
  - [x] `workflow_states` table with workflow ID pattern
  - [x] `sessions` table
- [x] Create database connection module: `backend/src/db/index.ts`
- [x] Create migration runner: `drizzle.config.ts`
- [x] **Create seed script: `backend/src/db/seed.ts`**
  - [x] Script to generate 8-10 realistic mock providers
  - [x] Mix of categories: 3 salons, 3 mechanics, 2 dentists, 2 other
  - [x] Varied working hours (some weekdays only, some weekends)
  - [x] Ratings between 3.5 - 5.0 stars
  - [x] Realistic addresses/locations
  - [x] Services offered list for each provider
- [x] Create npm script: `npm run db:seed` to populate database

### Testing
- [x] **Unit Tests:**
  - [x] Database connection module initializes correctly
  - [x] Database connection handles errors gracefully
  - [x] Schema validation for all tables (correct columns, types, constraints)
  - [x] Schema relationships (foreign keys) defined correctly
  - [x] Seed script generates expected number of providers
  - [x] Seed script creates providers with valid data (no nulls where required)
  - [x] Seed script is idempotent (can run multiple times safely)
  - [x] Migration runner applies migrations in correct order
  - [x] Migration runner tracks applied migrations
  - [x] **Additional unit tests to ensure full coverage of all database utility functions**
- [x] **Integration Tests:**
  - [x] Run migrations and verify tables created
  - [x] Create provider record and retrieve it
  - [x] Create booking with idempotency key (duplicate returns same record)
  - [x] Query providers by category
  - [x] Query providers with multiple filters
  - [x] Insert message and retrieve by session ID
  - [x] Create workflow state and update state transitions
- [x] **Manual QA:**
  - [x] Run `npm run db:migrate` successfully
  - [x] Run `npm run db:seed` and verify data in SQLite browser
  - [x] Verify all indexes are created (check with `.schema` in sqlite3)
  - [x] Verify foreign key constraints work
  - [x] Re-run seed script and confirm no duplicates/errors
- [ ] **User Acceptance:**
  - [ ] Developer can run setup in <5 minutes per README
  - [x] Database structure matches ERD schema exactly
  - [x] Seed data looks realistic and varied

**Deliverable:** Working database with realistic seed data, testable via SQL queries

---

## Milestone 2: WebSocket Chat Foundation ✅

**Goal:** Establish real-time chat infrastructure without AI integration (echo bot for testing)

### Features
- [x] WebSocket server setup (Socket.io)
- [x] WebSocket client in React
- [x] Message persistence to database
- [x] Session management
- [x] Basic chat UI with message history
- [x] Simple echo bot for testing (repeats user messages)

### Implementation Tasks
- [x] Install dependencies: `socket.io`, `socket.io-client`
- [x] Create WebSocket server: `backend/src/websocket/chat-handler.ts`
  - [x] `connection` event - create or resume session
  - [x] `user_message` event - save message to DB, emit echo response
  - [x] `disconnect` event - update session status
- [x] Create message service: `backend/src/services/message-service.ts`
  - [x] `saveMessage(sessionId, role, content)`
  - [x] `getMessageHistory(sessionId)`
  - [x] `deleteMessageHistory(sessionId)` (for testing)
- [x] Wire up WebSocket server in `backend/src/index.ts`
- [x] Frontend: Create WebSocket hook: `frontend/src/hooks/useWebSocket.ts`
  - [x] Connection management
  - [x] Event listeners
  - [x] Reconnection logic
- [x] Frontend: Create chat components:
  - [x] `ChatContainer.tsx` - Main chat layout
  - [x] `MessageList.tsx` - Display message history with auto-scroll
  - [x] `MessageBubble.tsx` - Uses existing ChatMessage component
  - [x] `ChatInput.tsx` - Text input with send button and keyboard shortcuts
- [x] Frontend: Implement message state with Zustand: `frontend/src/store/chat-store.ts`
  - [x] Messages array
  - [x] Add message action
  - [x] Clear messages action
- [x] Frontend: Connect WebSocket to UI in `App.tsx`

### Testing
- [x] **Unit Tests:**
  - [x] Message service saves message with correct timestamp
  - [x] Message service retrieves messages in chronological order
  - [x] Message service handles empty session (returns empty array)
  - [x] Message service validates input parameters
  - [x] Zustand store updates messages correctly
  - [x] Zustand store clears messages
  - [x] Zustand store adds messages in correct order
  - [x] WebSocket hook initializes connection
  - [x] WebSocket hook handles connection errors
  - [x] WebSocket hook handles disconnection
  - [x] **Additional unit tests to ensure full coverage of all WebSocket and message functions**
- [x] **Integration Tests:**
  - [x] WebSocket connection established on client connect
  - [x] `user_message` event saves to database
  - [x] Server emits `assistant_message` event (echo test)
  - [x] Message history loaded on session resume
  - [x] Multiple messages persist correctly
  - [x] Disconnection updates session status in database
- [ ] **Manual QA (Browser):**
  - [ ] Open chat UI and send message
  - [ ] Verify message appears in UI immediately
  - [ ] Verify echo response appears
  - [ ] Refresh page and verify message history persists
  - [ ] Open DevTools Network tab and verify WebSocket connection active
  - [ ] Send multiple rapid messages and verify all appear
  - [ ] Test with long messages (1000+ characters)
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Open browser to chat page
  - [ ] Type message and click send
  - [ ] Assert message appears in chat history
  - [ ] Assert echo response appears
  - [ ] Reload page and verify messages persist
  - [ ] Test Enter key to send message
- [ ] **User Acceptance:**
  - [ ] Chat UI matches design system (component-library.md)
  - [ ] Messages display with correct styling (user vs assistant)
  - [ ] Smooth scrolling to latest message
  - [ ] Echo bot confirms WebSocket bidirectional communication works

**Deliverable:** Working chat interface with WebSocket and message persistence (echo bot validates infrastructure)

---

## Milestone 3: AI Integration - Basic Conversation ✅

**Goal:** Integrate Claude SDK for multi-turn conversations without tools (pure chat)

### Features
- [x] Claude SDK client initialization
- [x] AI Conversation Service (stateless wrapper)
- [x] Message history management
- [x] Streaming support with text deltas
- [x] Basic retry logic and error handling
- [ ] Extended Thinking display in UI (deferred to post-tooling)

### Implementation Tasks
- [x] Install dependency: `@anthropic-ai/sdk`
- [x] Create AI service: `backend/src/services/ai-conversation-service.ts`
  - [x] Initialize single global `Anthropic` client
  - [x] `sendMessage(sessionId, userMessage)` method
  - [x] Load message history from database
  - [x] Call `messages.stream()` with streaming enabled
  - [x] Parse streaming events (text, message_complete)
  - [x] Save assistant response to database
- [x] Streaming handler integrated directly in AI service
  - [x] Emit `text_delta` events via callback
  - [x] Emit `message_complete` event
- [x] Update WebSocket handler to call AI service on `user_message`
- [x] Replace echo bot with real AI integration
- [x] Frontend: Handle streaming events in WebSocket hook
  - [x] Append text deltas to active message
- [x] Frontend: Update UI to display streaming text
- [x] Add retry logic with exponential backoff (5 attempts max, 1s/2s/4s/8s/16s delays)
- [x] Add timeout protection (30 seconds)
- [x] Add error handling for API failures

### Testing
- [x] **Unit Tests:**
  - [x] AI service constructs messages array in correct format
  - [x] AI service handles empty message history
  - [x] Retry logic triggers on 5xx errors
  - [x] Retry logic does NOT trigger on 4xx errors
  - [x] Retry logic uses exponential backoff
  - [x] Timeout configuration
  - [x] AIError class tests
  - [x] isRetryableError function tests
  - [x] getRetryDelays function tests
- [x] **Integration Tests:**
  - [x] WebSocket connection and message flow
  - [x] Streaming events emitted correctly

**Deliverable:** Working AI chat with streaming and multi-turn conversation context

---

## Milestone 4: REST API - Provider Endpoints ✅

**Goal:** Implement provider search and retrieval endpoints with text search

### Features
- [x] GET `/api/providers` - Search providers with optional text query
- [x] GET `/api/providers/:id` - Get provider details
- [x] Request validation middleware (Zod)
- [x] Error handling middleware

### Implementation Tasks
- [x] Create route handlers: `backend/src/routes/providers.ts`
  - [x] GET `/` - List/search providers with optional `q` query param
  - [x] GET `/:id` - Get single provider
- [x] Create service layer: `backend/src/services/provider-service.ts`
  - [x] `searchProviders(query?)` - Text search across category, services, description
  - [x] `getProviderById(id)` - Get single provider
  - [x] `getAllProviders()` - Get all providers
  - [x] Results ordered by rating descending
- [x] Create validation schemas: `backend/src/validation/provider-schemas.ts`
  - [x] Provider query params schema (`q` optional)
  - [x] Provider ID schema (UUID validation)
- [x] Create error handling middleware: `backend/src/middleware/error-handler.ts`
  - [x] Handle Zod validation errors (400)
  - [x] Handle NotFoundError (404)
  - [x] Handle generic errors (500)
  - [x] ApiError and NotFoundError classes
- [x] Wire up routes in `backend/src/index.ts`
- [x] Refactored app setup into `backend/src/app.ts` for testability

### Testing
- [x] **Unit Tests (18 tests):**
  - [x] searchProviders returns all when no query
  - [x] searchProviders returns all with empty query
  - [x] searchProviders orders by rating descending
  - [x] searchProviders finds by category (case-insensitive)
  - [x] searchProviders finds by description
  - [x] searchProviders finds by service in JSON array
  - [x] searchProviders finds by partial service match
  - [x] searchProviders returns empty when no matches
  - [x] searchProviders finds across multiple criteria
  - [x] searchProviders trims whitespace
  - [x] getProviderById returns provider when found
  - [x] getProviderById returns null for not found
  - [x] getProviderById returns null for empty/whitespace ID
  - [x] getAllProviders returns all and orders correctly
- [x] **Integration Tests (11 tests):**
  - [x] GET `/api/providers` returns all providers
  - [x] GET `/api/providers` orders by rating descending
  - [x] GET `/api/providers?q=salon` filters by category
  - [x] GET `/api/providers?q=haircut` filters by service
  - [x] GET `/api/providers?q=luxury` filters by description
  - [x] GET `/api/providers?q=nonexistent` returns empty array
  - [x] GET `/api/providers` performs case-insensitive search
  - [x] GET `/api/providers/:id` returns provider details
  - [x] GET `/api/providers/:id` returns 404 for not found
  - [x] GET `/api/providers/:id` returns 400 for invalid UUID
  - [x] Error handling returns proper JSON format

### Notes
- Text search uses SQLite LIKE queries across category, description, and services JSON array
- Future enhancement: `GET /api/categories` endpoint for dynamic category discovery (added to PRD)

**Deliverable:** Functional provider search and retrieval API with text search

---

## Milestone 6: REST API - Booking Endpoints

**Goal:** Implement booking creation and retrieval endpoints

### Features
- [ ] GET `/api/bookings` - Get booking history
- [ ] POST `/api/bookings` - Create booking (with idempotency)
- [ ] GET `/api/bookings/:id` - Get booking details
- [ ] GET `/api/sessions/:id` - Get session details

### Implementation Tasks
- [ ] Create route handlers: `backend/src/routes/bookings.ts`
  - [ ] GET `/` - List bookings
  - [ ] POST `/` - Create booking with idempotency check
  - [ ] GET `/:id` - Get single booking
- [ ] Create route handlers: `backend/src/routes/sessions.ts`
  - [ ] GET `/:id` - Get session details
- [ ] Create service layer: `backend/src/services/booking-service.ts`
  - [ ] `createBooking(data, idempotencyKey)` - Create with idempotency
  - [ ] `getBookingById(id)` - Get single booking
  - [ ] `getBookingsByUser(userId)` - Get user's bookings
  - [ ] `checkIdempotency(key)` - Check if booking exists
- [ ] Create service layer: `backend/src/services/session-service.ts`
  - [ ] `createSession()` - Create new session
  - [ ] `getSession(id)` - Get session details
  - [ ] `updateSession(id, data)` - Update session
- [ ] Create validation schemas: `backend/src/validation/booking-schemas.ts`
  - [ ] Booking creation schema
  - [ ] Booking query schema
- [ ] Update error handling middleware to handle booking-specific errors

### Testing
- [ ] **Unit Tests:**
  - [ ] Booking service creates booking with all required fields
  - [ ] Booking service generates idempotency key correctly
  - [ ] Booking service detects duplicate idempotency keys
  - [ ] Booking service returns existing booking on duplicate
  - [ ] Booking service validates booking data
  - [ ] Booking service gets booking by ID
  - [ ] Booking service handles non-existent booking
  - [ ] Session service creates session with unique ID
  - [ ] Session service retrieves session
  - [ ] Session service updates session
  - [ ] Validation schema accepts valid booking data
  - [ ] Validation schema rejects missing required fields
  - [ ] Validation schema rejects invalid time format
  - [ ] **Additional unit tests to ensure full coverage of all booking and session service functions**
- [ ] **Integration Tests:**
  - [ ] POST `/api/bookings` creates booking and returns 201
  - [ ] POST `/api/bookings` with duplicate idempotency key returns existing booking (200)
  - [ ] GET `/api/bookings` returns booking list
  - [ ] GET `/api/bookings/:id` returns booking details
  - [ ] GET `/api/bookings/invalid-id` returns 404
  - [ ] Invalid request body returns 400 with error details
  - [ ] GET `/api/sessions/:id` returns session details
  - [ ] Session updates persist correctly
- [ ] **Manual QA (Postman/curl):**
  - [ ] Create booking and verify in database
  - [ ] Attempt duplicate booking and confirm idempotency works
  - [ ] Fetch bookings and verify response format
  - [ ] Get booking by ID and verify details
  - [ ] Send invalid payload and verify error response
  - [ ] Create session and verify returned session ID
- [ ] **User Acceptance:**
  - [ ] All booking endpoints documented in README
  - [ ] Example requests/responses provided
  - [ ] Idempotency prevents duplicate bookings

**Deliverable:** Functional booking and session API with idempotency, testable with Postman

---

## Milestone 5: Tool Execution - Provider Search & Display ✅

**Goal:** Implement tool-based provider search with UI card display

### Features
- [x] Tool registry system
- [x] Tool execution loop (detect → execute → return → repeat)
- [x] `search_providers` tool implementation
- [x] `display_provider_cards` tool implementation
- [x] Provider card UI components (side panel with ProviderCard, RatingStars, ProviderPanel)
- [x] Tool progress events ("Searching providers...")

### Implementation Tasks
- [x] Create tool registry: `backend/src/tools/tool-registry.ts`
  - [x] Tool interface: `{ name, description, inputSchema, execute }`
  - [x] Tool registration map
  - [x] Tool execution dispatcher
  - [x] Tool validation
- [x] Create tools: `backend/src/tools/`
  - [x] `search-providers.ts` - Query database with filters from AI
  - [x] `display-provider-cards.ts` - Takes provider IDs, looks up from DB, emits UI event
- [x] Update AI service to include tools in `messages.create()`
- [x] Create tool execution loop: `backend/src/services/tool-executor.ts`
  - [x] Detect `stop_reason === "tool_use"`
  - [x] Execute tool by name with input
  - [x] Validate tool input against schema
  - [x] Construct `tool_result` message
  - [x] Recursively call AI service until `stop_reason === "end_turn"`
  - [x] Handle tool execution errors
- [x] Update WebSocket handler to emit `tool_start` and `tool_complete` events
- [x] Frontend: Create provider panel components:
  - [x] `ProviderCard.tsx` - Card with name, rating, services, address
  - [x] `ProviderPanel.tsx` - Side panel with scrollable provider list
  - [x] `RatingStars.tsx` - Star rating component
- [x] Frontend: Handle `display_providers` event in WebSocket hook
- [x] Frontend: Add provider panel to App.tsx with slide-in animation

### Testing
- [x] **Unit Tests:**
  - [x] Tool registry registers tools correctly
  - [x] Tool registry returns correct tool by name
  - [x] Tool registry handles non-existent tool
  - [x] Tool registry validates tool schema
  - [x] `search_providers` filters by category
  - [x] `search_providers` filters by rating
  - [x] `search_providers` sorts by rating
  - [x] `search_providers` handles no results
  - [x] `display_provider_cards` looks up providers by IDs
  - [x] `display_provider_cards` emits display event via callback
  - [x] `display_provider_cards` handles not found providers
  - [x] Tool executor detects tool_use stop reason
  - [x] Tool executor constructs tool_result message correctly
  - [x] Tool executor handles tool execution errors
  - [x] Tool executor validates tool input
  - [x] Tool executor handles recursive calls
  - [x] Panel store tests (open, close, update providers)
  - [x] RatingStars component tests (star rendering, review count)
- [x] **Integration Tests:**
  - [x] User message "Find me a salon" triggers `search_providers` tool
  - [x] Tool returns provider results
  - [x] AI receives tool results and generates response
  - [x] `display_provider_cards` emits UI event with data
  - [x] Full loop completes with end_turn
  - [x] Multiple tool calls in sequence work correctly
  - [x] Tool execution errors handled gracefully
- [x] **Manual QA (Browser/Playwright):**
  - [x] Send "Find me a salon"
  - [x] Verify provider panel slides in from right
  - [x] Verify provider cards appear with name, category, rating, services, address
  - [x] Verify AI explains results conversationally
  - [x] Test close button - panel closes, chat expands
  - [x] Test new search - panel updates with different providers (mechanics)
  - [x] Verify animations are smooth
- [x] **User Acceptance:**
  - [x] Provider cards match design system
  - [x] Search results are relevant to user request
  - [x] Side panel UX is intuitive
  - [x] AI explains search results naturally without duplicating card details

**Deliverable:** AI can search providers via tools and display results as interactive cards

---

## Milestone 7: Workflow State Engine

**Goal:** Implement stateful booking workflows with state machine

### Features
- [ ] Workflow state machine definition
- [ ] Workflow state persistence (workflow ID pattern)
- [ ] State transition logic with validation
- [ ] Support for multiple active workflows per session
- [ ] Workflow context storage
- [ ] Workflow timeout and abandonment

### Implementation Tasks
- [ ] Create state machine: `backend/src/workflows/booking-state-machine.ts`
  - [ ] Define states: `PROVIDER_SEARCH`, `PROVIDER_SELECTION`, `TIME_SELECTION`, `CONFIRMATION`, `BOOKING_CREATED`
  - [ ] Define valid transitions map
  - [ ] `canTransition(from, to)` - Validate transitions
  - [ ] `getNextStates(current)` - Get valid next states
- [ ] Create workflow service: `backend/src/services/workflow-service.ts`
  - [ ] `createWorkflow(sessionId)` - Generate unique workflow ID
  - [ ] `getWorkflow(workflowId)` - Get workflow by ID
  - [ ] `getActiveWorkflows(sessionId)` - Get all active workflows
  - [ ] `transitionState(workflowId, newState, context)` - Perform state transition
  - [ ] `completeWorkflow(workflowId)` - Mark as completed
  - [ ] `abandonWorkflow(workflowId)` - Mark as abandoned
  - [ ] `updateContext(workflowId, context)` - Update workflow context
- [ ] Create workflow manager: `backend/src/workflows/workflow-manager.ts`
  - [ ] Integrate with tool execution
  - [ ] Track workflow context (selected provider, time slot, etc.)
  - [ ] Pass workflow state to AI as system context
  - [ ] Handle workflow lifecycle events
- [ ] Update tools to use workflow context:
  - [ ] `search_providers` creates new workflow if none active
  - [ ] `display_provider_cards` stores workflow ID in UI event
- [ ] Create new tool: `select_provider.ts` - Transitions to TIME_SELECTION
- [ ] Frontend: Track active workflow ID in Zustand store
- [ ] Frontend: Pass workflow ID with provider selection

### Testing
- [ ] **Unit Tests:**
  - [ ] State machine defines all states correctly
  - [ ] State machine validates legal transitions
  - [ ] State machine rejects invalid transitions
  - [ ] State machine returns valid next states
  - [ ] Workflow service generates unique IDs
  - [ ] Workflow service creates workflow with correct initial state
  - [ ] Workflow service retrieves correct workflow by ID
  - [ ] Workflow service handles non-existent workflow
  - [ ] Workflow service transitions state successfully
  - [ ] Workflow service rejects invalid state transitions
  - [ ] Workflow service updates context correctly
  - [ ] Workflow service completes workflow (status = completed)
  - [ ] Workflow service abandons workflow (status = abandoned)
  - [ ] Multiple workflows can exist per session
  - [ ] Workflow context persists across transitions
  - [ ] **Additional unit tests to ensure full coverage of all workflow functions**
- [ ] **Integration Tests:**
  - [ ] Create workflow and verify in database
  - [ ] Transition through states and verify persistence
  - [ ] Complete workflow and verify status updated
  - [ ] Create second workflow in same session (independent state)
  - [ ] Workflow context updates saved to database
  - [ ] Abandoned workflows don't interfere with active ones
- [ ] **Manual QA (Browser):**
  - [ ] Start booking flow: "Find me a salon"
  - [ ] Select provider
  - [ ] Verify workflow state persists in database (check via SQL)
  - [ ] Start second booking: "Also find a mechanic"
  - [ ] Verify two active workflows exist
  - [ ] Complete first booking and verify status
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Send: "Book a haircut"
  - [ ] Click provider card
  - [ ] Assert workflow transitions to TIME_SELECTION
  - [ ] Refresh page and verify state maintained
  - [ ] Start new booking and verify independent workflow
- [ ] **User Acceptance:**
  - [ ] User can have multiple booking flows in single conversation
  - [ ] Workflow state survives page refresh
  - [ ] AI maintains context within each workflow
  - [ ] State transitions are logical and validated

**Deliverable:** Stateful booking workflows with multi-booking support and state machine validation

---

## Milestone 8: Booking Flow - Time Slots & Confirmation ✅ COMPLETE

**Goal:** Complete end-to-end booking flow with time selection and confirmation

### Features
- [x] Time slot generation based on provider working hours
- [x] **Mock availability using hash-based deterministic patterns** (no fake bookings in DB)
- [x] Time slot filtering (remove past times)
- [x] `get_availability` tool (AI query, read-only - for conversational use)
- [x] `select_provider` tool (opens booking modal from chat)
- [x] **Click on ProviderCard opens detail modal** (user-initiated booking flow)
- [x] Booking confirmation UI (modal with 3 views: details, confirmation, success)
- [x] Workflow completion on successful booking
- [x] Chat disabled while booking modal is open

### Implementation Tasks
- [x] Create mock availability utility: `backend/src/utils/mock-availability.ts`
  - [x] `hashProviderDate(providerId, date)` - Deterministic hash function
  - [x] `applyMockPattern(slots, busyLevel, providerId, date)` - Apply one of 4 busy-level patterns
  - [x] Pattern 0: Fully available (no changes)
  - [x] Pattern 1: Light busy (2-3 slots unavailable)
  - [x] Pattern 2: Moderate busy (~50% unavailable)
  - [x] Pattern 3: Heavy busy (only 2-3 slots available)
- [x] Create availability service: `backend/src/services/availability-service.ts`
  - [x] `generateTimeSlots(providerId, date)` - Based on working hours
  - [x] `filterPastSlots(slots)` - Remove past times
  - [x] `getAvailableSlots(providerId, date)` - Combined logic + mock patterns
  - [x] Return slots in 30-minute increments
- [x] Create tools: `backend/src/tools/`
  - [x] `get-availability.ts` - Query availability for AI conversation (returns data, no UI)
  - [x] `select-provider.ts` - Opens booking modal, transitions workflow to TIME_SELECTION
- [x] Add REST endpoint: `GET /api/providers/:id/availability`
- [x] Update POST /api/bookings to accept optional workflowId and complete workflow
- [x] Add `onOpenProviderDetail` callback to tool executor
- [x] Frontend: Create booking store: `frontend/src/store/booking-store.ts`
- [x] Frontend: Make ProviderCard clickable to open modal
- [x] Frontend: Create time slot components:
  - [x] `TimeSlotGrid.tsx` - Display available slots with date picker
  - [x] `TimeSlotButton.tsx` - Clickable time slot
  - [x] `ServiceSelector.tsx` - Service selection buttons
  - [x] `BookingConfirmation.tsx` - Confirmation view
  - [x] `ProviderDetailModal.tsx` - Main modal (details, confirmation, success views)
- [x] Frontend: Handle `open_provider_detail` WebSocket event
- [x] Frontend: Disable chat input while modal is open
- [x] Frontend: Add ProviderDetailModal to App.tsx
- [x] Update system prompt with select_provider and get_availability tool usage

### Testing
- [ ] **Unit Tests:**
  - [ ] Mock availability: hash produces consistent output for same inputs
  - [ ] Mock availability: hash distributes evenly across 4 patterns
  - [ ] Mock availability: Pattern 0 returns all slots available
  - [ ] Mock availability: Pattern 1 marks 2-3 slots as busy
  - [ ] Mock availability: Pattern 2 marks ~50% of slots as busy
  - [ ] Mock availability: Pattern 3 leaves only 2-3 slots available
  - [ ] Availability service generates correct slots for working hours
  - [ ] Availability service filters out past times
  - [ ] Availability service filters out real user bookings (not mock data)
  - [ ] Availability service handles no available slots
  - [ ] Availability service generates 30-minute increments
  - [ ] Availability service handles edge cases (midnight, start of day)
  - [ ] `get_availability` tool returns data without triggering UI events
  - [ ] Booking service creates booking with all required fields
  - [ ] Idempotency check prevents duplicate bookings
  - [ ] `confirm_booking` validates booking data
  - [ ] `create_booking` integrates with booking service
  - [ ] Workflow transitions to CONFIRMATION correctly
  - [ ] Workflow transitions to BOOKING_CREATED correctly
  - [ ] Workflow completes after booking created
  - [ ] **Additional unit tests to ensure full coverage of all availability and booking tool functions**
- [ ] **Integration Tests:**
  - [ ] Full booking flow: search → select → time → confirm → create
  - [ ] Verify booking in database after creation
  - [ ] Verify workflow status updated to "completed"
  - [ ] Attempt duplicate booking with same idempotency key (should return existing)
  - [ ] Time slots reflect real user bookings (conflicts removed)
  - [ ] Mock availability patterns vary by provider+date hash
  - [ ] Same provider+date returns consistent availability
  - [ ] User can cancel confirmation and select different time
  - [ ] REST endpoint `/api/providers/:id/availability` returns correct data
- [ ] **Manual QA (Browser):**
  - [ ] Complete full booking flow
  - [ ] Click "View Availability" button on provider card
  - [ ] Verify time slots only show future times
  - [ ] Verify time slots show mock busy patterns (not all available)
  - [ ] Confirm booking and verify confirmation message
  - [ ] Check database for created booking (no fake bookings stored)
  - [ ] Verify booking ID displayed
  - [ ] Verify all booking details correct
  - [ ] Book same slot and verify it's now unavailable (real booking)
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Send: "Book a salon appointment"
  - [ ] Select provider
  - [ ] Click "View Availability" button on provider card
  - [ ] Assert time slots appear (TimeSlotGrid component)
  - [ ] Click time slot
  - [ ] Assert confirmation dialog appears
  - [ ] Confirm booking
  - [ ] Assert success message with booking ID
  - [ ] Verify booking persists in database
- [ ] **User Acceptance:**
  - [ ] User can complete booking in <3 minutes
  - [ ] Time slots are accurate and available
  - [ ] Confirmation step prevents accidental bookings
  - [ ] Success message is clear and includes all details

**Deliverable:** Complete booking flow from search to confirmation with full workflow integration

---

## Milestone 9: Calendar Integration ✅

**Goal:** Integrate Google Calendar for automatic event creation on booking

**Note:** Scope was refined during implementation:
- User OAuth flow (not service account) - users connect their own calendars
- AI conflict detection tool deferred to future milestone
- Hamburger menu added for calendar settings access

### Features
- [x] Google Calendar API authentication (user OAuth flow)
- [x] Calendar event creation on successful booking
- [x] Error handling for calendar failures (booking still succeeds)
- [x] Store calendar event ID with booking
- [x] Hamburger menu with side drawer for calendar connection

### Implementation Tasks
- [x] Setup Google Cloud project and enable Calendar API
- [x] Create OAuth 2.0 credentials (Web application type)
- [x] Install dependency: `googleapis`
- [x] Create calendar connection service: `backend/src/services/calendar-connection-service.ts`
  - [x] `getOAuthUrl()` - Generate OAuth URL for user consent
  - [x] `exchangeCodeForTokens(code)` - Exchange auth code for tokens
  - [x] `getConnection(userId)` - Get stored connection from database
  - [x] `saveConnection(userId, tokens, email)` - Store/update tokens (upsert)
  - [x] `deleteConnection(userId)` - Remove calendar connection
  - [x] `refreshTokenIfNeeded(userId)` - Auto-refresh expired tokens
- [x] Create calendar service: `backend/src/services/calendar-service.ts`
  - [x] `isCalendarConnected()` - Check if user has calendar connected
  - [x] `getCalendarClient()` - Get authenticated calendar API client
  - [x] `checkConflicts(startTime, endTime)` - Query for overlapping events
  - [x] `createEvent(bookingDetails)` - Create calendar event
  - [x] `deleteEvent(eventId)` - Delete event (for cancellations)
  - [x] Error handling with graceful degradation
- [x] Create auth routes: `backend/src/routes/auth.ts`
  - [x] `GET /auth/google/url` - Get OAuth URL for connecting
  - [x] `GET /auth/google/callback` - Handle OAuth redirect
  - [x] `GET /auth/google/status` - Check connection status
  - [x] `POST /auth/google/disconnect` - Disconnect calendar
- [x] Update booking service:
  - [x] Create calendar event after booking created
  - [x] Store event ID in booking record
  - [x] Handle calendar errors gracefully (log but don't fail booking)
- [x] Add `calendar_connections` table to schema
- [x] Add `calendarEventId` field to bookings table (already existed)
- [x] Create frontend UI components:
  - [x] `HamburgerButton.tsx` - Animated hamburger icon
  - [x] `SideMenu.tsx` - Slide-in drawer with calendar settings
  - [x] `menu-store.ts` - Zustand store for menu state

### Testing
- [x] **Unit Tests:**
  - [x] Calendar connection service: getConnection, saveConnection, deleteConnection
  - [x] Calendar service: isCalendarConnected, checkConflicts, createEvent, deleteEvent
  - [x] Graceful handling when calendar not connected
- [ ] **Manual QA (Browser):**
  - [ ] Click hamburger menu and verify side drawer opens
  - [ ] Click "Connect Google Calendar" and complete OAuth flow
  - [ ] Verify connection status shows email after connecting
  - [ ] Click "Disconnect" and verify calendar removed
  - [ ] Create booking and verify event appears in Google Calendar
- [ ] **User Acceptance:**
  - [ ] Booking automatically appears in user's calendar when connected
  - [ ] Calendar failures don't break booking flow
  - [ ] Event details are complete and accurate

**Deliverable:** Calendar integration with user OAuth flow and automatic event creation

---

## Milestone 10: Production Readiness & Polish

**Goal:** Add reliability, observability, and production-grade error handling

### Features
- [ ] Structured logging throughout application
- [ ] Request tracing with unique request IDs
- [ ] LLM retry logic with exponential backoff (already partially done)
- [ ] LLM output validation and sanitization
- [ ] Error categorization and reporting
- [ ] Extended Thinking UI display (already done in Milestone 3)
- [ ] Tool progress events for all critical operations
- [ ] Graceful degradation for service failures
- [ ] Comprehensive README with setup instructions
- [ ] Environment variable validation on startup
- [ ] Markdown rendering in assistant messages (bold, italics, lists, line breaks)

### Implementation Tasks
- [ ] Install logging library: `pino` (fast, structured JSON logs)
- [ ] Create logger: `backend/src/utils/logger.ts`
  - [ ] Structured JSON logs
  - [ ] Log levels: debug, info, warn, error
  - [ ] Include timestamp, request ID, context
  - [ ] Pretty print in development
- [ ] Add request ID middleware: `backend/src/middleware/request-id.ts`
  - [ ] Generate UUID for each request
  - [ ] Attach to request object
  - [ ] Pass to logger
  - [ ] Return in response headers
- [ ] Update AI service with enhanced validation:
  - [ ] Validate AI response against expected schema
  - [ ] Retry with refined prompt on malformed output
  - [ ] Sanitize strings before database insertion (SQL injection protection)
  - [ ] Validate tool inputs from AI
- [ ] Add logging to all services:
  - [ ] Log workflow state transitions
  - [ ] Log tool executions with input/output
  - [ ] Log booking creations
  - [ ] Log calendar operations
  - [ ] Log AI API calls (request ID, latency, tokens)
- [ ] Add error categorization:
  - [ ] `llm_failure`, `db_error`, `calendar_error`, `validation_error`, `network_error`
  - [ ] Log category with each error
  - [ ] Include error context (stack trace, request payload)
- [ ] Frontend: Improve error messages
  - [ ] User-friendly error text (no technical jargon)
  - [ ] Retry buttons for transient failures
  - [ ] Graceful degradation UI
- [ ] Create comprehensive README:
  - [ ] Prerequisites (Node.js version, npm)
  - [ ] Setup instructions (clone, install, env vars)
  - [ ] Database setup (migrate, seed)
  - [ ] Running dev servers (backend + frontend)
  - [ ] Testing instructions (unit, integration, manual)
  - [ ] API documentation with examples
  - [ ] Troubleshooting guide (common issues)
- [ ] Add environment variable validation:
  - [ ] Check all required vars on startup
  - [ ] Fail fast with clear error message
  - [ ] List missing variables
- [ ] Create `.env.example` files for backend and frontend
- [ ] Frontend: Configure react-markdown for assistant message rendering
  - [ ] Integrate react-markdown component in MessageBubble
  - [ ] Add Tailwind styles for markdown elements (lists, bold, italic, code)
  - [ ] Handle line breaks and whitespace correctly
  - [ ] Sanitize HTML output to prevent XSS

### Testing
- [ ] **Unit Tests:**
  - [ ] Logger formats messages correctly
  - [ ] Logger includes all required fields (timestamp, level, context)
  - [ ] Request ID middleware generates unique IDs
  - [ ] Request ID middleware attaches ID to request
  - [ ] AI output validation detects malformed responses
  - [ ] AI output validation sanitizes inputs
  - [ ] Error categorization assigns correct categories
  - [ ] Error logging includes stack trace
  - [ ] Environment validation detects missing vars
  - [ ] Environment validation lists all missing vars
  - [ ] Markdown component renders bold text correctly
  - [ ] Markdown component renders italics correctly
  - [ ] Markdown component renders ordered lists correctly
  - [ ] Markdown component renders unordered lists correctly
  - [ ] Markdown component handles line breaks correctly
  - [ ] Markdown component sanitizes potentially unsafe HTML
  - [ ] **Additional unit tests to ensure full coverage of all logging and validation functions**
- [ ] **Integration Tests:**
  - [ ] Request ID propagates through full request lifecycle
  - [ ] All workflow transitions logged with context
  - [ ] Failed LLM calls trigger retries and logged
  - [ ] Logs written to stdout in correct format
  - [ ] Error categorization works end-to-end
  - [ ] Missing env vars prevent server startup
- [ ] **Manual QA (Logs):**
  - [ ] Trigger booking flow and review logs
  - [ ] Verify all state transitions logged
  - [ ] Verify request IDs match across related log entries
  - [ ] Trigger error and verify error log includes stack trace
  - [ ] Verify log format is JSON and parseable
  - [ ] Verify logs include timing information
- [ ] **Manual QA (Browser):**
  - [ ] Verify retry button works on transient errors
  - [ ] Verify error messages are user-friendly
  - [ ] Test graceful degradation (disable calendar API temporarily)
  - [ ] Verify bold text renders in assistant messages
  - [ ] Verify italics render in assistant messages
  - [ ] Verify ordered and unordered lists render correctly
  - [ ] Verify line breaks display properly
  - [ ] Test with complex markdown (nested lists, mixed formatting)
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Complete full booking flow
  - [ ] Assert no console errors
  - [ ] Assert all UI elements render correctly
  - [ ] Test error scenarios (invalid input, API failures)
  - [ ] Verify error messages displayed correctly
- [ ] **Manual QA (README):**
  - [ ] Follow README setup from scratch on clean machine
  - [ ] Verify all commands work as documented
  - [ ] Test troubleshooting steps
- [ ] **User Acceptance:**
  - [ ] Follow README setup from scratch successfully
  - [ ] All error messages are clear and actionable
  - [ ] Logs enable debugging of issues
  - [ ] Application handles failures gracefully

**Deliverable:** Production-ready application with comprehensive logging, error handling, and documentation

---

## Milestone 11: Experimental - Web Search Integration

**Goal:** Experiment with Claude's built-in web search tool to enhance provider information with real-time data

**Status:** Experimental / Optional

### Features
- [ ] Enable Claude web search via beta header
- [ ] Integrate web search as supplementary tool alongside custom tools
- [ ] Add caching layer for web search results
- [ ] Implement graceful fallback when web search fails
- [ ] Monitor latency impact on conversation flow

### Implementation Tasks
- [ ] Update AI service configuration:
  - [ ] Add `anthropic-beta: web-search-2025-03-05` header
  - [ ] Enable web search tool in tool list
  - [ ] Configure web search alongside existing custom tools
- [ ] Create web search wrapper: `backend/src/services/web-search-service.ts`
  - [ ] Cache web search results (5-minute TTL)
  - [ ] Rate limiting to prevent excessive searches
  - [ ] Timeout handling (fail fast if slow)
- [ ] Update system prompt to guide web search usage:
  - [ ] Use web search for real-time info (hours, closures, reviews)
  - [ ] Prefer structured data over web search when available
  - [ ] Cite sources when using web search results
- [ ] Add web search result display in UI:
  - [ ] Show source attribution for web-sourced info
  - [ ] Visual indicator when info came from web search
- [ ] Implement fallback behavior:
  - [ ] If web search times out, continue without it
  - [ ] If web search fails, log error and proceed normally
  - [ ] Never block booking flow on web search

### Use Cases to Test
- [ ] User asks about provider holiday hours (not in our database)
- [ ] User wants to see recent reviews for a provider
- [ ] User asks about services not in our provider data
- [ ] User asks general questions about service types

### Testing
- [ ] **Unit Tests:**
  - [ ] Web search caching works correctly
  - [ ] Cache TTL expires as expected
  - [ ] Rate limiting prevents excessive calls
  - [ ] Timeout handling works correctly
  - [ ] Fallback behavior triggers on failure
- [ ] **Integration Tests:**
  - [ ] Web search integrates with conversation flow
  - [ ] Web search results appear in AI responses
  - [ ] Conversation continues normally if web search fails
  - [ ] Latency remains acceptable (<2s additional)
- [ ] **Manual QA (Browser):**
  - [ ] Ask about provider holiday hours
  - [ ] Verify web search results displayed appropriately
  - [ ] Verify source attribution shown
  - [ ] Test with web search disabled (should still work)
- [ ] **Manual QA (Performance):**
  - [ ] Measure response time with web search enabled
  - [ ] Compare to baseline without web search
  - [ ] Verify latency impact is acceptable

### Success Criteria
- [ ] Web search provides useful supplementary information
- [ ] Latency impact <2 seconds additional per search
- [ ] Graceful degradation when web search unavailable
- [ ] User experience enhanced, not disrupted
- [ ] Clear source attribution for web-sourced info

### Considerations
- Web search adds external API latency
- Results may be inconsistent or outdated
- Should complement, not replace, structured provider data
- Monitor costs and usage patterns
- May require prompt tuning to use web search effectively

**Deliverable:** Optional web search integration that enhances provider information with real-time data

---

## Testing Strategy Summary

### Unit Tests
- **Location:** `backend/src/**/*.test.ts`, `frontend/src/**/*.test.tsx`
- **Framework:** Jest + Testing Library
- **Coverage Target:** 100% for all functions and branches
- **Run:** `npm test`
- **Coverage Report:** `npm run test:coverage`

### Integration Tests
- **Location:** `backend/tests/integration/**/*.test.ts`
- **Framework:** Jest + Supertest
- **Scope:** Full request/response cycles, database interactions, multi-component workflows
- **Run:** `npm run test:integration`

### Manual QA (Playwright MCP)
- **Tool:** Playwright MCP for automated browser testing
- **Scope:** Critical user flows, UI interactions, end-to-end scenarios
- **Approach:**
  - Launch Playwright via MCP
  - Navigate chat interface
  - Simulate user interactions
  - Assert UI state and responses

### Manual QA (User)
- **Scope:** Final acceptance testing by user
- **Checklist:**
  - [ ] Complete booking flow feels intuitive
  - [ ] UI matches design system
  - [ ] Performance is acceptable (<5s AI responses)
  - [ ] Error messages are helpful
  - [ ] Calendar integration works correctly
  - [ ] Logs are useful for debugging

---

## Definition of Done (Per Milestone)

A milestone is complete when:

1. **All checkboxes marked complete**
2. **All unit tests passing** (`npm test`)
3. **Full test coverage achieved** (100% coverage for all functions)
4. **All integration tests passing** (`npm run test:integration`)
5. **Manual QA completed** (browser + Playwright MCP)
6. **User acceptance criteria met**
7. **Code reviewed** (self-review + optional peer review)
8. **README updated** with new features/setup steps
9. **Pull request merged** to main branch

---

## Progress Tracking

**Current Milestone:** Milestone 6 (Booking Endpoints) ← Next milestone
**Overall Progress:** 5/11 milestones complete (45%)

### Milestone Completion Status
- [x] Milestone 1: Project Setup & Database Foundation
- [x] Milestone 2: WebSocket Chat Foundation
- [x] Milestone 3: AI Integration - Basic Conversation
- [x] Milestone 4: REST API - Provider Endpoints
- [x] Milestone 5: Tool Execution - Provider Search & Display ✅
- [x] Milestone 6: REST API - Booking Endpoints ✅
- [x] Milestone 7: Workflow State Engine ✅
- [x] Milestone 8: Booking Flow - Time Slots & Confirmation ✅
- [ ] **Milestone 9: Calendar Integration** ← Do this next
- [ ] Milestone 10: Production Readiness & Polish
- [ ] Milestone 11: Experimental - Web Search Integration (Optional)

---

## Notes & Decisions

### Milestone Order Rationale
- **Milestones 2-3 (WebSocket + AI) before REST APIs:** Validates riskier real-time infrastructure and AI integration early, before building CRUD operations
- **Milestone 4 (Provider Endpoints):** REST API foundation for provider data
- **Milestone 5 (Tool Execution) before Booking Endpoints:** Validates the riskier AI tool execution loop early, before building more CRUD operations. Tool execution is more complex and benefits from earlier testing.
- **Milestone 6 (Booking Endpoints):** CRUD operations for bookings, needed before completing booking flow
- **Milestones 7-8 (Workflows + Booking Flow):** State management then complete flow
- **Milestone 9 (Calendar):** Add-on feature that doesn't block core functionality
- **Milestone 10 (Observability):** Polish and production-readiness after all features work

### Dependencies Between Milestones
- Milestone 2 requires Milestone 1 (database schema for messages)
- Milestone 3 requires Milestone 2 (WebSocket infrastructure)
- Milestone 4 requires Milestone 1 (database schema for providers)
- Milestone 5 (Tool Execution) requires Milestones 3, 4 (AI service + provider data)
- Milestone 6 (Booking Endpoints) requires Milestone 1 (database schema for bookings)
- Milestone 7 requires Milestone 5 (tool execution)
- Milestone 8 requires Milestones 6, 7 (booking service + workflow state)
- Milestone 9 requires Milestone 8 (booking creation)
- Milestone 10 can run in parallel with 9 (incremental polish)

### Risks & Mitigations
- **Risk:** Claude API rate limits
  **Mitigation:** Implement exponential backoff, monitor token usage, upgrade plan if needed

- **Risk:** Google Calendar API quota (10k/day)
  **Mitigation:** Direct calls only, upgrade plan if needed (as per architecture decisions)

- **Risk:** WebSocket connection instability
  **Mitigation:** Reconnection logic, message queuing

- **Risk:** Scope creep
  **Mitigation:** Stick to MVP features, document future enhancements separately

### Future Enhancements (Post-MVP)
- Multi-user authentication
- Payment processing
- Advanced filtering and recommendations

---

**Last Updated:** 2025-12-17
**Next Review:** After Milestone 5 (Tool Execution) completion
