# Location Collection

## Overview

The location collection feature allows the assistant to ask users for their location and remember it across sessions. This enables location-aware provider searches, ensuring users only see providers in their area.

## Problem

Without this feature:
- Users search for providers without specifying location
- Results include providers from all 7 supported regions
- Users may book appointments at locations far from where they live
- Each session, users would need to specify their location again

## Solution

The assistant collects and persists user location through:

1. **Memories table**: A generic storage system for user information, starting with location
2. **System prompt injection**: Claude receives context about the user's location (or instructions to ask for it)
3. **Location validation**: The `search_providers` tool blocks searches until location is set
4. **Fuzzy matching**: Users can say "SF", "NYC", or "Silicon Valley" and the system maps to the correct region

## Supported Locations

| ID | Display Name | Aliases |
|----|--------------|---------|
| `seattle` | Seattle | - |
| `san_francisco` | San Francisco | SF, San Fran |
| `south_bay` | South Bay (Mountain View, Palo Alto, Sunnyvale) | Bay Area, Silicon Valley, Mountain View, Palo Alto, Sunnyvale, MV |
| `princeton` | Princeton, NJ | Princeton NJ |
| `vancouver` | Vancouver | - |
| `toronto` | Toronto | - |
| `new_york` | New York | NYC, New York City, Manhattan |

## User Flow

### First-time User
1. User asks to find a service (e.g., "I need a haircut")
2. System prompt tells Claude that location is not set
3. Claude asks user for their location
4. User responds with location (e.g., "I'm in San Francisco")
5. Claude uses `set_location` tool to save location
6. Claude proceeds to search for providers

### Returning User
1. User asks to find a service
2. System prompt includes their saved location
3. Claude proceeds directly to search (location already known)

### Invalid Location
1. User provides unsupported location (e.g., "I'm in Chicago")
2. `set_location` tool returns error with list of supported locations
3. Claude apologizes and explains which locations are currently supported
4. User selects from supported locations

### Blocked Search
1. User tries to search without location set
2. `search_providers` returns error: "Location not set. Please ask the user for their location..."
3. Claude asks user for location before retrying search

## Implementation

### Database Schema

The `memories` table stores user information with a generic structure:

```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'location' for now, extensible for future types
  value TEXT NOT NULL,          -- JSON: {"location": "san_francisco"}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX memories_user_type_idx ON memories(user_id, type);
```

### Memory Service (`backend/src/services/memory-service.ts`)

```typescript
// Get user's location
const location = await getUserLocation(userId);  // Returns ProviderGeo | null

// Set user's location
await setUserLocation(userId, 'san_francisco');

// Generic memory operations
await getMemory(userId, 'location');
await setMemory(userId, 'location', { location: 'san_francisco' });
await deleteMemory(userId, 'location');
```

### Set Location Tool (`backend/src/tools/set-location.ts`)

**Input:**
```json
{
  "location": "San Francisco"
}
```

**Success Output:**
```json
{
  "success": true,
  "location": "san_francisco",
  "locationDisplay": "San Francisco"
}
```

**Error Output:**
```json
{
  "success": false,
  "error": "\"Chicago\" is not a supported location.",
  "supportedLocations": ["Seattle", "San Francisco", "South Bay...", ...]
}
```

### System Prompt Context (`backend/src/services/ai-conversation-service.ts`)

**When location is set:**
```
User's current location: San Francisco. Use this when searching for providers.
```

**When location is not set:**
```
IMPORTANT: The user has not set their location yet. Before searching for providers,
you must ask them where they are located and use the set_location tool to save it.

Supported locations: Seattle, San Francisco, South Bay (Mountain View, Palo Alto, Sunnyvale),
Princeton, NJ, Vancouver, Toronto, New York.

If they mention a location not on this list, apologize and explain that only these
locations are currently supported.
```

### Search Provider Validation (`backend/src/tools/search-providers.ts`)

Before searching, the tool checks for location:

```typescript
const userLocation = await getUserLocation(context.userId);
if (!userLocation) {
  return {
    error: 'Location not set. Please ask the user for their location and use the set_location tool first.',
    providers: [],
    count: 0,
    supportedLocations: [...],
  };
}
```

## Location Matching

The `matchProviderGeo()` function in `backend/src/constants/supported-locations.ts` handles fuzzy matching:

1. **Direct ID match**: `san_francisco` -> `san_francisco`
2. **Display name match**: `San Francisco` -> `san_francisco`
3. **Alias match**: `SF`, `Bay Area`, `NYC` -> corresponding region

## Related Files

- `backend/src/db/schema.ts` - `memories` table and `ProviderGeo` type
- `backend/src/constants/supported-locations.ts` - Location helpers and display names
- `backend/src/services/memory-service.ts` - Memory CRUD operations
- `backend/src/tools/set-location.ts` - Tool for saving location
- `backend/src/services/ai-conversation-service.ts` - System prompt with location context
- `backend/src/tools/search-providers.ts` - Location validation before search

## Future Enhancements

- Filter providers by user's geo region in `searchProviders()` query
- Allow users to change their location mid-session
- Add more locations as the service expands
- Store additional memories (preferred service types, favorite providers, etc.)
