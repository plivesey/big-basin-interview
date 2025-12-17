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

## Milestone 2: WebSocket Chat Foundation

**Goal:** Establish real-time chat infrastructure without AI integration (echo bot for testing)

### Features
- [ ] WebSocket server setup (Socket.io)
- [ ] WebSocket client in React
- [ ] Message persistence to database
- [ ] Session management
- [ ] Basic chat UI with message history
- [ ] Simple echo bot for testing (repeats user messages)

### Implementation Tasks
- [ ] Install dependencies: `socket.io`, `socket.io-client`
- [ ] Create WebSocket server: `backend/src/websocket/chat-handler.ts`
  - [ ] `connection` event - create or resume session
  - [ ] `user_message` event - save message to DB, emit echo response
  - [ ] `disconnect` event - update session status
- [ ] Create message service: `backend/src/services/message-service.ts`
  - [ ] `saveMessage(sessionId, role, content)`
  - [ ] `getMessageHistory(sessionId)`
  - [ ] `deleteMessageHistory(sessionId)` (for testing)
- [ ] Wire up WebSocket server in `backend/src/index.ts`
- [ ] Frontend: Create WebSocket hook: `frontend/src/hooks/useWebSocket.ts`
  - [ ] Connection management
  - [ ] Event listeners
  - [ ] Reconnection logic
- [ ] Frontend: Create chat components:
  - [ ] `ChatContainer.tsx` - Main chat layout
  - [ ] `MessageList.tsx` - Display message history with auto-scroll
  - [ ] `MessageBubble.tsx` - Individual message (user vs assistant styling)
  - [ ] `ChatInput.tsx` - Text input with send button and keyboard shortcuts
- [ ] Frontend: Implement message state with Zustand: `frontend/src/store/chat-store.ts`
  - [ ] Messages array
  - [ ] Add message action
  - [ ] Clear messages action
- [ ] Frontend: Connect WebSocket to UI in `App.tsx`

### Testing
- [ ] **Unit Tests:**
  - [ ] Message service saves message with correct timestamp
  - [ ] Message service retrieves messages in chronological order
  - [ ] Message service handles empty session (returns empty array)
  - [ ] Message service validates input parameters
  - [ ] Zustand store updates messages correctly
  - [ ] Zustand store clears messages
  - [ ] Zustand store adds messages in correct order
  - [ ] WebSocket hook initializes connection
  - [ ] WebSocket hook handles connection errors
  - [ ] WebSocket hook handles disconnection
  - [ ] **Additional unit tests to ensure full coverage of all WebSocket and message functions**
- [ ] **Integration Tests:**
  - [ ] WebSocket connection established on client connect
  - [ ] `user_message` event saves to database
  - [ ] Server emits `assistant_message` event (echo test)
  - [ ] Message history loaded on session resume
  - [ ] Multiple messages persist correctly
  - [ ] Disconnection updates session status in database
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

## Milestone 3: AI Integration - Basic Conversation

**Goal:** Integrate Claude SDK for multi-turn conversations without tools (pure chat)

### Features
- [ ] Claude SDK client initialization
- [ ] AI Conversation Service (stateless wrapper)
- [ ] Message history management
- [ ] Streaming support with text deltas
- [ ] Basic retry logic and error handling
- [ ] Extended Thinking display in UI

### Implementation Tasks
- [ ] Install dependency: `@anthropic-ai/sdk`
- [ ] Create AI service: `backend/src/services/ai-conversation-service.ts`
  - [ ] Initialize single global `Anthropic` client
  - [ ] `sendMessage(sessionId, userMessage)` method
  - [ ] Load message history from database
  - [ ] Call `messages.create()` with streaming enabled
  - [ ] Parse streaming events (text, thinking, message_complete)
  - [ ] Save assistant response to database
- [ ] Create streaming handler: `backend/src/websocket/streaming-handler.ts`
  - [ ] Emit `text_delta` events to client
  - [ ] Emit `thinking_delta` events for Extended Thinking
  - [ ] Emit `message_complete` event
- [ ] Update WebSocket handler to call AI service on `user_message`
- [ ] Replace echo bot with real AI integration
- [ ] Frontend: Handle streaming events in WebSocket hook
  - [ ] Append text deltas to active message
  - [ ] Display thinking blocks
- [ ] Frontend: Create `ThinkingBlock.tsx` component for Extended Thinking
- [ ] Frontend: Update UI to display streaming text
- [ ] Add retry logic with exponential backoff (3 attempts max, 1s/2s/4s delays)
- [ ] Add timeout protection (30 seconds)
- [ ] Add error handling for API failures

### Testing
- [ ] **Unit Tests:**
  - [ ] AI service initializes client with API key
  - [ ] AI service loads message history correctly
  - [ ] AI service constructs messages array in correct format (alternating user/assistant)
  - [ ] AI service handles empty message history
  - [ ] AI service validates message format
  - [ ] Retry logic triggers on 5xx errors
  - [ ] Retry logic does NOT trigger on 4xx errors
  - [ ] Retry logic uses exponential backoff
  - [ ] Timeout fires after 30 seconds
  - [ ] Streaming handler parses text deltas correctly
  - [ ] Streaming handler parses thinking blocks correctly
  - [ ] **Additional unit tests to ensure full coverage of all AI service functions**
- [ ] **Integration Tests:**
  - [ ] Send message to AI and receive response
  - [ ] Message history grows correctly over multiple turns
  - [ ] Streaming events emitted in correct order (text_delta → message_complete)
  - [ ] Assistant response saved to database with full content
  - [ ] Extended Thinking blocks captured and saved
  - [ ] Multi-turn conversation maintains context
  - [ ] Error handling works when API key invalid
  - [ ] Timeout error returned after 30 seconds
- [ ] **Manual QA (Browser):**
  - [ ] Send "Hello" and verify AI responds conversationally
  - [ ] Send follow-up message and verify context maintained
  - [ ] Observe streaming text appearing character by character
  - [ ] Check database for saved assistant messages
  - [ ] Verify Extended Thinking blocks displayed (if present)
  - [ ] Test error handling by removing API key temporarily
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Send message: "What can you help me with?"
  - [ ] Assert assistant response appears
  - [ ] Send follow-up: "Tell me more"
  - [ ] Assert response references previous context
  - [ ] Verify no console errors
- [ ] **User Acceptance:**
  - [ ] AI responses feel natural and conversational
  - [ ] Streaming provides good UX (no long waits)
  - [ ] Error messages displayed gracefully on AI failures
  - [ ] Context maintained across conversation turns

**Deliverable:** Working AI chat with streaming, thinking blocks, and multi-turn conversation context

---

## Milestone 4: REST API - Provider Endpoints

**Goal:** Implement provider search and retrieval endpoints

### Features
- [ ] GET `/api/providers` - List all providers with filters
- [ ] GET `/api/providers/:id` - Get provider details
- [ ] Request validation middleware
- [ ] Error handling middleware

### Implementation Tasks
- [ ] Install validation library: `zod`
- [ ] Create route handlers: `backend/src/routes/providers.ts`
  - [ ] GET `/` - List providers with query params (category, location, rating)
  - [ ] GET `/:id` - Get single provider
- [ ] Create service layer: `backend/src/services/provider-service.ts`
  - [ ] `searchProviders(filters)` - Query with filters
  - [ ] `getProviderById(id)` - Get single provider
  - [ ] `filterByCategory(category)` - Filter logic
  - [ ] `sortByRating()` - Sort logic
  - [ ] `sortByDistance(userLocation)` - Distance calculation (optional)
- [ ] Create validation schemas: `backend/src/validation/provider-schemas.ts`
  - [ ] Provider query params schema
  - [ ] Provider ID schema
- [ ] Create error handling middleware: `backend/src/middleware/error-handler.ts`
  - [ ] Handle validation errors (400)
  - [ ] Handle not found errors (404)
  - [ ] Handle server errors (500)
- [ ] Wire up routes in `backend/src/index.ts`

### Testing
- [ ] **Unit Tests:**
  - [ ] Provider service searches by category correctly
  - [ ] Provider service filters by rating threshold
  - [ ] Provider service sorts by rating descending
  - [ ] Provider service handles empty results
  - [ ] Provider service validates filter parameters
  - [ ] Provider service gets provider by ID
  - [ ] Provider service handles non-existent ID
  - [ ] Validation schema accepts valid query params
  - [ ] Validation schema rejects invalid category
  - [ ] Validation schema rejects invalid rating range
  - [ ] Error handler formats 400 errors correctly
  - [ ] Error handler formats 404 errors correctly
  - [ ] Error handler formats 500 errors correctly
  - [ ] **Additional unit tests to ensure full coverage of all provider service and route functions**
- [ ] **Integration Tests:**
  - [ ] GET `/api/providers` returns seeded data
  - [ ] GET `/api/providers?category=salon` filters correctly
  - [ ] GET `/api/providers?rating_min=4` filters correctly
  - [ ] GET `/api/providers?category=salon&rating_min=4` applies multiple filters
  - [ ] GET `/api/providers/:id` returns provider details
  - [ ] GET `/api/providers/invalid-id` returns 404
  - [ ] Invalid query params return 400 with error details
  - [ ] Response format matches expected schema
- [ ] **Manual QA (Postman/curl):**
  - [ ] Fetch all providers and verify response format
  - [ ] Filter by category and verify results
  - [ ] Filter by rating and verify results
  - [ ] Combine multiple filters and verify results
  - [ ] Get provider by ID and verify details
  - [ ] Send invalid category and verify 400 error
  - [ ] Send invalid ID and verify 404 error
- [ ] **User Acceptance:**
  - [ ] All provider endpoints documented in README
  - [ ] Example requests/responses provided
  - [ ] Search results are relevant and correctly filtered

**Deliverable:** Functional provider search and retrieval API, testable with Postman

---

## Milestone 5: REST API - Booking Endpoints

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

## Milestone 6: Tool Execution - Provider Search & Display

**Goal:** Implement tool-based provider search with UI card display

### Features
- [ ] Tool registry system
- [ ] Tool execution loop (detect → execute → return → repeat)
- [ ] `search_providers` tool implementation
- [ ] `display_provider_cards` tool implementation
- [ ] Provider card UI components
- [ ] Tool progress events ("Searching providers...")

### Implementation Tasks
- [ ] Create tool registry: `backend/src/tools/tool-registry.ts`
  - [ ] Tool interface: `{ name, description, inputSchema, execute }`
  - [ ] Tool registration map
  - [ ] Tool execution dispatcher
  - [ ] Tool validation
- [ ] Create tools: `backend/src/tools/`
  - [ ] `search-providers.ts` - Query database with filters from AI
  - [ ] `display-provider-cards.ts` - Emit UI event with provider data
- [ ] Update AI service to include tools in `messages.create()`
- [ ] Create tool execution loop: `backend/src/services/tool-executor.ts`
  - [ ] Detect `stop_reason === "tool_use"`
  - [ ] Execute tool by name with input
  - [ ] Validate tool input against schema
  - [ ] Construct `tool_result` message
  - [ ] Recursively call AI service until `stop_reason === "end_turn"`
  - [ ] Handle tool execution errors
- [ ] Update WebSocket handler to emit `tool_start` and `tool_complete` events
- [ ] Frontend: Create provider card components:
  - [ ] `ProviderCard.tsx` - Card with name, rating, distance, services
  - [ ] `ProviderGrid.tsx` - Grid layout for multiple cards
- [ ] Frontend: Handle `display_providers` event in WebSocket hook
- [ ] Frontend: Add provider display to chat UI

### Testing
- [ ] **Unit Tests:**
  - [ ] Tool registry registers tools correctly
  - [ ] Tool registry returns correct tool by name
  - [ ] Tool registry handles non-existent tool
  - [ ] Tool registry validates tool schema
  - [ ] `search_providers` filters by category
  - [ ] `search_providers` filters by rating
  - [ ] `search_providers` sorts by rating
  - [ ] `search_providers` handles no results
  - [ ] `display_provider_cards` formats data correctly
  - [ ] `display_provider_cards` validates provider data
  - [ ] Tool executor detects tool_use stop reason
  - [ ] Tool executor constructs tool_result message correctly
  - [ ] Tool executor handles tool execution errors
  - [ ] Tool executor validates tool input
  - [ ] Tool executor handles recursive calls
  - [ ] **Additional unit tests to ensure full coverage of all tool and executor functions**
- [ ] **Integration Tests:**
  - [ ] User message "Find me a salon" triggers `search_providers` tool
  - [ ] Tool returns provider results
  - [ ] AI receives tool results and generates response
  - [ ] `display_provider_cards` emits UI event with data
  - [ ] Full loop completes with end_turn
  - [ ] Multiple tool calls in sequence work correctly
  - [ ] Tool execution errors handled gracefully
- [ ] **Manual QA (Browser):**
  - [ ] Send "I need a haircut"
  - [ ] Verify "Searching providers..." progress indicator
  - [ ] Verify provider cards appear in chat
  - [ ] Verify AI explains results conversationally
  - [ ] Verify cards show name, rating, services
  - [ ] Test with different categories (mechanic, dentist)
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Send message: "Find salons near me"
  - [ ] Assert progress indicator appears
  - [ ] Assert provider cards render
  - [ ] Assert cards have name, rating, distance
  - [ ] Click provider card (prepare for next milestone)
  - [ ] Verify card interaction works
- [ ] **User Acceptance:**
  - [ ] Provider cards match design system
  - [ ] Search results are relevant to user request
  - [ ] Progress indicators improve UX during tool execution
  - [ ] AI explains search results naturally

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

## Milestone 8: Booking Flow - Time Slots & Confirmation

**Goal:** Complete end-to-end booking flow with time selection and confirmation

### Features
- [ ] Time slot generation based on provider working hours
- [ ] Time slot filtering (remove past times, existing bookings)
- [ ] `display_time_slots` tool implementation
- [ ] `confirm_booking` tool implementation
- [ ] `create_booking` tool implementation
- [ ] Booking confirmation UI
- [ ] Workflow completion on successful booking

### Implementation Tasks
- [ ] Create availability service: `backend/src/services/availability-service.ts`
  - [ ] `generateTimeSlots(providerId, date)` - Based on working hours
  - [ ] `filterPastSlots(slots)` - Remove past times
  - [ ] `filterBookedSlots(slots, existingBookings)` - Remove conflicts
  - [ ] `getAvailableSlots(providerId, date)` - Combined logic
  - [ ] Return slots in 30-minute increments
- [ ] Create tools: `backend/src/tools/`
  - [ ] `display_time_slots.ts` - Emit UI event with available slots
  - [ ] `confirm_booking.ts` - Show confirmation dialog, wait for user approval
  - [ ] `create_booking.ts` - Create booking in database via booking service
- [ ] Update booking service to integrate with workflow
- [ ] Update workflow manager:
  - [ ] Store selected time slot in context
  - [ ] Transition to CONFIRMATION state
  - [ ] Transition to BOOKING_CREATED on success
  - [ ] Complete workflow after booking created
- [ ] Frontend: Create time slot components:
  - [ ] `TimeSlotGrid.tsx` - Display available slots
  - [ ] `TimeSlotButton.tsx` - Clickable time slot
  - [ ] `BookingConfirmation.tsx` - Confirmation dialog
- [ ] Frontend: Handle time slot selection and confirmation events
- [ ] Frontend: Display booking confirmation with booking ID

### Testing
- [ ] **Unit Tests:**
  - [ ] Availability service generates correct slots for working hours
  - [ ] Availability service filters out past times
  - [ ] Availability service filters out existing bookings
  - [ ] Availability service handles no available slots
  - [ ] Availability service generates 30-minute increments
  - [ ] Availability service handles edge cases (midnight, start of day)
  - [ ] Booking service creates booking with all required fields
  - [ ] Idempotency check prevents duplicate bookings
  - [ ] `display_time_slots` formats slots correctly
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
  - [ ] Time slots reflect existing bookings (conflicts removed)
  - [ ] User can cancel confirmation and select different time
- [ ] **Manual QA (Browser):**
  - [ ] Complete full booking flow
  - [ ] Verify time slots only show future times
  - [ ] Verify time slots exclude lunch breaks (if in working hours)
  - [ ] Confirm booking and verify confirmation message
  - [ ] Check database for created booking
  - [ ] Verify booking ID displayed
  - [ ] Verify all booking details correct
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Send: "Book a salon appointment"
  - [ ] Select provider
  - [ ] Assert time slots appear
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

## Milestone 9: Calendar Integration

**Goal:** Integrate Google Calendar for conflict detection and event creation

### Features
- [ ] Google Calendar API authentication
- [ ] Calendar conflict detection before booking
- [ ] Calendar event creation on successful booking
- [ ] Error handling for calendar failures (booking still succeeds)
- [ ] Store calendar event ID with booking

### Implementation Tasks
- [ ] Setup Google Cloud project and enable Calendar API
- [ ] Create service account and download credentials JSON
- [ ] Install dependency: `googleapis`
- [ ] Create calendar service: `backend/src/services/calendar-service.ts`
  - [ ] Initialize Google Calendar client with service account
  - [ ] `checkConflicts(startTime, endTime)` - Query for overlapping events
  - [ ] `createEvent(bookingDetails)` - Create calendar event
  - [ ] `deleteEvent(eventId)` - Delete event (for cancellations)
  - [ ] Error handling with graceful degradation
- [ ] Create tool: `check_calendar_conflicts.ts`
  - [ ] Call calendar service
  - [ ] Return conflict information to AI
  - [ ] Suggest alternative times if conflict exists
- [ ] Update `create_booking` tool:
  - [ ] Create calendar event after booking created
  - [ ] Store event ID in booking record
  - [ ] Handle calendar errors gracefully (log but don't fail booking)
- [ ] Update booking schema to include `calendarEventId` field
- [ ] Run migration to add field to database
- [ ] Add calendar event ID to booking confirmation message

### Testing
- [ ] **Unit Tests:**
  - [ ] Calendar service initializes with credentials
  - [ ] Calendar service constructs event object correctly
  - [ ] Calendar service validates event data
  - [ ] Conflict detection parses overlapping events
  - [ ] Conflict detection returns true when overlap exists
  - [ ] Conflict detection returns false when no overlap
  - [ ] Event creation formats booking details correctly
  - [ ] Event deletion handles non-existent event ID
  - [ ] Error handling logs errors without throwing
  - [ ] **Additional unit tests to ensure full coverage of all calendar service functions**
- [ ] **Integration Tests:**
  - [ ] Create calendar event and verify in Google Calendar
  - [ ] Check for conflicts with existing event (returns conflict)
  - [ ] Check for conflicts with no overlap (returns available)
  - [ ] Calendar creation failure doesn't prevent booking
  - [ ] Event ID stored in booking record
  - [ ] Delete event and verify removed from calendar
- [ ] **Manual QA (Browser):**
  - [ ] Create booking and verify event in Google Calendar
  - [ ] Create overlapping event manually in calendar
  - [ ] Attempt booking at same time and verify conflict detected
  - [ ] Verify AI suggests alternative times
  - [ ] Complete booking and verify calendar event created
- [ ] **Manual QA (Playwright MCP):**
  - [ ] Complete booking flow
  - [ ] Assert calendar event created (check database for event ID)
  - [ ] Open Google Calendar in browser
  - [ ] Verify event details match booking
- [ ] **Manual QA (Google Calendar):**
  - [ ] Open Google Calendar web interface
  - [ ] Verify event exists with correct time, title, description
  - [ ] Verify provider address in location field
  - [ ] Verify event details match booking exactly
- [ ] **User Acceptance:**
  - [ ] Booking automatically appears in user's calendar
  - [ ] Conflict detection prevents double-booking
  - [ ] Calendar failures don't break booking flow
  - [ ] Event details are complete and accurate

**Deliverable:** Full calendar integration with conflict detection and graceful error handling

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

**Current Milestone:** Milestone 1 (Project Setup) - Backend Complete
**Overall Progress:** 0/10 milestones complete (0%) - Backend portion of Milestone 1 complete

### Milestone Completion Status
- [~] Milestone 1: Project Setup & Database Foundation (Backend complete, Frontend pending)
- [ ] Milestone 2: WebSocket Chat Foundation
- [ ] Milestone 3: AI Integration - Basic Conversation
- [ ] Milestone 4: REST API - Provider Endpoints
- [ ] Milestone 5: REST API - Booking Endpoints
- [ ] Milestone 6: Tool Execution - Provider Search & Display
- [ ] Milestone 7: Workflow State Engine
- [ ] Milestone 8: Booking Flow - Time Slots & Confirmation
- [ ] Milestone 9: Calendar Integration
- [ ] Milestone 10: Production Readiness & Polish

---

## Notes & Decisions

### Milestone Order Rationale
- **Milestones 2-3 (WebSocket + AI) before REST APIs:** Validates riskier real-time infrastructure and AI integration early, before building CRUD operations
- **Milestones 4-5 (REST APIs split):** Smaller, more reviewable PRs; providers don't depend on bookings
- **Milestones 6-8 (Tools + Workflows + Booking):** Build tool system first, then state management, then complete flow
- **Milestone 9 (Calendar):** Add-on feature that doesn't block core functionality
- **Milestone 10 (Observability):** Polish and production-readiness after all features work

### Dependencies Between Milestones
- Milestone 2 requires Milestone 1 (database schema for messages)
- Milestone 3 requires Milestone 2 (WebSocket infrastructure)
- Milestone 4 requires Milestone 1 (database schema for providers)
- Milestone 5 requires Milestone 1 (database schema for bookings)
- Milestone 6 requires Milestones 3, 4 (AI service + provider data)
- Milestone 7 requires Milestone 6 (tool execution)
- Milestone 8 requires Milestones 5, 7 (booking service + workflow state)
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
**Next Review:** After Milestone 1 completion
