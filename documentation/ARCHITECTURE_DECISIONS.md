# Architecture Decisions Summary

**Date:** 2025-12-17
**Status:** Finalized

---

## Key Questions Answered

### 1. **Zustand & Jotai - What are they for?**

**Zustand** (recommended, ~1KB):
- Local UI state management library for React
- Use for: Chat UI state, message buffers, typing indicators, UI flags
- Lightweight alternative to Redux
- Simple API: `const useStore = create((set) => ({ ... }))`

**Why needed?**
- **React Query/SWR** handles server state (provider data, bookings from REST API)
- **Zustand** handles client-only UI state (is user typing?, show/hide modals, scroll position)
- Keeps React components clean and avoids prop drilling

---

### 2. **WebSockets vs REST APIs - When to use each?**

**WebSocket (Socket.io):**
- **Use for:** Chat interface ONLY
- Real-time bidirectional communication
- Events: `user_message`, `text_delta`, `thinking_delta`, `tool_start`, `display_providers`, etc.

**REST API (HTTP/JSON):**
- **Use for:** All CRUD operations
- GET `/api/providers` - List providers
- GET `/api/bookings` - Get booking history
- POST `/api/bookings` - Create booking (can also be called via tool)
- GET `/api/sessions` - Session management

**Architecture:**
```
Frontend:
  - WebSocket: Chat messages only
  - REST API: Provider browsing, booking history, session management

Backend:
  - Express HTTP server serves both
  - Socket.io handler for WebSocket
  - Standard REST routes for CRUD
```

---

### 3. **Is Conversation Orchestrator Necessary?**

**YES, it's necessary. Here's why:**

**Claude Messages API is STATELESS:**
- Does NOT store conversation history server-side
- Does NOT provide built-in tool execution loop
- Does NOT manage session state

**We must build ourselves:**
1. **Message History Management**
   - Maintain `messages[]` array per session
   - Pass full history on each API call

2. **Tool Execution Loop**
   - Detect `stop_reason === "tool_use"`
   - Execute tools (search, display, bookings)
   - Return results to AI
   - Repeat until complete

3. **Business Logic Orchestration**
   - Tools ARE the conversation (display cards, create bookings)
   - Integrate streaming with WebSocket emission
   - Manage workflow state transitions

**Conversation Orchestrator coordinates all this.**

---

### 4. **How Does Claude SDK Client Work?**

**Single Global Instance (Stateless):**
```typescript
// ONE instance for entire app
const aiClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Reused for all requests, all sessions, all users
```

**Message History Per Session:**
```typescript
// In-memory or DB storage per session
const sessionMessages = new Map<string, Message[]>();

// Session 1
sessionMessages.set('session-1', [
  { role: 'user', content: 'Find me a salon' },
  { role: 'assistant', content: [...] }
]);

// Session 2 (separate history)
sessionMessages.set('session-2', [
  { role: 'user', content: 'Book a dentist' },
  { role: 'assistant', content: [...] }
]);
```

**Each API Call Sends Full History:**
```typescript
const messages = sessionMessages.get(sessionId);
messages.push({ role: 'user', content: newMessage });

const response = await aiClient.messages.create({
  model: 'claude-sonnet-4-5',
  messages: messages,  // Full history every time!
  tools: [...]
});

messages.push({ role: 'assistant', content: response.content });
sessionMessages.set(sessionId, messages);
```

**Key Insights:**
- SDK client has NO state
- We manage state externally
- MVP: In-memory Map (session → messages[])
- Production: SQLite `messages` table

---

### 5. **Provider-Agnostic Naming (No "Claude")**

**Updated Naming:**
```
❌ ClaudeService         → ✅ AI Conversation Service
❌ claude-service.ts     → ✅ ai-conversation-service.ts
❌ claudeClient          → ✅ aiClient
❌ claudeService.send()  → ✅ aiService.sendMessage()
```

**Why Abstracted:**
- Future flexibility to swap providers
- Claude → GPT-4 → Gemini without app changes
- Service layer abstracts AI implementation

**Where we KEEP "Claude":**
- Internal documentation about Claude-specific API details
- Comments explaining Claude Messages API behavior
- Environment variables: `ANTHROPIC_API_KEY` (provider-specific)

---

### 6. **Architecture Diagram: REST + WebSockets**

```
Frontend (React)
  ├─ WebSocket Client → Chat interface only
  └─ HTTP Client (axios/fetch) → CRUD operations

Backend (Express)
  ├─ Socket.io Server → Chat events
  └─ REST API Routes → Providers, Bookings, Sessions

Both route through:
  └─ Conversation Orchestrator → Manages everything
      ├─ AI Conversation Service → Stateless API calls
      ├─ Tool Registry → Execute business logic
      ├─ Workflow State Manager → State machine
      └─ Data Layer → SQLite, Calendar API
```

**Clear Separation:**
- **WebSocket**: Real-time chat experience
- **REST API**: Standard CRUD operations
- **Both**: Can trigger same business logic (e.g., create booking)

---

### 7. **Data Layer → Claude AI API Relationship**

**Data Layer does NOT talk directly to AI API.**

**Correct Flow:**
```
WebSocket/REST Request
   ↓
Conversation Orchestrator
   ↓
AI Conversation Service (stateless wrapper)
   ↓
Claude Messages API (external)
```

**Data Layer provides:**
- SQLite DB: Providers, Bookings, Messages, Workflow State
- Google Calendar API: Conflict detection, event creation
- In-Memory Cache: Active sessions, message buffers

**AI Service provides:**
- Single global SDK client
- Message sending with streaming
- Response parsing
- Retry logic

**They don't interact directly - Orchestrator coordinates both.**

---

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Real-Time** | WebSockets (Socket.io) | Bidirectional, low latency, chat UX |
| **UI Sync** | Tool-based commands | Reliable, validated, AI-controlled |
| **Progress** | Hybrid (Thinking + Events) | Best UX, transparency |
| **Orchestrator** | YES, necessary | API is stateless, we manage history/tools |
| **SDK Instance** | Single global instance | Stateless client, reused everywhere |
| **Message Storage** | SQLite (async) | Direct DB access, no caching layer |
| **Workflow Pattern** | One workflow ID per booking | Supports multiple bookings per session |
| **Naming** | Provider-agnostic (AI Service) | Future flexibility |
| **REST vs WS** | Both - WS for chat, REST for CRUD | Clear separation of concerns |

---

## Multiple Bookings Per Session Pattern

### The Problem
Original schema used `sessionId` as primary key for workflow states, which meant only one booking per session. User requirement: support multiple bookings in a single conversation.

### The Solution
Each booking flow gets its own **workflow ID**:

```typescript
// User starts conversation
sessionId = "sess_abc123"

// User: "Book me a salon"
workflowId_1 = createWorkflow(sessionId)  // "wf_001"
// Progress through PROVIDER_SEARCH → PROVIDER_SELECTION → CONFIRMATION → BOOKING_CREATED

// User: "Also book a dentist"
workflowId_2 = createWorkflow(sessionId)  // "wf_002"
// New independent workflow in same session

// Database:
workflow_states:
  - id: "wf_001", sessionId: "sess_abc123", status: "completed", bookingId: "booking_1"
  - id: "wf_002", sessionId: "sess_abc123", status: "active", currentState: "PROVIDER_SEARCH"
```

### Benefits
- ✅ Multiple bookings per session
- ✅ Independent state machines (don't interfere)
- ✅ Complete workflow history (audit trail)
- ✅ Can resume any workflow by ID
- ✅ Clear lifecycle: active → completed/abandoned

### Query Patterns
```typescript
// Get active workflows for current session
const activeWorkflows = await getActiveWorkflows(sessionId);

// Continue specific workflow
const workflow = await getWorkflow(workflowId);
await transition(workflowId, 'TIME_SELECTION', { selectedProviderId: 'p123' });

// Complete workflow when booking created
await completeWorkflow(workflowId);
```

---

## Implementation Checklist

- [ ] Create `ai-conversation-service.ts` (not claude-service.ts)
- [ ] Initialize single global Anthropic client
- [ ] Build Conversation Orchestrator with message history management
- [ ] Implement tool execution loop (detect tool_use → execute → return)
- [ ] Setup WebSocket server for chat interface
- [ ] Setup REST routes for providers/bookings/sessions
- [ ] Configure Zustand for chat UI state
- [ ] Configure React Query for server data (REST API)
- [ ] Store messages in SQLite (async, direct DB access)
- [ ] Implement workflow state manager with workflow ID pattern (not sessionId PK)
- [ ] Enable Extended Thinking (5000 token budget)
- [ ] Emit tool progress events for critical operations
- [ ] Setup Playwright MCP for manual QA testing

---

## Out of Scope (MVP)

**Calendar API Optimization:**
- No caching layer for calendar requests
- Direct API calls (simple and fast for single user)
- If rate limits hit, upgrade to paid tier

**Database Concurrency:**
- No pessimistic locking or transaction-based conflict detection
- Single user assumption means conflicts unlikely
- Future: Add row-level locking when scaling to multi-user

---

**Updated PRD:** See `documentation/prd.md`
**Updated ERD:** See `documentation/erd.md`
