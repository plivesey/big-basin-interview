# Engineering Requirements Document: Service Booking Assistant

**Version:** 1.0
**Date:** 2025-12-17
**Status:** Finalized
**Focus:** Backend + Core Architecture

**Architecture Decisions:** WebSockets | Tool-Based UI Commands | Hybrid Progress Updates

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [System Architecture](#2-system-architecture)
3. [Backend Module Architecture](#3-backend-module-architecture)
4. [Claude SDK Integration Strategy](#4-claude-sdk-integration-strategy)
5. [Real-Time Communication: WebSockets](#5-real-time-communication-websockets-socketio)
6. [UI State Synchronization: Tool-Based Commands](#6-ui-state-synchronization-tool-based-ui-commands)
7. [Progress Updates: Hybrid Approach](#7-progress-updates-hybrid-approach-extended-thinking--tool-events)
8. [Data Models & Database Schema](#8-data-models--database-schema)
9. [API Design](#9-api-design)
10. [Integration Challenges & Solutions](#10-integration-challenges--solutions)
11. [Dependency Analysis](#11-dependency-analysis)
12. [Deployment & Development Workflow](#12-deployment--development-workflow)
13. [Summary](#summary)

---

## 1. Technology Stack

### Frontend Dependencies
- **React 18+**: UI framework with concurrent features
- **TypeScript 5+**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Socket.io-client**: Real-time bidirectional communication for chat interface
- **React Query / SWR**: Server state management and caching (for REST API data)
- **Zustand**: Local UI state management (lightweight, ~1KB) - for chat UI state, message buffers, typing indicators
- **date-fns**: Date manipulation
- **React Markdown**: Message rendering with rich formatting

### Backend Dependencies
- **Node.js 20+**: Runtime
- **TypeScript 5+**: Type safety
- **Express.js**: HTTP server framework (REST API + WebSocket server)
- **Socket.io**: WebSocket server for chat interface real-time updates
- **@anthropic-ai/sdk**: Official Claude Messages API client (stateless, single instance)
- **sqlite3**: Async SQLite driver for Node.js (non-blocking, production-ready)
- **Drizzle ORM**: Type-safe async SQL query builder
- **Zod**: Runtime validation and schema definition
- **Winston**: Structured logging
- **Google APIs (googleapis)**: Calendar integration
- **dotenv**: Environment configuration
- **uuid**: ID generation

### Development Tools
- **tsx**: TypeScript execution for development
- **Vite**: Frontend build tool
- **ESLint + Prettier**: Code quality
- **Vitest**: Unit testing
- **Drizzle Kit**: Database migrations

---

## 2. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ React Application                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │ Chat UI      │  │ Provider     │  │ Booking History │ │ │
│  │  │ Component    │  │ Cards        │  │ View            │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │                                                            │ │
│  │  State Management:                                        │ │
│  │  - Zustand: Chat UI state, message buffers               │ │
│  │  - React Query: Provider data, booking history (REST)    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                     │                        │                   │
│                     │ WebSocket              │ HTTP/REST         │
│                     │ (chat only)            │ (CRUD operations) │
└─────────────────────┼────────────────────────┼───────────────────┘
                      │                        │
           ───────────┼────────────────────────┼───────────
             Network  │      Boundary          │
           ───────────┼────────────────────────┼───────────
                      │                        │
┌─────────────────────▼────────────────────────▼───────────────────┐
│                   Express HTTP Server (Node.js)                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ REST API Routes              │ WebSocket Handler            │ │
│  │ - GET  /api/providers        │ - Socket.io Server           │ │
│  │ - GET  /api/bookings         │ - Events: user_message,      │ │
│  │ - POST /api/bookings         │   text_delta, tool_start,    │ │
│  │ - GET  /api/sessions         │   display_providers, etc.    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                      │                │
│                           ▼                      ▼                │
└───────────────────────────┼──────────────────────┼────────────────┘
                            │                      │
                            ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Conversation Orchestrator                      │ │
│  │                                                              │ │
│  │  WHY NEEDED: Claude Messages API is stateless - we must:   │ │
│  │  - Manage message history ourselves (pass full array)      │ │
│  │  - Build the tool execution loop manually                  │ │
│  │  - Coordinate business logic (tools ARE the conversation)  │ │
│  │  - Integrate streaming with WebSocket emission             │ │
│  │                                                              │ │
│  │  RESPONSIBILITIES:                                          │ │
│  │  - Maintain messages[] array per session                   │ │
│  │  - Execute tool loop (detect tool_use → run → return)      │ │
│  │  - Orchestrate tools: search, display cards, bookings      │ │
│  │  - Emit real-time updates via WebSocket                    │ │
│  │  - Manage workflow state transitions                       │ │
│  └────────┬────────────────────────────┬─────────────────────┘ │
│           │                            │                         │
│  ┌────────▼────────┐        ┌─────────▼──────────┐             │
│  │ AI Conversation │        │ Workflow State     │             │
│  │ Service         │        │ Manager            │             │
│  │                 │        │                    │             │
│  │ - Messages API  │        │ - State machine    │             │
│  │ - Streaming     │        │ - Persistence      │             │
│  │ - Tool registry │        │ - Transitions      │             │
│  │ - Response      │        │                    │             │
│  │   parsing       │        │                    │             │
│  └────────┬────────┘        └─────────┬──────────┘             │
│           │                           │                         │
│  ┌────────▼───────────────────────────▼──────────┐             │
│  │            Tool Execution Layer                │             │
│  │                                                 │             │
│  │  ┌──────────────┐  ┌──────────────────────┐  │             │
│  │  │ Provider     │  │ Calendar Service     │  │             │
│  │  │ Search Tool  │  │ - Conflict detection │  │             │
│  │  │              │  │ - Event creation     │  │             │
│  │  └──────────────┘  └──────────────────────┘  │             │
│  │                                                 │             │
│  │  ┌──────────────┐  ┌──────────────────────┐  │             │
│  │  │ Booking      │  │ Display Provider     │  │             │
│  │  │ Creation     │  │ Cards Tool           │  │             │
│  │  │ Tool         │  │                      │  │             │
│  │  └──────────────┘  └──────────────────────┘  │             │
│  └─────────────────────────────────────────────┘             │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ SQLite DB      │  │ Google         │                         │
│  │ (async)        │  │ Calendar API   │                         │
│  │                │  │                │  ← Direct async access  │
│  │ - Providers    │  │ - OAuth2       │    No caching layer     │
│  │ - Bookings     │  │ - Events       │    sqlite3 + Drizzle    │
│  │ - Workflows    │  │                │    Non-blocking I/O     │
│  │ - Messages     │  │                │                         │
│  └────────────────┘  └────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

                            ▲
                            │
              ┌─────────────▼───────────────┐
              │ External APIs                │
              │                              │
              │ - Claude Messages API        │
              │   (Anthropic SDK)            │
              │   Single global instance     │
              │   Stateless - no session     │
              │   stored server-side         │
              │                              │
              │ - Google Calendar API        │
              └──────────────────────────────┘
```

---

## 3. Backend Module Architecture

### 3.1 Directory Structure

```
backend/
├── src/
│   ├── server.ts                    # Express app initialization
│   ├── config/
│   │   ├── env.ts                   # Environment variables & validation
│   │   ├── database.ts              # SQLite connection & Drizzle setup
│   │   └── claude.ts                # Claude SDK client initialization
│   ├── routes/
│   │   ├── chat.routes.ts           # Chat API endpoints
│   │   ├── providers.routes.ts      # Provider search endpoints
│   │   └── bookings.routes.ts       # Booking management endpoints
│   ├── services/
│   │   ├── conversation/
│   │   │   ├── orchestrator.ts      # Main conversation controller
│   │   │   ├── message-manager.ts   # Message history management
│   │   │   └── streaming-handler.ts # Real-time update emission
│   │   ├── ai/
│   │   │   ├── ai-conversation-service.ts # AI Messages API wrapper (provider-agnostic)
│   │   │   ├── tool-registry.ts           # Tool definitions & execution
│   │   │   ├── prompt-builder.ts          # System prompts & context
│   │   │   └── response-parser.ts         # AI response interpretation
│   │   ├── workflow/
│   │   │   ├── state-machine.ts     # Workflow states & transitions
│   │   │   ├── state-manager.ts     # Persistence & retrieval
│   │   │   └── context-builder.ts   # Workflow context management
│   │   ├── tools/
│   │   │   ├── provider-search.tool.ts    # Search providers tool
│   │   │   ├── display-providers.tool.ts  # Display UI cards tool
│   │   │   ├── booking-create.tool.ts     # Create booking tool
│   │   │   └── calendar-check.tool.ts     # Calendar conflict tool
│   │   ├── calendar/
│   │   │   ├── google-calendar.ts   # Google Calendar API client
│   │   │   ├── conflict-detector.ts # Availability checking
│   │   │   └── event-creator.ts     # Event creation logic
│   │   ├── providers/
│   │   │   ├── provider-service.ts  # Provider CRUD operations
│   │   │   └── search-engine.ts     # Search & ranking logic
│   │   └── bookings/
│   │       ├── booking-service.ts   # Booking CRUD operations
│   │       └── idempotency.ts       # Duplicate prevention
│   ├── db/
│   │   ├── schema.ts                # Drizzle schema definitions
│   │   ├── migrations/              # SQL migration files
│   │   └── seed.ts                  # Test data generation
│   ├── types/
│   │   ├── workflow.types.ts        # State machine types
│   │   ├── claude.types.ts          # Claude SDK types
│   │   ├── tool.types.ts            # Tool definition types
│   │   └── api.types.ts             # API request/response types
│   ├── middleware/
│   │   ├── error-handler.ts         # Global error handling
│   │   ├── logger.ts                # Winston logging middleware
│   │   └── validation.ts            # Zod request validation
│   └── utils/
│       ├── retry.ts                 # Exponential backoff utilities
│       ├── logger.ts                # Winston logger configuration
│       └── idempotency-key.ts       # Key generation
└── tests/
    ├── integration/
    └── unit/
```

### 3.2 Module Responsibilities

#### **Conversation Orchestrator** (`services/conversation/orchestrator.ts`)
**Responsibility:** Main controller for the entire conversation lifecycle
- Receives user messages from HTTP/WebSocket endpoints
- Coordinates with Claude AI Service to generate responses
- Manages tool execution flow (request → execute → return results)
- Emits progress updates via streaming handler
- Maintains conversation context and message history
- Handles errors and retry logic at conversation level

**Key Operations:**
- `startConversation(sessionId, userMessage)` → initializes workflow state
- `continueConversation(sessionId, userMessage)` → processes next message
- `handleToolExecution(toolRequests)` → orchestrates tool calls
- `emitProgressUpdate(sessionId, status)` → sends real-time updates to client

#### **AI Conversation Service** (`services/ai/ai-conversation-service.ts`)
**Responsibility:** Provider-agnostic wrapper for AI conversation APIs (currently Claude Messages API)

**Why Abstracted:** Allows future swapping of AI providers (Claude → GPT-4 → Gemini) without changing application logic.

**Claude Messages API Details:**
- **Stateless**: No conversation state stored server-side by Anthropic
- **Client Instance**: Single global SDK instance (`new Anthropic()`) reused for all requests
- **Message History**: We maintain `messages[]` array in memory per session
- **Each API call**: Send full message history array + current user message
- **Tool Execution**: Manual loop - we detect `stop_reason === "tool_use"`, execute tools, return results

**Responsibilities:**
- Initialize AI SDK client with API keys (single global instance)
- Execute streaming or non-streaming message requests
- Parse AI responses into structured data (text, tool_use, thinking blocks)
- Handle API errors with retry logic (exponential backoff)
- Track token usage and costs
- Implement timeout protection (30s default)

**Key Operations:**
- `sendMessage(messages, tools, stream?)` → call AI API with full message history
- `parseResponse(response)` → extract text, tool calls, thinking blocks
- `validateToolCall(toolCall)` → validate tool parameters against schema

**Message Management Pattern:**
```typescript
// Single global client instance (stateless)
const aiClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-session message history (stored in memory or DB)
const sessionMessages: Message[] = [
  { role: 'user', content: 'Find me a salon' },
  { role: 'assistant', content: [...] },
  { role: 'user', content: 'Show me options near downtown' }
];

// Each request sends full history
const response = await aiClient.messages.create({
  model: 'claude-sonnet-4-5',
  messages: sessionMessages,  // Full history every time
  tools: [...]
});
```

#### **Tool Registry** (`services/ai/tool-registry.ts`)
**Responsibility:** Central registry for all tools available to the AI
- Define tool schemas (name, description, input_schema)
- Map tool names to execution handlers
- Validate tool inputs before execution
- Execute tools and format results for AI
- Handle tool execution errors gracefully

**Tool Definitions:**
1. `search_providers` - Search provider database with filters
2. `display_provider_cards` - Trigger UI to render provider cards
3. `check_calendar_conflicts` - Verify availability against user calendar
4. `create_booking` - Finalize booking with idempotency
5. `get_available_slots` - Fetch time slots for selected provider

**Key Operations:**
- `registerTool(definition, handler)` → add new tool
- `getToolDefinitions()` → return all tool schemas for AI
- `executeTool(toolName, input)` → run tool handler
- `validateInput(toolName, input)` → Zod schema validation

#### **Workflow State Manager** (`services/workflow/state-manager.ts`)
**Responsibility:** Persist and manage workflow states for resumability

**Key Design:** Each booking flow gets its own workflow instance (ID), allowing multiple bookings per session.

- Define state machine: `PROVIDER_SEARCH → PROVIDER_SELECTION → CONFIRMATION → BOOKING_CREATED → COMPLETE`
- Persist state to database after each transition
- Support multiple active workflows per session (user can book salon, then dentist in same session)
- Load workflow state by workflow ID or get active workflows for a session
- Handle state transitions with validation
- Mark workflows as 'completed' or 'abandoned' instead of deleting
- Expire old workflows (24h timeout)

**State Machine:**
```
┌──────────────────┐
│ PROVIDER_SEARCH  │ ← Initial state
└────────┬─────────┘
         │ (providers found)
         ▼
┌──────────────────────┐
│ PROVIDER_SELECTION   │
└────────┬─────────────┘
         │ (provider selected)
         ▼
┌──────────────────────┐
│ TIME_SELECTION       │
└────────┬─────────────┘
         │ (time selected)
         ▼
┌──────────────────────┐
│ CONFIRMATION         │
└────────┬─────────────┘
         │ (user confirms)
         ▼
┌──────────────────────┐
│ BOOKING_CREATED      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ COMPLETE             │
└──────────────────────┘
```

**Key Operations:**
- `createWorkflow(sessionId)` → create new workflow instance, returns workflowId
- `getWorkflow(workflowId)` → retrieve workflow state by ID
- `getActiveWorkflows(sessionId)` → get all active workflows for a session
- `transition(workflowId, toState, context)` → change state with validation
- `saveState(workflowId, state, context)` → persist to database
- `completeWorkflow(workflowId)` → mark workflow as completed
- `abandonWorkflow(workflowId)` → mark workflow as abandoned
- `cleanupExpiredWorkflows()` → expire old workflows (24h+)

#### **Calendar Service** (`services/calendar/google-calendar.ts`)
**Responsibility:** Google Calendar API integration
- Authenticate with Google Calendar API (OAuth2 or service account)
- Check for calendar conflicts before booking
- Create calendar events on successful booking
- Handle API rate limits and errors
- Provide fallback if calendar unavailable (log error, continue booking)

**Key Operations:**
- `authenticate()` → OAuth2 flow or service account setup
- `checkConflicts(userId, startTime, duration)` → query user's calendar
- `createEvent(booking)` → create calendar entry
- `deleteEvent(eventId)` → cancel calendar entry (for cancellations)

#### **Provider Search Service** (`services/providers/search-engine.ts`)
**Responsibility:** Search and rank providers based on criteria
- Parse search criteria from Claude's extracted intent
- Query SQLite database with filters (category, location, rating)
- Rank results by relevance: category match > proximity > rating
- Return top N results (configurable, default 5-10)

**Ranking Algorithm:**
```
score = (categoryMatch ? 100 : 0)
      + (50 / (distance_km + 1))  // Proximity bonus
      + (rating * 10)              // Rating multiplier
```

**Key Operations:**
- `search(criteria)` → execute search with filters
- `rankResults(providers, criteria)` → sort by relevance
- `calculateDistance(userLoc, providerLoc)` → haversine formula

#### **Booking Service** (`services/bookings/booking-service.ts`)
**Responsibility:** Create and manage bookings with idempotency
- Create bookings with unique IDs
- Prevent duplicate bookings (same user + provider + time)
- Update booking status (pending → confirmed → cancelled)
- Store calendar event ID reference
- Validate booking constraints (provider availability, no overlaps)

**Idempotency Strategy:**
Generate idempotency key from: `${sessionId}:${providerId}:${scheduledAt}`
- Check for existing booking with same key before creation
- Return existing booking if duplicate detected
- Prevents double-booking from retry requests or network issues

**Key Operations:**
- `createBooking(data, idempotencyKey)` → create or return existing
- `updateBookingStatus(bookingId, status)` → change booking state
- `getBooking(bookingId)` → retrieve booking details
- `getUserBookings(userId)` → list user's bookings

#### **Streaming Handler** (`services/conversation/streaming-handler.ts`)
**Responsibility:** Emit real-time progress updates to frontend
- Maintain active WebSocket/SSE connections per session
- Emit typed events: `message_start`, `text_delta`, `tool_start`, `tool_complete`, `error`
- Buffer and flush message deltas efficiently
- Handle client disconnections gracefully

**Event Types:**
```typescript
type StreamEvent =
  | { type: 'message_start', sessionId: string }
  | { type: 'text_delta', text: string }
  | { type: 'thinking_delta', thinking: string }
  | { type: 'tool_start', tool: string, status: string }
  | { type: 'tool_complete', tool: string, result: any }
  | { type: 'display_providers', providers: Provider[] }
  | { type: 'message_complete' }
  | { type: 'error', error: string }
```

---

## 4. Claude SDK Integration Strategy

### 4.1 Claude SDK Core Capabilities (Research Summary)

Based on Anthropic's official documentation, the Claude SDK provides:

1. **Messages API**: Core conversational interface
   - Multi-turn conversations with message history
   - Supports text, images, and structured data

2. **Tool Use (Function Calling)**:
   - Claude autonomously decides when to call tools
   - Parallel tool execution for efficiency
   - Structured input validation with JSON schemas
   - Tool results returned as special message blocks

3. **Streaming API**:
   - Real-time response generation
   - Stream events: `message_start`, `content_block_delta`, `tool_use`, `message_stop`
   - Supports streaming text, tool calls, and thinking blocks

4. **Extended Thinking** (Optional):
   - Visible reasoning for complex problems
   - Separate `thinking` blocks before responses
   - Useful for showing "working through the problem" to users
   - Budget tokens allocated separately (e.g., 10,000 tokens for thinking)

5. **Structured Outputs** (Beta):
   - Guarantee JSON schema compliance
   - Parse responses directly into TypeScript types (via Zod or Pydantic-like validation)

### 4.2 Integration Architecture

#### **Message Flow Pattern**

```
User Input
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. Orchestrator receives message        │
│    - Load conversation history          │
│    - Load workflow state                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 2. Send to Claude SDK                   │
│    - Include message history            │
│    - Include available tools            │
│    - Enable streaming                   │
│    - Optional: Enable thinking          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 3. Stream Claude response               │
│    - Emit text deltas to client         │
│    - Emit thinking deltas (if enabled)  │
│    - Detect tool_use requests           │
└─────────────┬───────────────────────────┘
              │
              ▼
         ┌────┴─────┐
         │ Tool use? │
         └────┬─────┘
              │
      ┌───────┴────────┐
      │ YES            │ NO
      ▼                ▼
┌──────────────┐  ┌─────────────────┐
│ 4. Execute   │  │ 5. Return final │
│    Tools     │  │    response     │
│              │  │    to user      │
│ - Validate   │  └─────────────────┘
│ - Execute    │
│ - Format     │
│   results    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ 6. Return results    │
│    to Claude         │
│    (loop to step 2)  │
└──────────────────────┘
```

#### **Tool Execution Loop**

The backend will implement the **manual tool loop pattern** for maximum control:

```typescript
// Pseudocode for tool execution loop
async function processConversation(sessionId: string, userMessage: string) {
  const messages = await messageManager.getHistory(sessionId);
  messages.push({ role: 'user', content: userMessage });

  while (true) {
    // Call Claude with current message history
    const response = await claudeService.sendMessage({
      messages,
      tools: toolRegistry.getToolDefinitions(),
      stream: true,
      onTextDelta: (text) => streamingHandler.emit(sessionId, { type: 'text_delta', text }),
      onThinkingDelta: (thinking) => streamingHandler.emit(sessionId, { type: 'thinking_delta', thinking })
    });

    // Add assistant response to history
    messages.push({ role: 'assistant', content: response.content });

    // Check if Claude wants to use tools
    if (response.stopReason === 'tool_use') {
      const toolResults = [];

      // Execute all requested tools (may be parallel)
      for (const toolUse of response.content.filter(b => b.type === 'tool_use')) {
        streamingHandler.emit(sessionId, {
          type: 'tool_start',
          tool: toolUse.name,
          status: `Executing ${toolUse.name}...`
        });

        // Execute tool
        const result = await toolRegistry.executeTool(toolUse.name, toolUse.input);

        streamingHandler.emit(sessionId, {
          type: 'tool_complete',
          tool: toolUse.name,
          result
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }

      // Add tool results to history and continue loop
      messages.push({ role: 'user', content: toolResults });

    } else {
      // Claude finished responding
      streamingHandler.emit(sessionId, { type: 'message_complete' });
      return response.content[0].text;
    }
  }
}
```

### 4.3 System Prompt Design

The system prompt configures Claude's behavior and tool usage:

```
You are a helpful service booking assistant. Your role is to help users find and book appointments with local service providers.

## Conversation Flow
1. Understand what service the user needs (salon, mechanic, dentist, etc.)
2. Ask clarifying questions if the request is ambiguous
3. Search for providers using the search_providers tool
4. Display provider cards to the user using the display_provider_cards tool
5. Once user selects a provider, check calendar conflicts with check_calendar_conflicts
6. Show available time slots
7. Confirm booking details conversationally before creating the booking
8. Use create_booking tool to finalize the booking

## Tool Usage Guidelines
- Use search_providers when you understand the user's service needs
- Always use display_provider_cards to show search results (do not format as text)
- Use check_calendar_conflicts before showing available slots
- Use create_booking only after explicit user confirmation
- Be conversational and friendly
- If a tool fails, explain the issue and suggest next steps

## Response Style
- Keep responses concise (2-3 sentences)
- Guide users to the next step
- Confirm important details before taking action
```

---

## 5. Real-Time Communication: WebSockets (Socket.io)

**DECISION: Using WebSockets with Socket.io for bidirectional real-time communication**

**Why WebSockets:**
- True bidirectional communication (client ↔ server)
- Lower latency for real-time updates
- Efficient for frequent updates (text streaming, tool progress, UI commands)
- Built-in reconnection handling
- Can emit multiple event types easily
- Industry standard for chat applications
- Better support for multi-tab scenarios

**Implementation:**

**Backend (Socket.io Server):**
```typescript
// server.ts
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173' }
});

io.on('connection', (socket) => {
  const sessionId = socket.handshake.query.sessionId;

  // Join session-specific room
  socket.join(sessionId);

  socket.on('user_message', async (message) => {
    await conversationOrchestrator.processMessage(sessionId, message, io);
  });

  socket.on('disconnect', () => {
    // Handle cleanup
  });
});

// In conversation orchestrator:
async function processMessage(sessionId, message, io) {
  // Emit text deltas
  io.to(sessionId).emit('text_delta', { text: 'Searching for providers...' });

  // Emit tool progress
  io.to(sessionId).emit('tool_start', { tool: 'search_providers', status: 'Searching...' });

  // Emit display provider cards
  io.to(sessionId).emit('display_providers', { providers: [...] });

  // Emit completion
  io.to(sessionId).emit('message_complete');
}
```

**Frontend (Socket.io Client):**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: { sessionId: currentSessionId }
});

socket.on('text_delta', (data) => {
  appendTextToMessage(data.text);
});

socket.on('tool_start', (data) => {
  showProgressIndicator(data.status);
});

socket.on('display_providers', (data) => {
  renderProviderCards(data.providers);
});

socket.on('message_complete', () => {
  hideProgressIndicator();
});

// Send user message
function sendMessage(text) {
  socket.emit('user_message', text);
}
```

**Event Types:**
- `text_delta`: Streaming text chunks
- `thinking_delta`: Claude's reasoning (if enabled)
- `tool_start`: Tool execution started
- `tool_progress`: Tool progress update (e.g., "Found 5 providers")
- `tool_complete`: Tool execution finished
- `display_providers`: Show provider cards in UI
- `display_time_slots`: Show time picker in UI
- `message_complete`: Message finished
- `error`: Error occurred

**Alternative Considered:** Server-Sent Events (SSE) with HTTP POST for user messages. While simpler, SSE is unidirectional and less suitable for interactive chat applications. WebSockets provide better UX and scalability.

---

## 6. UI State Synchronization: Tool-Based UI Commands

**DECISION: Using tool-based UI commands for frontend state updates**

**Approach:** Define tools like `display_provider_cards` that Claude calls when it wants to trigger UI updates. This provides explicit control and reliable state synchronization.

**Tool Definition:**
```typescript
const displayProviderCardsTool = {
  name: 'display_provider_cards',
  description: 'Display provider cards in the UI. Call this tool after searching for providers to show results to the user. Do not format providers as text.',
  input_schema: {
    type: 'object',
    properties: {
      providers: {
        type: 'array',
        description: 'Array of provider objects to display',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'string' },
            rating: { type: 'number' },
            location: { type: 'string' },
            distance: { type: 'number' }
          },
          required: ['id', 'name', 'category', 'rating']
        }
      },
      message: {
        type: 'string',
        description: 'Conversational message to show alongside the cards (e.g., "Here are some salons near you")'
      }
    },
    required: ['providers', 'message']
  }
};
```

**Execution Flow:**
1. User: "Find me a hair salon near downtown"
2. Claude calls `search_providers` tool → returns list of providers
3. Claude calls `display_provider_cards` tool with provider data
4. Backend intercepts tool call:
   ```typescript
   async function executeDisplayProviderCards(input) {
     // Emit to frontend via WebSocket
     io.to(sessionId).emit('display_providers', {
       providers: input.providers,
       message: input.message
     });

     // Return success to Claude
     return { success: true, displayed: input.providers.length };
   }
   ```
5. Frontend receives `display_providers` event and renders cards

**Why Tool-Based Commands:**
- ✅ Explicit control: AI decides when to show cards
- ✅ Reliable: Structured validation via JSON schemas
- ✅ Flexible: AI can customize the message
- ✅ Tool results provide feedback to AI (success/failure)
- ✅ Easier to test and debug
- ✅ Clear separation between AI logic and UI commands

**Complete UI Tool Set:**
```typescript
const uiTools = [
  'search_providers',                // Search database
  'display_provider_cards',          // Show provider cards in UI
  'display_time_slots',              // Show time picker in UI
  'display_booking_confirmation',    // Show confirmation modal
  'check_calendar_conflicts',        // Check calendar for conflicts
  'create_booking'                   // Create final booking
];

// Example implementation
const displayProviderCardsTool = {
  execute: async (input) => {
    io.to(sessionId).emit('display_providers', input);
    return { success: true, displayed: input.providers.length };
  }
};
```

**Alternatives Considered:** Parsing structured JSON from AI's text responses. While requiring fewer tool calls, this approach is fragile and lacks schema validation. Tool-based commands provide guaranteed reliability.

---

## 7. Progress Updates: Hybrid Approach (Extended Thinking + Tool Events)

**DECISION: Combining Extended Thinking for conversational updates with manual tool progress events for critical operations**

### Extended Thinking for Conversational Flow

**Configuration:**
```typescript
const response = await aiService.sendMessage({
  messages,
  tools,
  thinking: {
    type: 'enabled',
    budget_tokens: 5000  // Allocate tokens for thinking
  },
  stream: true,
  onThinkingDelta: (thinking) => {
    io.to(sessionId).emit('thinking_delta', { thinking });
  }
});
```

**Example Thinking Output:**
```
User wants to book a salon...
Let me search for salons near downtown...
I'll check the calendar for conflicts first...
Found 5 available providers, displaying them now...
```

**Use Cases:**
- General reasoning and planning
- Showing Claude's decision-making process
- Natural conversational flow

---

### Manual Tool Progress Events for Critical Operations

**Implementation:**
```typescript
// Enable thinking in Claude config
thinking: { type: 'enabled', budget_tokens: 5000 }

// Emit tool progress for critical operations
async function executeTool(toolName, input) {
  if (CRITICAL_TOOLS.includes(toolName)) {
    io.to(sessionId).emit('tool_start', {
      tool: toolName,
      status: TOOL_STATUS_MESSAGES[toolName]
    });
  }

  const result = await toolHandlers[toolName](input);

  if (CRITICAL_TOOLS.includes(toolName)) {
    io.to(sessionId).emit('tool_complete', {
      tool: toolName,
      result
    });
  }

  return result;
}

const CRITICAL_TOOLS = ['check_calendar_conflicts', 'create_booking', 'search_providers'];
const TOOL_STATUS_MESSAGES = {
  check_calendar_conflicts: 'Checking your calendar...',
  create_booking: 'Creating your booking...',
  search_providers: 'Searching for providers...'
};
```

**Use Cases:**
- Long-running operations (calendar API, database queries)
- Critical actions where precise status is important
- Operations where users need assurance of progress

### Combined Flow Example

```
User: "Find me a hair salon near downtown"

[Thinking Delta] "The user wants a salon near downtown. Let me search for options..."
[Tool Start Event] "Searching for providers..."  ← Backend emits
[Tool Complete Event] "Found 5 providers"         ← Backend emits
[Thinking Delta] "I'll display these providers..."
[Tool Use: display_provider_cards]                ← AI calls tool
[Display Providers Event] → Provider cards rendered ← Backend emits to frontend
[Text Delta] "I found 5 highly-rated salons near downtown. Which one interests you?"
```

**Key Point:** Tools ARE part of the conversation. When AI calls `display_provider_cards`, the Conversation Orchestrator executes it and emits to frontend via WebSocket.

**Why Hybrid:**
- ✅ Best user experience: conversational + precise status updates
- ✅ Extended Thinking provides natural reasoning (helps users understand AI's process)
- ✅ Tool Progress gives concrete feedback on long-running operations
- ✅ Provides context and transparency
- ✅ Minimal overhead (thinking tokens only used when AI reasons)

**Frontend Display Strategy:**
```tsx
// Show thinking in subtle, non-intrusive way
{thinkingText && (
  <div className="text-gray-500 text-sm italic">
    {thinkingText}
  </div>
)}

// Show tool progress with spinner
{toolProgress && (
  <div className="flex items-center gap-2">
    <Spinner />
    <span>{toolProgress.status}</span>
  </div>
)}
```

---

## 8. Data Models & Database Schema

### 8.1 Database Choice: SQLite with Drizzle ORM

**Database Driver: sqlite3 (async)**
- ✅ Non-blocking I/O (proper Node.js patterns)
- ✅ Avoids event loop blocking issues
- ✅ Production-ready for concurrent requests
- ✅ No in-memory caching layer needed (direct DB access is fast enough)

**Why SQLite:**
- ✅ Zero configuration, file-based
- ✅ Perfect for MVP and local development
- ✅ Fast for read-heavy workloads (<1ms queries with proper indexing)
- ✅ Easy to seed and reset
- ✅ Can migrate to Postgres later without code changes (using Drizzle)

**Why Drizzle ORM:**
- ✅ Type-safe async SQL query builder
- ✅ Excellent TypeScript integration
- ✅ Lightweight (no heavy runtime)
- ✅ Supports migrations
- ✅ Works with both sqlite3 (async) and Postgres
- ✅ All queries return Promises (async/await pattern)

### 8.2 Schema Definitions

```typescript
// db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'salon', 'mechanic', 'dentist', etc.
  description: text('description'),
  address: text('address').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  rating: real('rating').notNull(), // 1-5
  reviewCount: integer('review_count').default(0),
  phoneNumber: text('phone_number'),
  email: text('email'),
  website: text('website'),
  // Working hours stored as JSON: { "monday": { "open": "09:00", "close": "17:00" }, ... }
  workingHours: text('working_hours', { mode: 'json' }).notNull(),
  // Services offered as JSON array: ["haircut", "coloring", "styling"]
  services: text('services', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default_user'), // Static for MVP
  providerId: text('provider_id').notNull().references(() => providers.id),
  serviceType: text('service_type').notNull(),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  duration: integer('duration').notNull(), // minutes
  status: text('status').notNull(), // 'pending', 'confirmed', 'cancelled'
  calendarEventId: text('calendar_event_id'), // Google Calendar event ID
  idempotencyKey: text('idempotency_key').notNull().unique(), // Prevent duplicates
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const workflowStates = sqliteTable('workflow_states', {
  id: text('id').primaryKey(),  // Unique workflow ID (supports multiple bookings per session)
  sessionId: text('session_id').notNull(),  // Which session this workflow belongs to
  currentState: text('current_state').notNull(), // 'PROVIDER_SEARCH', 'PROVIDER_SELECTION', etc.
  status: text('status').notNull().default('active'), // 'active', 'completed', 'abandoned'
  // Context stored as JSON: { serviceType, location, selectedProviderId, bookingId, etc. }
  context: text('context', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  sessionIdIdx: index('session_id_idx').on(table.sessionId),  // Index for querying by session
  statusIdx: index('status_idx').on(table.status)  // Index for querying active workflows
}));

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  role: text('role').notNull(), // 'user' or 'assistant'
  // Content stored as JSON to support multi-block messages (text, tool_use, tool_result)
  content: text('content', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

### 8.3 TypeScript Types

```typescript
// types/workflow.types.ts
export enum WorkflowState {
  PROVIDER_SEARCH = 'PROVIDER_SEARCH',
  PROVIDER_SELECTION = 'PROVIDER_SELECTION',
  TIME_SELECTION = 'TIME_SELECTION',
  CONFIRMATION = 'CONFIRMATION',
  BOOKING_CREATED = 'BOOKING_CREATED',
  COMPLETE = 'COMPLETE'
}

export interface WorkflowContext {
  serviceType?: string;
  location?: string;
  timePreference?: string;
  selectedProviderId?: string;
  selectedProviders?: string[]; // IDs of search results
  selectedTimeSlot?: Date;
  bookingId?: string;
}

export interface WorkflowStateRecord {
  id: string;  // Unique workflow ID
  sessionId: string;  // Session this workflow belongs to
  currentState: WorkflowState;  // Current state in the state machine
  status: 'active' | 'completed' | 'abandoned';
  context: WorkflowContext;
  createdAt: Date;
  lastUpdated: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface Provider {
  id: string;
  name: string;
  category: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  phoneNumber?: string;
  email?: string;
  website?: string;
  workingHours: Record<string, { open: string; close: string }>;
  services: string[];
}

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  serviceType: string;
  scheduledAt: Date;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  calendarEventId?: string;
  idempotencyKey: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}
```

---

## 9. API Design

### 9.1 HTTP Endpoints

#### **POST /api/chat/sessions**
Create a new chat session
```typescript
Request: {}
Response: {
  sessionId: string;
  status: 'active';
  createdAt: Date;
}
```

#### **POST /api/chat/:sessionId**
Send user message (fallback for clients without WebSocket support)
```typescript
Request: {
  message: string;
}
Response: {
  status: 'processing';
}
```

#### **GET /api/providers**
Get all providers (for debugging/admin)
```typescript
Response: {
  providers: Provider[];
}
```

#### **GET /api/providers/:id/availability**
Get available time slots for a provider
```typescript
Query: {
  date?: string; // ISO date, defaults to today
  duration?: number; // minutes, defaults to 60
}
Response: {
  providerId: string;
  date: string;
  slots: TimeSlot[];
}
```

#### **POST /api/bookings**
Create booking (typically called via tool, but also available directly)
```typescript
Request: {
  providerId: string;
  serviceType: string;
  scheduledAt: string; // ISO datetime
  duration: number;
  notes?: string;
  idempotencyKey: string;
}
Response: {
  booking: Booking;
  calendarEvent?: {
    id: string;
    link: string;
  };
}
```

#### **GET /api/bookings/:id**
Get booking details
```typescript
Response: {
  booking: Booking;
  provider: Provider;
}
```

#### **GET /api/workflow/:sessionId**
Get current workflow state (for debugging/recovery)
```typescript
Response: {
  sessionId: string;
  currentState: WorkflowState;
  context: WorkflowContext;
  lastUpdated: Date;
}
```

### 9.2 WebSocket Events

#### **Client → Server Events**

**`user_message`**
```typescript
{
  message: string;
}
```

#### **Server → Client Events**

**`message_start`**
```typescript
{
  messageId: string;
}
```

**`text_delta`**
```typescript
{
  text: string;
}
```

**`thinking_delta`**
```typescript
{
  thinking: string;
}
```

**`tool_start`**
```typescript
{
  tool: string;
  status: string;
}
```

**`tool_complete`**
```typescript
{
  tool: string;
  success: boolean;
  result?: any;
}
```

**`display_providers`**
```typescript
{
  providers: Provider[];
  message: string;
}
```

**`display_time_slots`**
```typescript
{
  providerId: string;
  providerName: string;
  slots: TimeSlot[];
  message: string;
}
```

**`display_confirmation`**
```typescript
{
  booking: Booking;
  provider: Provider;
  message: string;
}
```

**`message_complete`**
```typescript
{
  messageId: string;
}
```

**`error`**
```typescript
{
  error: string;
  code: string;
}
```

---

## 9.3 Mock Availability Strategy

### Overview

Provider availability is calculated as: `working_hours - existing_bookings - past_times`

For the MVP, we use **hash-based deterministic mocking** to simulate realistic availability patterns without pre-seeding fake bookings in the database.

### Approach: Hash-Based Deterministic Mocking

Instead of storing fake bookings, the backend API:
1. Takes `providerId` and `date` as inputs
2. Computes a hash of `providerId + date`
3. Uses the hash to select one of 4 mock availability patterns
4. Returns deterministic results (same inputs = same output)

**Benefits:**
- No fake bookings in database
- Only real user bookings are stored
- Predictable for testing (same provider + date = same pattern)
- Variety without complexity

### The 4 Mock Patterns

| Pattern | Name | Description |
|---------|------|-------------|
| 0 | Fully Available | All slots within working hours are free |
| 1 | Light | 2-3 slots marked as unavailable |
| 2 | Moderate | ~50% of slots unavailable |
| 3 | Heavy | Only 2-3 slots available |

### Algorithm

```typescript
function getAvailability(providerId: string, date: string): TimeSlot[] {
  // 1. Get provider's working hours for that day of week
  const workingHours = getWorkingHours(providerId, dayOfWeek(date));

  // 2. Generate all possible 30-min slots within working hours
  let slots = generateSlots(workingHours);

  // 3. Filter out past times (if date is today)
  slots = filterPastSlots(slots, date);

  // 4. Get REAL bookings from database for this provider+date
  const realBookings = await getBookings(providerId, date);
  slots = filterBookedSlots(slots, realBookings);

  // 5. Apply mock unavailability pattern (hash-based)
  const patternIndex = hash(providerId + date) % 4;
  slots = applyMockPattern(slots, patternIndex);

  return slots;
}

function applyMockPattern(slots: TimeSlot[], pattern: number): TimeSlot[] {
  // Use seeded random (based on hash) for deterministic "random" selection
  switch (pattern) {
    case 0: return slots; // Fully available
    case 1: return markSlotsAsBusy(slots, 2-3);      // Light
    case 2: return markSlotsAsBusy(slots, slots.length / 2);  // Moderate
    case 3: return keepOnlyNSlotsFree(slots, 2-3);   // Heavy
  }
}
```

### AI Tool vs UI Button

**AI queries availability** (read-only, for conversational use):
- Tool: `get_availability` returns slot data
- AI can discuss availability: "I see they have openings at 10am and 2pm"
- AI does NOT trigger UI components

**UI displays slots** (user-initiated):
- "View Availability" button on provider cards
- User clicks → TimeSlotGrid component appears
- This is a direct user action, not AI-triggered

---

## 10. Integration Challenges & Solutions

### Challenge 1: Calendar API Rate Limits

**Problem:** Google Calendar API has rate limits (10,000 requests/day for free tier)

**Solution for MVP:**
- No caching or optimization needed initially
- If rate limit is hit during development/testing, upgrade to paid tier
- Direct API calls for simplicity
- Future optimization: Add caching layer if needed at scale

**Graceful Degradation:**
```typescript
async function checkCalendarConflicts(userId, startTime, duration) {
  try {
    const conflicts = await googleCalendar.checkConflicts(userId, startTime, duration);
    return conflicts;
  } catch (error) {
    if (error.code === 429) {
      logger.warn('Calendar API rate limited - suggesting upgrade');
      throw new Error('Calendar service temporarily unavailable. Please try again.');
    }
    throw error;
  }
}
```

### Challenge 2: Claude API Failures

**Problem:** Claude API can fail due to network issues, rate limits, or service outages

**Solution:**
- Implement exponential backoff with jitter
- Distinguish retryable (5xx, timeout) from non-retryable (4xx) errors
- Fall back to cached responses for repeated queries
- Provide user-friendly error messages

**Implementation:**
```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable = error.status >= 500 || error.code === 'ETIMEDOUT';
      const isLastAttempt = attempt === maxRetries - 1;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const response = await retryWithBackoff(() =>
  aiService.sendMessage({ messages, tools })
);
```

### Challenge 3: Database Concurrency (Booking Conflicts) - OUT OF SCOPE

**Problem:** Two users might try to book the same time slot simultaneously

**MVP Decision:** Out of scope for this iteration
- Single-user assumption for MVP means concurrency conflicts are unlikely
- Idempotency keys will prevent duplicate bookings from retry logic
- Future enhancement: Add database transactions with row-level locking when scaling to multi-user

**Simple MVP Approach:**
```typescript
async function createBooking(data, idempotencyKey) {
  // Check for existing booking with same idempotency key
  const existing = await db.query.bookings.findFirst({
    where: eq(bookings.idempotencyKey, idempotencyKey)
  });
  if (existing) return existing;

  // Create booking (no conflict checking for MVP)
  const booking = await db.insert(bookings).values({
    ...data,
    idempotencyKey,
    status: 'pending'
  });

  return booking;
}
```

**Future Solution:** Database transactions with pessimistic locking and overlap detection

### Challenge 4: Session Management & Reconnection

**Problem:** WebSocket/SSE connections can drop due to network issues

**Solution:**
- Persist message history to database
- On reconnection, send missed messages/events
- Use session IDs to track state across connections
- Implement exponential backoff for reconnection attempts

**Implementation:**
```typescript
// Frontend reconnection logic
socket.on('disconnect', () => {
  let reconnectAttempts = 0;
  const reconnect = () => {
    setTimeout(() => {
      socket.connect();
      reconnectAttempts++;
      if (reconnectAttempts < 5 && !socket.connected) {
        reconnect();
      }
    }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
  };
  reconnect();
});

socket.on('connect', async () => {
  // Request missed messages
  socket.emit('sync', { lastMessageId });
});

// Backend sync handler
socket.on('sync', async ({ lastMessageId }) => {
  const missedMessages = await messageManager.getMessagesSince(sessionId, lastMessageId);
  missedMessages.forEach(msg => {
    socket.emit('message_delta', msg);
  });
});
```

### Challenge 5: Tool Execution Timeout

**Problem:** Some tools (calendar API, database queries) might hang or take too long

**Solution:**
- Implement timeouts for all tool executions
- Use Promise.race to enforce time limits
- Provide fallback responses when tools timeout

**Implementation:**
```typescript
async function executeToolWithTimeout(toolName, input, timeoutMs = 60000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Tool ${toolName} timed out`)), timeoutMs)
  );

  const executionPromise = toolHandlers[toolName](input);

  try {
    return await Promise.race([executionPromise, timeoutPromise]);
  } catch (error) {
    logger.error(`Tool execution failed: ${toolName}`, error);

    // Return graceful fallback
    return {
      success: false,
      error: `Operation took too long. Please try again.`
    };
  }
}
```

### Challenge 6: Workflow State Consistency

**Problem:** Workflow state might become inconsistent if tool execution fails mid-flow

**Solution:**
- Use database transactions for state updates
- Implement rollback on errors
- Store workflow state snapshots before critical operations
- Allow manual state reset via admin endpoint

**Implementation:**
```typescript
async function transitionWorkflowState(sessionId, toState, context) {
  return db.transaction(async (tx) => {
    // Load current state
    const current = await tx.query.workflowStates.findFirst({
      where: eq(workflowStates.sessionId, sessionId)
    });

    // Validate transition
    if (!isValidTransition(current.currentState, toState)) {
      throw new Error(`Invalid transition: ${current.currentState} → ${toState}`);
    }

    // Update state
    await tx.update(workflowStates)
      .set({
        currentState: toState,
        context,
        lastUpdated: new Date()
      })
      .where(eq(workflowStates.sessionId, sessionId));

    // Log transition
    logger.info('Workflow transition', {
      sessionId,
      from: current.currentState,
      to: toState,
      context
    });
  });
}
```

### Challenge 7: Streaming Long Claude Responses

**Problem:** Long Claude responses might buffer too much data before sending to client

**Solution:**
- Use Claude's streaming API
- Forward text deltas immediately to client
- Implement backpressure handling if client is slow

**Implementation:**
```typescript
async function streamClaudeResponse(sessionId, messages, tools) {
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    messages,
    tools
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'text_delta') {
        io.to(sessionId).emit('text_delta', { text: event.delta.text });
      } else if (event.delta.type === 'thinking_delta') {
        io.to(sessionId).emit('thinking_delta', { thinking: event.delta.thinking });
      }
    }
  }

  const finalMessage = await stream.finalMessage();
  return finalMessage;
}
```

---

## 11. Dependency Analysis

### 11.1 NPM Packages

#### **Backend Core**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "sqlite3": "^5.1.7",
    "drizzle-orm": "^0.29.3",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "googleapis": "^131.0.0",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "drizzle-kit": "^0.20.9",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "vitest": "^1.1.1"
  }
}
```

#### **Frontend Core**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.1",
    "@tanstack/react-query": "^5.17.9",
    "zustand": "^4.4.7",
    "date-fns": "^3.0.6",
    "react-markdown": "^9.0.1",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### 11.2 Environment Variables

```bash
# .env
NODE_ENV=development
PORT=3000

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Google Calendar (OAuth2)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_CALENDAR_ID=primary

# Database
DATABASE_PATH=./data/app.db

# Session
SESSION_TIMEOUT_HOURS=24

# Frontend (for CORS)
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## 12. Deployment & Development Workflow

### 12.1 Development Setup

```bash
# Install dependencies
npm install

# Setup database
npm run db:migrate
npm run db:seed

# Start backend (with hot reload)
npm run dev:backend

# Start frontend (separate terminal)
npm run dev:frontend
```

### 12.2 Database Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed database with test data
npm run db:seed

# Reset database (drop all tables and reseed)
npm run db:reset
```

### 12.3 Logging Strategy

Use Winston for structured logging with different transports:

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Usage
logger.info('Workflow transition', {
  sessionId: '123',
  from: 'PROVIDER_SEARCH',
  to: 'PROVIDER_SELECTION'
});

logger.error('Claude API failed', {
  error: error.message,
  requestId: '456',
  retryCount: 2
});
```

### 12.4 Testing Strategy

**Unit Tests:**
- Workflow state machine transitions
- Tool input validation
- Idempotency key generation
- Calendar conflict detection logic

**Integration Tests:**
- AI API mocking and response parsing
- Database operations with test DB
- WebSocket event flow

**Manual QA Testing:**
- Use **Playwright MCP** for automated browser testing and manual QA
- Test full user flows through chat interface
- Verify provider cards display correctly
- Test booking confirmation flow
- Validate WebSocket real-time updates
- Cross-browser testing (Chrome, Firefox, Safari)

**E2E Tests (Optional):**
- Full booking flow from user message to confirmation
- Multi-step conversation handling
- Multiple bookings per session workflow

---

## Summary

### Finalized Architecture Decisions

**Real-Time Communication**
- ✅ WebSockets (Socket.io) for bidirectional, low-latency updates
- ✅ Persistent connections with automatic reconnection
- ✅ Multiple event types for different update categories

**UI State Synchronization**
- ✅ Tool-based UI commands (`display_provider_cards`, `display_time_slots`, etc.)
- ✅ Claude explicitly calls tools to trigger frontend rendering
- ✅ Structured validation via JSON schemas

**Progress Updates**
- ✅ Hybrid approach: Extended Thinking + manual tool progress events
- ✅ Extended Thinking (5000 token budget) for conversational reasoning
- ✅ Manual events for critical operations (calendar, booking creation)

**Data & Persistence**
- ✅ SQLite with Drizzle ORM for type safety and portability
- ✅ Database migrations for schema versioning
- ✅ Message history and workflow state persisted

**Calendar Integration**
- ✅ Google Calendar API (direct calls, no caching for MVP)
- ✅ Graceful error handling
- ✅ Upgrade to paid tier if rate limits hit

**Error Handling & Reliability**
- ✅ Exponential backoff with jitter for API retries
- ✅ Idempotency keys for booking creation
- ✅ Database transactions for state consistency
- ✅ Structured logging with Winston
- ✅ Request tracing with unique IDs

### Key Strengths of This Architecture

**Reliability**
- Idempotency prevents duplicate bookings
- Database transactions ensure state consistency
- Retry logic handles transient failures
- Fallback strategies for external API failures

**Observability**
- Structured logging captures all state transitions
- Request IDs enable end-to-end tracing
- Error categorization aids debugging
- Token usage tracking for cost monitoring

**Scalability**
- Modular service-based design
- Drizzle ORM allows easy migration to Postgres
- Stateless tool handlers can be extracted to microservices
- WebSocket architecture supports horizontal scaling

**Developer Experience**
- TypeScript strict mode throughout
- Clear module boundaries and responsibilities
- Type-safe database queries
- Comprehensive error handling patterns

**User Experience**
- Real-time updates via WebSockets
- Progress transparency (thinking + tool events)
- Graceful error recovery with user-friendly messages
- Conversation state persists across sessions

### Implementation Recommendations

**Calendar Integration: Service Account (MVP)**
- Use service account for simplified OAuth flow
- Single user assumption for MVP
- Easy to migrate to OAuth2 for multi-user later

**Message Persistence: Full History**
- Persist all messages (not just workflow state)
- Enables conversation history and debugging
- Minimal storage cost with SQLite

**WebSocket Reconnection: Automatic**
- Socket.io built-in reconnection with exponential backoff
- Message sync on reconnection to catch missed events
- Better UX without requiring user action

**Extended Thinking: Enabled**
- Allocate 5000 tokens for thinking budget
- Provides transparency and better UX
- Minimal cost impact relative to value

---

This ERD provides a comprehensive technical foundation for implementation with all major architectural decisions finalized.
