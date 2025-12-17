# Service Booking Assistant (Scout)

An AI-powered conversational assistant for discovering and booking local services like salons, mechanics, and dentists. Built with React, Express, TypeScript, and the Claude SDK.

## Project Structure

```
agentic-service-booking-assistant/
├── backend/              # Express + TypeScript + SQLite API server
├── frontend/             # React + Vite + Tailwind chat interface
├── packages/
│   └── shared-types/     # Shared TypeScript types
└── documentation/        # Detailed specs and design docs
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

1. **Clone and install dependencies:**

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root
cd ..
```

2. **Configure environment:**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY

# Frontend (optional - defaults work for local development)
cp frontend/.env.example frontend/.env
```

3. **Initialize the database:**

```bash
cd backend
npm run db:push    # Create tables
npm run db:seed    # Add sample providers
```

4. **Start development servers:**

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

5. **Open the app:**

Visit [http://localhost:5173](http://localhost:5173)

## Architecture Overview

### Frontend

- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **Zustand** for state management with optimized selectors
- **Socket.io-client** for real-time WebSocket communication

Key components:
- `ChatContainer` - Main chat interface
- `MessageList` - Displays conversation history
- `ChatInput` - Message input with auto-resize
- `ErrorBoundary` - Catches and displays errors gracefully

### Backend

- **Express 5** with TypeScript
- **SQLite** with Drizzle ORM (WAL mode enabled)
- **Socket.io** for WebSocket communication
- **Claude SDK** for AI conversations

Key services:
- `ai-conversation-service` - Claude SDK integration with streaming
- `message-service` - Message persistence
- `provider-service` - Provider search and retrieval
- `session-service` - Chat session management

### Shared Types

The `packages/shared-types` package contains TypeScript types shared between frontend and backend:
- `MessageContent` - Message content blocks (text, tool_use, tool_result)
- `ChatMessage` - Core message interface
- `ServerToClientEvents` / `ClientToServerEvents` - WebSocket event types

## Available Scripts

### Backend

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run test         # Run tests
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed sample data
npm run db:studio    # Open Drizzle Studio
npm run db:reset     # Reset database (delete, recreate, seed)
```

### Frontend

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run preview      # Preview production build
```

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Claude API key |
| `PORT` | No | 3001 | Server port |
| `DATABASE_PATH` | No | ./data/app.db | SQLite database path |
| `CLAUDE_MODEL` | No | claude-sonnet-4-5 | Claude model to use |
| `FRONTEND_URL` | No | http://localhost:5173 | Frontend URL for CORS |
| `LOG_LEVEL` | No | info | Logging level |

See `backend/.env.example` for all options.

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BACKEND_URL` | No | http://localhost:3001 | Backend API URL |

## Testing

```bash
# Run all backend tests
cd backend && npm test

# Run all frontend tests
cd frontend && npm test

# Run with coverage
npm run test:coverage
```

## Documentation

Detailed documentation is available in the `documentation/` folder:

- **[Implementation Plan](documentation/plan.md)** - Milestone tracking and progress
- **[Product Requirements](documentation/prd.md)** - User stories and acceptance criteria
- **[Architecture](documentation/erd.md)** - System design and data models
- **[Brand Strategy](documentation/brand-strategy.md)** - Voice, tone, and guidelines
- **[Component Library](documentation/DLS/component-library.md)** - UI component specs
- **[TypeScript Style Guide](documentation/typescript-style-guide.md)** - Code conventions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| State Management | Zustand 5 |
| Backend Framework | Express 5 |
| Database | SQLite + Drizzle ORM |
| Real-time | Socket.io 4 |
| AI | Claude SDK (Anthropic) |
| Testing | Vitest |
| Language | TypeScript 5.9 |

## License

Private - All rights reserved.
