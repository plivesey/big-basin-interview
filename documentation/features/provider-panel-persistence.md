# Provider Panel Persistence

## Overview

When users refresh the page or reconnect to the application during an active booking workflow, the provider panel automatically restores to show the previously displayed providers. This prevents users from losing their place in the booking flow.

## Problem

Without this feature:
- User searches for providers and sees results in the side panel
- User refreshes the page (accidentally or intentionally)
- Provider panel is empty, even though the workflow is still active
- User must re-search or re-engage with the assistant to see providers again

## Solution

The backend automatically restores the provider panel on session reconnect by:

1. **Detecting active workflows**: When a WebSocket connection is established, the server checks if the session has an active workflow (`session.currentWorkflowId`)

2. **Validating workflow state**: Only restores the panel for active workflow states where providers are relevant:
   - `PROVIDER_SEARCH` - User is viewing search results
   - `PROVIDER_SELECTION` - User is selecting a provider

   Does NOT restore for:
   - `COMPLETE` - Booking is finished, no need to show providers

3. **Fetching provider data**: Retrieves full provider details from the database using the IDs stored in `workflow.context.selectedProviders`

4. **Emitting to frontend**: Sends a `display_providers` WebSocket event with the provider data, which the frontend handles identically to a fresh search

## Implementation

### Backend (`backend/src/websocket/chat-handler.ts`)

On WebSocket connection, after sending session info and message history:

```typescript
if (session.currentWorkflowId) {
  const workflow = await getWorkflow(session.currentWorkflowId);

  const activeStates = [WorkflowState.PROVIDER_SEARCH, WorkflowState.PROVIDER_SELECTION];

  if (workflow && activeStates.includes(workflow.currentState) && workflow.context.selectedProviders?.length) {
    const providers = await getProvidersByIds(workflow.context.selectedProviders);
    socket.emit('display_providers', { providers, workflowId, workflowState });
  }
}
```

### Frontend (`frontend/src/hooks/useWebSocket.ts`)

The frontend already handles `display_providers` events, so no changes are needed for the restore logic. The panel opens automatically when providers are received.

### Toggle Button (`frontend/src/components/ChatContainer.tsx`)

A toggle button in the chat header allows users to re-open the panel after closing it:
- Only visible when: connected, panel closed, providers exist, workflow not complete
- Providers are preserved when closing the panel (not cleared)
- `clearProviders()` is only called when a booking completes

## Related Files

- `backend/src/websocket/chat-handler.ts` - Session restore logic
- `backend/src/services/provider-service.ts` - `getProvidersByIds()` function
- `frontend/src/store/panel-store.ts` - Panel state management
- `frontend/src/components/PanelToggleButton.tsx` - Toggle button component
- `packages/shared-types/src/websocket-events.ts` - `WorkflowState` type
