import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setLocationTool,
  setLocationInputSchema,
  setLocationDefinition,
  SetLocationInput,
} from '../../src/tools/set-location';
import { ToolExecutionContext, ToolName } from '../../src/types/tool.types';

// Mock the memory service
vi.mock('../../src/services/memory-service', () => ({
  setLocationMemory: vi.fn(),
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
import { setLocationMemory } from '../../src/services/memory-service';
const mockSetLocationMemory = vi.mocked(setLocationMemory);

describe('set_location tool', () => {
  const mockContext: ToolExecutionContext = {
    sessionId: 'test-session',
    userId: 'test-user',
  };

  const mockMemory = {
    id: 'memory-1',
    userId: 'test-user',
    type: 'location' as const,
    value: { location: 'seattle' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetLocationMemory.mockResolvedValue(mockMemory);
  });

  describe('definition', () => {
    it('should have correct name', () => {
      expect(setLocationDefinition.name).toBe(ToolName.SET_LOCATION);
    });

    it('should have description about saving location', () => {
      expect(setLocationDefinition.description).toContain('location');
    });

    it('should require location property', () => {
      expect(setLocationDefinition.input_schema.required).toContain('location');
    });
  });

  describe('inputSchema', () => {
    it('should accept location string', () => {
      const result = setLocationInputSchema.safeParse({ location: 'Seattle' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.location).toBe('Seattle');
      }
    });

    it('should reject missing location', () => {
      const result = setLocationInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-string location', () => {
      const result = setLocationInputSchema.safeParse({ location: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('handler', () => {
    describe('valid locations', () => {
      it('should save valid location and return success', async () => {
        const input: SetLocationInput = { location: 'Seattle' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(true);
        expect(result.location).toBe('seattle');
        expect(result.locationDisplay).toBe('Seattle');
        expect(mockSetLocationMemory).toHaveBeenCalledWith('test-user', 'seattle');
      });

      it('should handle SF alias', async () => {
        const input: SetLocationInput = { location: 'SF' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(true);
        expect(result.location).toBe('san_francisco');
        expect(result.locationDisplay).toBe('San Francisco');
      });

      it('should handle NYC alias', async () => {
        const input: SetLocationInput = { location: 'NYC' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(true);
        expect(result.location).toBe('new_york');
        expect(result.locationDisplay).toBe('New York');
      });

      it('should handle Silicon Valley alias', async () => {
        const input: SetLocationInput = { location: 'Silicon Valley' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(true);
        expect(result.location).toBe('south_bay');
        expect(result.locationDisplay).toBe('South Bay (Mountain View, Palo Alto, Sunnyvale)');
      });

      it('should be case insensitive', async () => {
        const input: SetLocationInput = { location: 'TORONTO' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(true);
        expect(result.location).toBe('toronto');
      });
    });

    describe('invalid locations', () => {
      it('should return error for unsupported location', async () => {
        const input: SetLocationInput = { location: 'Chicago' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Chicago');
        expect(result.error).toContain('is not a supported location');
        expect(result.error).toContain('Supported locations:');
        expect(result.supportedLocations).toBeDefined();
        expect(result.supportedLocations).toContain('Seattle');
        expect(mockSetLocationMemory).not.toHaveBeenCalled();
      });

      it('should include all supported locations in error', async () => {
        const input: SetLocationInput = { location: 'Los Angeles' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(false);
        expect(result.supportedLocations).toHaveLength(7);
        expect(result.error).toContain('Seattle');
        expect(result.error).toContain('San Francisco');
        expect(result.error).toContain('New York');
      });

      it('should handle empty string', async () => {
        const input: SetLocationInput = { location: '' };
        const result = await setLocationTool.handler(input, mockContext);

        expect(result.success).toBe(false);
        expect(result.error).toContain('is not a supported location');
      });
    });
  });

  describe('registered tool structure', () => {
    it('should have definition property', () => {
      expect(setLocationTool.definition).toBeDefined();
    });

    it('should have handler property', () => {
      expect(setLocationTool.handler).toBeInstanceOf(Function);
    });

    it('should have inputSchema property', () => {
      expect(setLocationTool.inputSchema).toBeDefined();
    });
  });
});
