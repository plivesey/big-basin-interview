/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * A scripted stand-in for the chat backend, for driving the mobile app without
 * burning Anthropic tokens (or when the API key is unavailable).
 *
 * It speaks the same Socket.io protocol the real server does -- session_created,
 * message_history, message_start, text_delta, display_providers,
 * open_provider_detail, message_complete -- and proxies every REST call
 * straight through to the real backend, so providers, availability and bookings
 * are all real data hitting the real database.
 *
 * Usage:
 *   node scripts/dev-scripted-server.js            # listens on :3002
 *   EXPO_PUBLIC_BACKEND_URL=http://localhost:3002 npx expo start
 *
 * Requires the real backend on :3001 and a seeded database.
 */
const http = require('node:http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT || 3002);
const UPSTREAM = process.env.UPSTREAM || 'http://localhost:3001';

// A session + workflow that already exist in the database. Create them with
// scripts/seed-dev-session.js, which prints the ids.
const SESSION_ID = process.env.DEV_SESSION_ID;
const WORKFLOW_ID = process.env.DEV_WORKFLOW_ID;

if (!SESSION_ID || !WORKFLOW_ID) {
  console.error('Set DEV_SESSION_ID and DEV_WORKFLOW_ID (see scripts/seed-dev-session.js).');
  process.exit(1);
}

/** Proxy every HTTP request to the real backend. */
const server = http.createServer(async (req, res) => {
  const url = `${UPSTREAM}${req.url}`;
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const upstream = await fetch(url, {
        method: req.method,
        headers: { 'content-type': req.headers['content-type'] || 'application/json' },
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { 'content-type': 'application/json' });
      res.end(text);
    } catch (error) {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { code: 'PROXY', message: String(error) } }));
    }
  });
});

const io = new Server(server, { cors: { origin: '*' } });

async function fetchProviders(query) {
  const response = await fetch(`${UPSTREAM}/api/providers?q=${encodeURIComponent(query)}`);
  const body = await response.json();
  return (body?.data?.providers ?? []).slice(0, 3).map((provider) => ({
    id: provider.id,
    name: provider.name,
    category: provider.category,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    services: provider.services,
    address: provider.address,
  }));
}

function streamText(socket, text, done) {
  const words = text.split(' ');
  let index = 0;
  const timer = setInterval(() => {
    if (index >= words.length) {
      clearInterval(timer);
      done();
      return;
    }
    socket.emit('text_delta', { text: (index === 0 ? '' : ' ') + words[index] });
    index += 1;
  }, 40);
}

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.emit('session_created', { sessionId: SESSION_ID, currentWorkflowId: WORKFLOW_ID });
  socket.emit('message_history', { messages: [] });

  socket.on('user_message', async ({ message }) => {
    const messageId = `msg-${Date.now()}`;
    socket.emit('message_start', { messageId });

    const providers = await fetchProviders('salon');

    streamText(
      socket,
      "Happy to help. Here are three salons in **San Francisco** with good reviews:\n\n" +
        providers.map((p) => `- ${p.name}`).join('\n') +
        '\n\nTap one to see times.',
      () => {
        socket.emit('tool_start', { toolName: 'display_provider_cards', toolUseId: 'tool-1' });
        socket.emit('display_providers', {
          providers,
          workflowId: WORKFLOW_ID,
          workflowState: 'PROVIDER_SELECTION',
        });
        socket.emit('tool_complete', {
          toolName: 'display_provider_cards',
          toolUseId: 'tool-1',
          success: true,
        });
        socket.emit('message_complete', { messageId });
      }
    );
    console.log('replied to:', message);
  });

  socket.on('sync', () => {
    socket.emit('message_history', { messages: [] });
  });
});

server.listen(PORT, () => {
  console.log(`scripted chat server on :${PORT}, proxying REST to ${UPSTREAM}`);
  console.log(`session=${SESSION_ID} workflow=${WORKFLOW_ID}`);
});
