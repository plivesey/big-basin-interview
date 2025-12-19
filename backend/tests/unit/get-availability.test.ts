import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAvailabilityTool,
  getAvailabilityInputSchema,
  getAvailabilityDefinition,
  GetAvailabilityInput,
} from '../../src/tools/get-availability';
import { ToolExecutionContext, ToolName } from '../../src/types/tool.types';
import { ProviderNotFoundError } from '../../src/middleware/error-handler';

// Mock the availability service
vi.mock('../../src/services/availability-service', () => ({
  getAvailableSlots: vi.fn(),
}));

// Mock the date-utils
vi.mock('../../src/utils/date-utils', () => ({
  getLocalDateString: vi.fn().mockReturnValue('2025-06-16'),
}));

// Mock logger to avoid console output during tests
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking
import { getAvailableSlots } from '../../src/services/availability-service';
import { getLocalDateString } from '../../src/utils/date-utils';

const mockGetAvailableSlots = vi.mocked(getAvailableSlots);
const mockGetLocalDateString = vi.mocked(getLocalDateString);

describe('get_availability tool', () => {
  const mockContext: ToolExecutionContext = {
    sessionId: 'test-session',
    userId: 'test-user',
  };

  const mockAvailabilityResult = {
    providerId: 'provider-1',
    providerName: 'Test Salon',
    date: '2025-06-16',
    slots: [
      { start: '2025-06-16T09:00:00', end: '2025-06-16T09:30:00', available: true },
      { start: '2025-06-16T09:30:00', end: '2025-06-16T10:00:00', available: false },
      { start: '2025-06-16T10:00:00', end: '2025-06-16T10:30:00', available: true },
      { start: '2025-06-16T10:30:00', end: '2025-06-16T11:00:00', available: true },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLocalDateString.mockReturnValue('2025-06-16');
  });

  describe('definition', () => {
    it('should have correct name', () => {
      expect(getAvailabilityDefinition.name).toBe(ToolName.GET_AVAILABLE_SLOTS);
    });

    it('should have description mentioning availability', () => {
      expect(getAvailabilityDefinition.description).toContain('availability');
    });

    it('should require only providerId', () => {
      expect(getAvailabilityDefinition.input_schema.required).toEqual(['providerId']);
    });
  });

  describe('inputSchema', () => {
    it('should accept providerId only (date is optional)', () => {
      const result = getAvailabilityInputSchema.safeParse({
        providerId: 'provider-1',
      });
      expect(result.success).toBe(true);
    });

    it('should accept providerId and date', () => {
      const result = getAvailabilityInputSchema.safeParse({
        providerId: 'provider-1',
        date: '2025-06-16',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = getAvailabilityInputSchema.safeParse({
        providerId: 'provider-1',
        date: '06-16-2025', // Wrong format
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handler', () => {
    it('should default date to today when not provided', async () => {
      mockGetAvailableSlots.mockResolvedValue(mockAvailabilityResult);

      const input: GetAvailabilityInput = { providerId: 'provider-1' };
      await getAvailabilityTool.handler(input, mockContext);

      expect(mockGetAvailableSlots).toHaveBeenCalledWith(
        'provider-1',
        '2025-06-16', // Today's date from mock
        30 // Fixed slot duration
      );
    });

    it('should always use 30 minute slots', async () => {
      mockGetAvailableSlots.mockResolvedValue(mockAvailabilityResult);

      const input: GetAvailabilityInput = {
        providerId: 'provider-1',
        date: '2025-06-17',
      };
      await getAvailabilityTool.handler(input, mockContext);

      expect(mockGetAvailableSlots).toHaveBeenCalledWith('provider-1', '2025-06-17', 30);
    });

    it('should return only available slots (filters unavailable)', async () => {
      mockGetAvailableSlots.mockResolvedValue(mockAvailabilityResult);

      const result = await getAvailabilityTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      // mockAvailabilityResult has 4 slots, 3 available
      expect(result.availableSlots).toHaveLength(3);
      expect(result.availableSlots.every((slot) => slot.available === true)).toBe(true);
    });

    it('should return correct totalSlots count (including unavailable)', async () => {
      mockGetAvailableSlots.mockResolvedValue(mockAvailabilityResult);

      const result = await getAvailabilityTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      // Total slots should be 4 (all slots, not just available)
      expect(result.totalSlots).toBe(4);
    });

    it('should return success: true on successful query', async () => {
      mockGetAvailableSlots.mockResolvedValue(mockAvailabilityResult);

      const result = await getAvailabilityTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle ProviderNotFoundError with helpful message', async () => {
      mockGetAvailableSlots.mockRejectedValue(new ProviderNotFoundError('invalid-id'));

      const result = await getAvailabilityTool.handler(
        { providerId: 'invalid-id' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Provider ID 'invalid-id' does not exist");
      expect(result.error).toContain('search_providers');
    });

    it('should return success: false on error', async () => {
      mockGetAvailableSlots.mockRejectedValue(new Error('Database error'));

      const result = await getAvailabilityTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve availability.');
    });

    it('should return empty slots array on error', async () => {
      mockGetAvailableSlots.mockRejectedValue(new Error('Some error'));

      const result = await getAvailabilityTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      expect(result.availableSlots).toEqual([]);
      expect(result.totalSlots).toBe(0);
    });
  });

  describe('registered tool structure', () => {
    it('should have definition property', () => {
      expect(getAvailabilityTool.definition).toBeDefined();
    });

    it('should have handler property', () => {
      expect(getAvailabilityTool.handler).toBeInstanceOf(Function);
    });

    it('should have inputSchema property', () => {
      expect(getAvailabilityTool.inputSchema).toBeDefined();
    });
  });
});
