/**
 * Memory service - manages user memories (location, preferences, etc.)
 */

import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { db, memories, NewMemory, Memory, ProviderGeo } from '../db';

// Memory types
export type MemoryType = 'location';

// Memory value types - using Record<string, unknown> for database compatibility
export type MemoryValue = Record<string, unknown>;

/**
 * Get a memory by user ID and type
 */
export async function getMemory(userId: string, type: MemoryType): Promise<Memory | null> {
  if (!userId || !userId.trim()) {
    return null;
  }

  const result = await db
    .select()
    .from(memories)
    .where(and(eq(memories.userId, userId), eq(memories.type, type)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

/**
 * Set a memory (upsert - creates if doesn't exist, updates if exists)
 */
export async function setMemory(
  userId: string,
  type: MemoryType,
  value: MemoryValue
): Promise<Memory> {
  if (!userId || !userId.trim()) {
    throw new Error('User ID is required');
  }

  const now = new Date();
  const existingMemory = await getMemory(userId, type);

  if (existingMemory) {
    // Update existing memory
    await db
      .update(memories)
      .set({
        value,
        updatedAt: now,
      })
      .where(eq(memories.id, existingMemory.id));

    return {
      ...existingMemory,
      value,
      updatedAt: now,
    };
  }

  // Create new memory
  const newMemory: NewMemory = {
    id: uuidv4(),
    userId,
    type,
    value,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(memories).values(newMemory);

  return {
    id: newMemory.id,
    userId,
    type,
    value,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Delete a memory
 */
export async function deleteMemory(userId: string, type: MemoryType): Promise<boolean> {
  if (!userId || !userId.trim()) {
    return false;
  }

  const result = await db
    .delete(memories)
    .where(and(eq(memories.userId, userId), eq(memories.type, type)));

  return result.changes > 0;
}

/**
 * Get user's location (convenience helper)
 */
export async function getUserLocation(userId: string): Promise<ProviderGeo | null> {
  const memory = await getMemory(userId, 'location');
  if (!memory) {
    return null;
  }

  const location = memory.value.location as ProviderGeo | undefined;
  return location ?? null;
}

/**
 * Set user's location (convenience helper)
 */
export async function setUserLocation(userId: string, location: ProviderGeo): Promise<Memory> {
  return setMemory(userId, 'location', { location });
}
