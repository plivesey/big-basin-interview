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

### Technical Specs
- **[PRD](documentation/prd.md)** - Product requirements, user stories, acceptance criteria
- **[ERD](documentation/erd.md)** - System architecture, data models, API design, Claude SDK integration
- **[Architecture Decisions](documentation/ARCHITECTURE_DECISIONS.md)** - WebSockets vs REST, state management, tool patterns

### Design System
- **[Brand Strategy](documentation/brand-strategy.md)** - "The Trusted Guide" - warm, smart, reliable
- **[Component Library](documentation/DLS/component-library.md)** - Complete UI component specs with Tailwind classes
- **[TypeScript Style Guide](documentation/typescript-style-guide.md)** - Naming, types, ESLint rules

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

## Current Implementation Status

### Completed
✅ Backend heartbeat API (`/api/heartbeat`)
✅ Frontend with Tailwind CSS + brand colors
✅ Component library (Button, Card, Input, Badge, etc.)
✅ Development environment (Vite, nodemon, ts-node)

### Next Steps
- [ ] SQLite database schema (providers, bookings, messages, workflows)
- [ ] Claude SDK integration with streaming
- [ ] WebSocket chat interface
- [ ] Tool registry (search_providers, check_calendar, create_booking)
- [ ] Conversation orchestrator with message history
- [ ] Google Calendar API integration

---

## Development

**Start Backend**: `cd backend && npm run dev` (port 3001)
**Start Frontend**: `cd frontend && npm run dev` (port 5173)

**Brand Colors**:
- Primary: Indigo (`#4F46E5`) - trust, capability
- Accent: Amber (`#F59E0B`) - warmth, energy

**Component Classes**: See `frontend/src/index.css` for pre-built Tailwind classes (`.btn-primary`, `.card-hover`, `.message-user`, etc.)

---

## For Full Details

All comprehensive documentation, including detailed architecture diagrams, data schemas, API specifications, and implementation patterns, is in the `documentation/` folder. This file is just a quick navigation guide.
