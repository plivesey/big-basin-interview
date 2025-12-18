import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAvailableSlots } from '../../src/services/availability-service';
import { ProviderNotFoundError } from '../../src/middleware/error-handler';

// Mock the provider service
vi.mock('../../src/services/provider-service', () => ({
  getProviderById: vi.fn(),
}));

// Mock the mock-availability module
vi.mock('../../src/utils/mock-availability', () => ({
  getBusyLevel: vi.fn().mockReturnValue(0), // Default to fully available
  applyMockPattern: vi.fn((slots) => slots), // Pass through unchanged by default
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
import { getProviderById } from '../../src/services/provider-service';
import { getBusyLevel, applyMockPattern } from '../../src/utils/mock-availability';

const mockGetProviderById = vi.mocked(getProviderById);
const mockGetBusyLevel = vi.mocked(getBusyLevel);
const mockApplyMockPattern = vi.mocked(applyMockPattern);

describe('Availability Service', () => {
  // Test provider with standard working hours (9am-5pm Monday-Friday)
  const testProvider = {
    id: 'test-provider-uuid',
    name: 'Test Salon',
    category: 'salon',
    description: 'A test salon',
    address: '123 Test St',
    latitude: 40.7128,
    longitude: -74.006,
    rating: 4.5,
    reviewCount: 100,
    workingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      // Saturday and Sunday closed
    },
    services: ['haircut', 'coloring'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockGetBusyLevel.mockReturnValue(0);
    mockApplyMockPattern.mockImplementation((slots) => slots);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAvailableSlots', () => {
    it('should throw ProviderNotFoundError for invalid provider ID', async () => {
      mockGetProviderById.mockResolvedValue(null);

      await expect(getAvailableSlots('invalid-id', '2025-06-16', 30)).rejects.toThrow(
        ProviderNotFoundError
      );
    });

    it('should return correct provider info in result', async () => {
      mockGetProviderById.mockResolvedValue(testProvider);

      const result = await getAvailableSlots('test-provider-uuid', '2025-06-16', 30); // Monday

      expect(result.providerId).toBe('test-provider-uuid');
      expect(result.providerName).toBe('Test Salon');
      expect(result.date).toBe('2025-06-16');
    });
  });

  describe('generateTimeSlots (via getAvailableSlots)', () => {
    it('should generate slots from open to close time', async () => {
      mockGetProviderById.mockResolvedValue(testProvider);

      // 2025-06-16 is a Monday (open 9am-5pm)
      const result = await getAvailableSlots('test-provider-uuid', '2025-06-16', 30);

      // 9am-5pm with 30 min slots = 16 slots
      expect(result.slots.length).toBe(16);

      // First slot should start at 9:00
      expect(result.slots[0].start).toBe('2025-06-16T09:00:00');
      expect(result.slots[0].end).toBe('2025-06-16T09:30:00');

      // Last slot should end at 5:00pm
      const lastSlot = result.slots[result.slots.length - 1];
      expect(lastSlot.start).toBe('2025-06-16T16:30:00');
      expect(lastSlot.end).toBe('2025-06-16T17:00:00');
    });

    it('should handle closed days (returns empty slots)', async () => {
      mockGetProviderById.mockResolvedValue(testProvider);

      // 2025-06-14 is a Saturday (closed)
      const result = await getAvailableSlots('test-provider-uuid', '2025-06-14', 30);

      expect(result.slots).toEqual([]);
    });

    it('should support 15-minute duration slots', async () => {
      mockGetProviderById.mockResolvedValue(testProvider);

      const result = await getAvailableSlots('test-provider-uuid', '2025-06-16', 15); // Monday

      // 9am-5pm with 15 min slots = 32 slots
      expect(result.slots.length).toBe(32);
      expect(result.slots[0].end).toBe('2025-06-16T09:15:00');
    });

    it('should support 60-minute duration slots', async () => {
      mockGetProviderById.mockResolvedValue(testProvider);

      const result = await getAvailableSlots('test-provider-uuid', '2025-06-16', 60); // Monday

      // 9am-5pm with 60 min slots = 8 slots
      expect(result.slots.length).toBe(8);
      expect(result.slots[0].end).toBe('2025-06-16T10:00:00');
    });

    it('should not generate slots that exceed closing time', async () => {
      // Provider with odd closing time
      const oddHoursProvider = {
        ...testProvider,
        workingHours: {
          monday: { open: '09:00', close: '17:15' }, // 15 mins after hour
        },
      };
      mockGetProviderById.mockResolvedValue(oddHoursProvider);

      // With 30-min slots, we can fit 16 slots (9am-5pm), but not 9am-5:15pm
      const result = await getAvailableSlots('test-provider-uuid', '2025-06-16', 30);

      // Last slot should end at 5pm, not 5:15pm (can't fit another 30-min slot)
      expect(result.slots.length).toBe(16);
      const lastSlot = result.slots[result.slots.length - 1];
      expect(lastSlot.end).toBe('2025-06-16T17:00:00');
    });
  });

  describe('filterPastSlots (via getAvailableSlots)', () => {
    it('should filter out past slots when date is today', async () => {
      // Set "today" to a specific date and time (10:30am on a Monday)
      const mockNow = new Date('2025-06-16T10:30:00');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      mockGetProviderById.mockResolvedValue(testProvider);

      const result = await getAvailableSlots('test-provider-uuid', '2025-06-16', 30);

      // Slots before 10:30am should be filtered out
      // First available slot should be 11:00 (10:30 slot starts at/before current time)
      expect(result.slots.length).toBe(12); // 11:00 to 5:00pm = 12 slots
      expect(result.slots[0].start).toBe('2025-06-16T11:00:00');
    });

    it('should not filter slots for future dates', async () => {
      // Set "today" to a specific date and time (10:30am on a Monday)
      const mockNow = new Date('2025-06-16T10:30:00');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      mockGetProviderById.mockResolvedValue(testProvider);

      // Request for tomorrow (Tuesday)
      const result = await getAvailableSlots('test-provider-uuid', '2025-06-17', 30);

      // All slots should be available since it's a future date
      expect(result.slots.length).toBe(16); // Full day 9am-5pm
      expect(result.slots[0].start).toBe('2025-06-17T09:00:00');
    });

    it('should include slots at or after current time', async () => {
      // Set time to exactly 11:00
      const mockNow = new Date('2025-06-16T11:00:00');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      mockGetProviderById.mockResolvedValue(testProvider);

      const result = await getAvailableSlots('test-provider-uuid', '2025-06-16', 30);

      // 11:00 slot starts at current time, so it's filtered (not > current time)
      // First slot should be 11:30
      expect(result.slots[0].start).toBe('2025-06-16T11:30:00');
    });
  });

  describe('applyMockAvailability (via getAvailableSlots)', () => {
    it('should call getBusyLevel with provider ID and date', async () => {
      mockGetProviderById.mockResolvedValue(testProvider);

      await getAvailableSlots('test-provider-uuid', '2025-06-16', 30);

      expect(mockGetBusyLevel).toHaveBeenCalledWith('test-provider-uuid', '2025-06-16');
    });

    it('should call applyMockPattern with slots, busy level, provider ID, and date', async () => {
      mockGetProviderById.mockResolvedValue(testProvider);
      mockGetBusyLevel.mockReturnValue(2);

      await getAvailableSlots('test-provider-uuid', '2025-06-16', 30);

      expect(mockApplyMockPattern).toHaveBeenCalledWith(
        expect.any(Array),
        2,
        'test-provider-uuid',
        '2025-06-16'
      );
    });
  });
});
