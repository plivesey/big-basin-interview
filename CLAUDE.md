# Service Booking Assistant - Quick Reference

AI-powered conversational assistant for discovering and booking local services (salons, mechanics, dentists). Built with React, Express, TypeScript, and Claude SDK.

---

## Project Structure

```
├── backend/                     # Node.js/Express API server
│   └── src/index.ts            # Heartbeat API endpoint
├── frontend/                    # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/         # Reusable UI components (Button, Card, Input, etc.)
│   │   ├── App.tsx            # Main app with heartbeat status check
│   │   └── index.css          # Tailwind + custom component classes
│   └── tailwind.config.js     # Brand colors (indigo/amber), custom utilities
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

**Frontend**: React 18+ with Tailwind CSS v4
- WebSocket (Socket.io): Real-time chat interface
- REST API: Provider browsing, booking history
- State: Zustand (UI state) + React Query (server data)

**Backend**: Express + TypeScript + SQLite
- REST endpoints for CRUD operations
- WebSocket server for chat streaming
- Claude SDK integration (stateless Messages API)
- Tool execution loop (search, display, bookings)

**Key Patterns**:
- Conversation Orchestrator manages message history + tool execution
- Tool-based UI commands (`display_providers`, `display_time_slots`)
- Hybrid progress updates (Extended Thinking + tool events)
- One workflow ID per booking (supports multiple bookings per session)

---

## Development

**Start Backend**: `cd backend && npm run dev` (port 3001)
**Start Frontend**: `cd frontend && npm run dev` (port 5173)

**Component Classes**: See `frontend/src/index.css` for pre-built Tailwind classes (`.btn-primary`, `.card-hover`, `.message-user`, etc.)

## Other Instructions

**NEVER SWITCH BRANCHES** - Always ask the user to do this for you

## For Full Details

All comprehensive documentation, including detailed architecture diagrams, data schemas, API specifications, and implementation patterns, is in the `documentation/` folder.
