# Start Backend Server

Use this skill when you need to start the backend development server.

## Instructions

1. **Check the port** - Read `backend/.env` to find the PORT value
2. **Start the server** - Run `npm run dev` from the backend directory
3. **Verify startup** - Wait a few seconds then hit the heartbeat endpoint

## Steps

```bash
# From backend directory
cd backend

# Check the configured port
PORT=$(grep "^PORT=" .env | cut -d'=' -f2)
echo "Backend will run on port: $PORT"

# Start the server (runs in background with nodemon)
npm run dev &

# Wait for startup
sleep 5

# Verify it's running
curl -s http://localhost:$PORT/api/heartbeat
```

## Important Notes

- The port is configured in `backend/.env` - always check this file for the actual port
- The server uses nodemon so it auto-restarts on file changes
- Always check the .env file for the actual port before making API requests
- WebSocket runs on the same port as the REST API

## Verifying the Server

After starting, you can verify with:
```bash
PORT=$(grep "^PORT=" backend/.env | cut -d'=' -f2)
curl http://localhost:$PORT/api/heartbeat
```

Should return:
```json
{"status":"ok","timestamp":"...","message":"Server is running"}
```
