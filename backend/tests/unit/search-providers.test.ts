import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchProvidersTool,
  searchProvidersInputSchema,
  searchProvidersDefinition,
  SearchProvidersInput,
} from '../../src/tools/search-providers';
import { ToolExecutionContext, ToolName } from '../../src/types/tool.types';

// Mock the provider service
vi.mock('../../src/services/provider-service', () => ({
  searchProviders: vi.fn(),
}));

// Mock the workflow service
vi.mock('../../src/services/workflow-service', () => ({
  createWorkflow: vi.fn(),
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
import { searchProviders } from '../../src/services/provider-service';
import { createWorkflow } from '../../src/services/workflow-service';
const mockSearchProviders = vi.mocked(searchProviders);
const mockCreateWorkflow = vi.mocked(createWorkflow);

describe('search_providers tool', () => {
  const mockContext: ToolExecutionContext = {
    sessionId: 'test-session',
    userId: 'test-user',
  };

  const mockProvider = {
    id: 'provider-1',
    name: 'Test Salon',
    category: 'salon',
    description: 'A great salon',
    address: '123 Main St',
    latitude: 40.7128,
    longitude: -74.006,
    rating: 4.5,
    reviewCount: 100,
    workingHours: {},
    services: ['haircut', 'coloring'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkflow = {
    id: 'workflow-1',
    sessionId: 'test-session',
    currentState: 'PROVIDER_SEARCH',
    status: 'active',
    context: {},
    createdAt: new Date(),
    lastUpdated: new Date(),
    completedAt: null,
    expiresAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock for createWorkflow
    mockCreateWorkflow.mockResolvedValue(mockWorkflow as never);
  });

  describe('definition', () => {
    it('should have correct name', () => {
      expect(searchProvidersDefinition.name).toBe(ToolName.SEARCH_PROVIDERS);
    });

    it('should have description mentioning search capabilities', () => {
      expect(searchProvidersDefinition.description).toContain('Search');
      expect(searchProvidersDefinition.description).toContain('providers');
    });

    it('should have query property in input schema', () => {
      expect(searchProvidersDefinition.input_schema.properties).toHaveProperty('query');
    });

    it('should not require any properties', () => {
      expect(searchProvidersDefinition.input_schema.required).toEqual([]);
    });
  });

  describe('inputSchema', () => {
    it('should accept empty object', () => {
      const result = searchProvidersInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept query string', () => {
      const result = searchProvidersInputSchema.safeParse({ query: 'salon' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('salon');
      }
    });

    it('should accept undefined query', () => {
      const result = searchProvidersInputSchema.safeParse({ query: undefined });
      expect(result.success).toBe(true);
    });
  });

  describe('handler', () => {
    it('should call searchProviders with query', async () => {
      mockSearchProviders.mockResolvedValue([mockProvider]);

      const input: SearchProvidersInput = { query: 'salon' };
      await searchProvidersTool.handler(input, mockContext);

      expect(mockSearchProviders).toHaveBeenCalledWith('salon');
    });

    it('should call searchProviders with undefined when no query provided', async () => {
      mockSearchProviders.mockResolvedValue([]);

      const input: SearchProvidersInput = {};
      await searchProvidersTool.handler(input, mockContext);

      expect(mockSearchProviders).toHaveBeenCalledWith(undefined);
    });

    it('should return providers in correct format', async () => {
      mockSearchProviders.mockResolvedValue([mockProvider]);

      const result = await searchProvidersTool.handler({ query: 'salon' }, mockContext);

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0]).toEqual({
        id: 'provider-1',
        name: 'Test Salon',
        category: 'salon',
        rating: 4.5,
        reviewCount: 100,
        services: ['haircut', 'coloring'],
        address: '123 Main St',
      });
    });

    it('should return count of providers', async () => {
      mockSearchProviders.mockResolvedValue([mockProvider, { ...mockProvider, id: 'provider-2' }]);

      const result = await searchProvidersTool.handler({ query: 'test' }, mockContext);

      expect(result.count).toBe(2);
    });

    it('should handle empty results', async () => {
      mockSearchProviders.mockResolvedValue([]);

      const result = await searchProvidersTool.handler({ query: 'nonexistent' }, mockContext);

      expect(result.providers).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should handle null reviewCount', async () => {
      const providerWithNullReview = { ...mockProvider, reviewCount: null };
      mockSearchProviders.mockResolvedValue([providerWithNullReview]);

      const result = await searchProvidersTool.handler({ query: 'test' }, mockContext);

      expect(result.providers[0].reviewCount).toBeNull();
    });

    it('should transform services array correctly', async () => {
      const providerWithServices = {
        ...mockProvider,
        services: ['haircut', 'styling', 'coloring'],
      };
      mockSearchProviders.mockResolvedValue([providerWithServices]);

      const result = await searchProvidersTool.handler({ query: 'test' }, mockContext);

      expect(result.providers[0].services).toEqual(['haircut', 'styling', 'coloring']);
    });
  });

  describe('registered tool structure', () => {
    it('should have definition property', () => {
      expect(searchProvidersTool.definition).toBeDefined();
    });

    it('should have handler property', () => {
      expect(searchProvidersTool.handler).toBeInstanceOf(Function);
    });

    it('should have inputSchema property', () => {
      expect(searchProvidersTool.inputSchema).toBeDefined();
    });
  });
});
