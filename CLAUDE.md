# Service Booking Assistant - Quick Reference

AI-powered conversational assistant for discovering and booking local services (salons, mechanics, dentists). Built with React, Express, TypeScript, and Claude SDK.

---

## Project Structure

```
├── backend/                     # Express + TypeScript + SQLite + Socket.io
│   └── src/                    # routes, services, tools, websocket, db
├── frontend/                    # React + TypeScript + Tailwind (web client)
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── store/              # Zustand stores
│       ├── hooks/useWebSocket.ts
│       └── index.css           # Tailwind + custom component classes
├── mobile/                      # React Native (Expo) client for iOS
├── packages/shared-types/       # Types shared by every client
└── documentation/              # Full specs and design docs
```

---

## Key Documentation

### Implementation Plan (ALWAYS UPDATE THIS!)
- **[PLAN](documentation/plan.md)** - **MAIN IMPLEMENTATION PLAN** - 9 milestones with checkboxes, testing requirements, and progress tracking
  - **IMPORTANT:** Update this file as you work! Check off completed tasks, update progress, add notes.
  - This is the source of truth for what's done and what's next.

### Technical Specs
- **[PRD](documentation/prd.md)** - Product requirements, user stories, acceptance criteria
- **[ERD](documentation/erd.md)** - System architecture, data models, API design, Claude SDK integration
- **[Architecture Decisions](documentation/ARCHITECTURE_DECISIONS.md)** - WebSockets vs REST, state management, tool patterns

### Design System
- **[Brand Strategy](documentation/brand-strategy.md)** - "The Trusted Guide" - warm, smart, reliable
- **[Component Library](documentation/DLS/component-library.md)** - Complete UI component specs with Tailwind classes
- **[TypeScript Style Guide](documentation/typescript-style-guide.md)** - Naming, types, ESLint rules

---

## Documentation Guidelines

**Agents should proactively maintain documentation** as the codebase evolves. Don't wait to be asked - update and create docs when implementing features or making architectural changes.

### Documentation Structure

**High-Level Documentation** → `documentation/`
- Architecture decisions, system design, API specs
- Examples: PRD, ERD, brand strategy, style guides

**Feature Documentation** → `documentation/features/`
- Specific feature implementations, workflows, integration guides
- Create one doc per major feature as you build it

**Folder-Level Documentation** → `CLAUDE.md` in any folder with complex code
- Explain the purpose, structure, and key files in that folder
- Create/update these files freely - they help future agents navigate
- Examples: `backend/src/CLAUDE.md`, `frontend/src/services/CLAUDE.md`

### When to Document
- ✅ After implementing a non-trivial feature
- ✅ When making architectural decisions
- ✅ When creating new modules or services
- ✅ When patterns or conventions change
- ✅ Before complexity becomes hard to understand

---

## Architecture Overview

**Frontend**: React 19 with Tailwind CSS v4
- WebSocket (Socket.io): Real-time chat interface
- REST API: Provider details, availability, bookings, sessions
- State: Zustand only. There is no React Query and no server-cache library; the stores call `fetch` directly.

**Mobile**: Expo SDK 57 + expo-router + NativeWind, in `mobile/`
- Same backend, same socket protocol, same Zustand stores as the web client
- See [mobile/CLAUDE.md](mobile/CLAUDE.md) and [documentation/features/mobile-app.md](documentation/features/mobile-app.md)

**Backend**: Express + TypeScript + SQLite
- REST endpoints for CRUD operations
- WebSocket server for chat streaming
- Claude SDK integration (stateless Messages API)
- Tool execution loop (search, display, bookings)

**Key Patterns**:
- Conversation Orchestrator manages message history + tool execution
- Tool-based UI commands. The server emits `display_providers` and `open_provider_detail`; time slots are fetched over REST from `GET /api/providers/:id/availability`, not pushed by a tool
- Streaming text plus `tool_start` / `tool_complete` events
- One workflow ID per booking (supports multiple bookings per session)

**Worth knowing**: the seeded database holds 742 providers across 20 categories and 7 regions, not a handful of mocks. `assistant_message` and `booking_success` are declared in the shared socket types but never emitted by the server.

---

## Development

**Start Backend**: `cd backend && npm run dev` (port 3001)
**Start Frontend**: `cd frontend && npm run dev` (port 5173)
**Start Mobile**: `cd mobile && npx expo start` (press `i` for the iOS simulator)

**Component Classes**: See `frontend/src/index.css` for pre-built Tailwind classes (`.btn-primary`, `.card-hover`, `.message-user`, etc.)

## Other Instructions

**NEVER SWITCH BRANCHES** - Always ask the user to do this for you

**ALWAYS USE COPYWRITER AGENT FOR USER-FACING COPY** - When writing any user-facing text (error messages, success messages, button labels, placeholders, headings, descriptions, or any UI text users will see), use the copywriter agent (`.claude/agents/copywriter.md`). This ensures all copy follows our brand voice and tone guidelines. Never write user-facing copy directly without using the copywriter agent.

**NO EMOJIS** - Never use emojis in any user-facing copy. Our brand voice is professional and clean.

## For Full Details

All comprehensive documentation, including detailed architecture diagrams, data schemas, API specifications, and implementation patterns, is in the `documentation/` folder.
