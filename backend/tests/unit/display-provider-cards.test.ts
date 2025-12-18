import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  displayProviderCardsTool,
  displayProviderCardsInputSchema,
  displayProviderCardsDefinition,
  DisplayProviderCardsInput,
} from '../../src/tools/display-provider-cards';
import { ToolExecutionContext, ToolName, DisplayProvider } from '../../src/types/tool.types';

// Mock the provider service
vi.mock('../../src/services/provider-service', () => ({
  getProviderById: vi.fn(),
}));

// Mock the workflow service
vi.mock('../../src/services/workflow-service', () => ({
  getCurrentWorkflow: vi.fn(),
  updateContext: vi.fn(),
  WorkflowState: {
    PROVIDER_SEARCH: 'PROVIDER_SEARCH',
    PROVIDER_SELECTION: 'PROVIDER_SELECTION',
    COMPLETE: 'COMPLETE',
  },
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
import { getCurrentWorkflow, updateContext } from '../../src/services/workflow-service';
const mockGetProviderById = vi.mocked(getProviderById);
const mockGetCurrentWorkflow = vi.mocked(getCurrentWorkflow);
const mockUpdateContext = vi.mocked(updateContext);

describe('display_provider_cards tool', () => {
  const mockEmitDisplayProviders = vi.fn();

  const mockContext: ToolExecutionContext = {
    sessionId: 'test-session',
    userId: 'test-user',
    emitDisplayProviders: mockEmitDisplayProviders,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('definition', () => {
    it('should have correct name', () => {
      expect(displayProviderCardsDefinition.name).toBe(ToolName.DISPLAY_PROVIDER_CARDS);
    });

    it('should have description mentioning display', () => {
      expect(displayProviderCardsDefinition.description).toContain('Display');
    });

    it('should have providerIds property in input schema', () => {
      expect(displayProviderCardsDefinition.input_schema.properties).toHaveProperty('providerIds');
    });

    it('should require providerIds', () => {
      expect(displayProviderCardsDefinition.input_schema.required).toContain('providerIds');
    });
  });

  describe('inputSchema', () => {
    it('should accept array of provider IDs', () => {
      const result = displayProviderCardsInputSchema.safeParse({
        providerIds: ['id-1', 'id-2'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.providerIds).toEqual(['id-1', 'id-2']);
      }
    });

    it('should reject empty array', () => {
      const result = displayProviderCardsInputSchema.safeParse({
        providerIds: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing providerIds', () => {
      const result = displayProviderCardsInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept single ID array', () => {
      const result = displayProviderCardsInputSchema.safeParse({
        providerIds: ['single-id'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('handler', () => {
    it('should look up each provider by ID', async () => {
      mockGetProviderById.mockResolvedValue(mockProvider);

      const input: DisplayProviderCardsInput = { providerIds: ['id-1', 'id-2'] };
      await displayProviderCardsTool.handler(input, mockContext);

      expect(mockGetProviderById).toHaveBeenCalledTimes(2);
      expect(mockGetProviderById).toHaveBeenCalledWith('id-1');
      expect(mockGetProviderById).toHaveBeenCalledWith('id-2');
    });

    it('should emit display providers with correct format', async () => {
      mockGetProviderById.mockResolvedValue(mockProvider);

      const input: DisplayProviderCardsInput = { providerIds: ['provider-1'] };
      await displayProviderCardsTool.handler(input, mockContext);

      expect(mockEmitDisplayProviders).toHaveBeenCalledTimes(1);
      const emittedProviders: DisplayProvider[] = mockEmitDisplayProviders.mock.calls[0][0];
      expect(emittedProviders).toHaveLength(1);
      expect(emittedProviders[0]).toEqual({
        id: 'provider-1',
        name: 'Test Salon',
        category: 'salon',
        rating: 4.5,
        reviewCount: 100,
        services: ['haircut', 'coloring'],
        address: '123 Main St',
      });
    });

    it('should return success with displayed count', async () => {
      mockGetProviderById.mockResolvedValue(mockProvider);

      const input: DisplayProviderCardsInput = { providerIds: ['id-1', 'id-2'] };
      const result = await displayProviderCardsTool.handler(input, mockContext);

      expect(result.success).toBe(true);
      expect(result.displayed).toBe(2);
    });

    it('should skip providers not found', async () => {
      mockGetProviderById.mockImplementation((id) => {
        if (id === 'existing-id') {
          return Promise.resolve(mockProvider);
        }
        return Promise.resolve(null);
      });

      const input: DisplayProviderCardsInput = {
        providerIds: ['existing-id', 'nonexistent-id'],
      };
      const result = await displayProviderCardsTool.handler(input, mockContext);

      expect(result.displayed).toBe(1);
      expect(result.notFound).toEqual(['nonexistent-id']);
    });

    it('should handle all providers not found', async () => {
      mockGetProviderById.mockResolvedValue(null);

      const input: DisplayProviderCardsInput = { providerIds: ['bad-id-1', 'bad-id-2'] };
      const result = await displayProviderCardsTool.handler(input, mockContext);

      expect(result.success).toBe(true);
      expect(result.displayed).toBe(0);
      expect(result.notFound).toEqual(['bad-id-1', 'bad-id-2']);
    });

    it('should work without emitDisplayProviders callback', async () => {
      mockGetProviderById.mockResolvedValue(mockProvider);

      const contextWithoutCallback: ToolExecutionContext = {
        sessionId: 'test-session',
        userId: 'test-user',
      };

      const input: DisplayProviderCardsInput = { providerIds: ['id-1'] };
      const result = await displayProviderCardsTool.handler(input, contextWithoutCallback);

      // Should not throw, just won't emit
      expect(result.success).toBe(true);
      expect(result.displayed).toBe(1);
    });

    it('should handle null reviewCount', async () => {
      const providerWithNullReview = { ...mockProvider, reviewCount: null };
      mockGetProviderById.mockResolvedValue(providerWithNullReview);

      const input: DisplayProviderCardsInput = { providerIds: ['id-1'] };
      await displayProviderCardsTool.handler(input, mockContext);

      const emittedProviders: DisplayProvider[] = mockEmitDisplayProviders.mock.calls[0][0];
      expect(emittedProviders[0].reviewCount).toBeNull();
    });
  });

  describe('registered tool structure', () => {
    it('should have definition property', () => {
      expect(displayProviderCardsTool.definition).toBeDefined();
    });

    it('should have handler property', () => {
      expect(displayProviderCardsTool.handler).toBeInstanceOf(Function);
    });

    it('should have inputSchema property', () => {
      expect(displayProviderCardsTool.inputSchema).toBeDefined();
    });
  });

  /**
   * Session restore tests for selectedProviders persistence.
   *
   * CRITICAL: These tests ensure the provider panel can be restored after page refresh.
   *
   * When a user searches for providers and sees results, then refreshes the page,
   * the session restore logic in chat-handler.ts reads workflow.context.selectedProviders
   * to redisplay the provider panel. If selectedProviders is not saved when providers
   * are displayed, the restore functionality breaks and users lose their search results.
   *
   * See: documentation/features/provider-panel-persistence.md
   */
  describe('selectedProviders persistence for session restore', () => {
    const mockWorkflow = {
      id: 'workflow-123',
      sessionId: 'test-session',
      currentState: 'PROVIDER_SEARCH',
      context: {},
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    beforeEach(() => {
      mockGetCurrentWorkflow.mockResolvedValue(mockWorkflow);
      mockUpdateContext.mockResolvedValue(mockWorkflow);
    });

    it('should save displayed provider IDs to workflow context', async () => {
      mockGetProviderById.mockResolvedValue(mockProvider);

      const input: DisplayProviderCardsInput = { providerIds: ['provider-1', 'provider-2'] };
      await displayProviderCardsTool.handler(input, mockContext);

      // Verify updateContext was called with the displayed provider IDs
      expect(mockUpdateContext).toHaveBeenCalledWith('workflow-123', {
        selectedProviders: ['provider-1', 'provider-1'], // Both resolve to mockProvider.id
      });
    });

    it('should only save IDs of providers that were found', async () => {
      mockGetProviderById.mockImplementation((id) => {
        if (id === 'found-id') {
          return Promise.resolve(mockProvider);
        }
        return Promise.resolve(null);
      });

      const input: DisplayProviderCardsInput = {
        providerIds: ['found-id', 'not-found-id'],
      };
      await displayProviderCardsTool.handler(input, mockContext);

      // Only the found provider's ID should be saved
      expect(mockUpdateContext).toHaveBeenCalledWith('workflow-123', {
        selectedProviders: ['provider-1'], // mockProvider.id
      });
    });

    it('should not call updateContext when no providers are found', async () => {
      mockGetProviderById.mockResolvedValue(null);

      const input: DisplayProviderCardsInput = { providerIds: ['bad-id'] };
      await displayProviderCardsTool.handler(input, mockContext);

      expect(mockUpdateContext).not.toHaveBeenCalled();
    });

    it('should not call updateContext when no workflow exists', async () => {
      mockGetCurrentWorkflow.mockResolvedValue(null);
      mockGetProviderById.mockResolvedValue(mockProvider);

      const input: DisplayProviderCardsInput = { providerIds: ['provider-1'] };
      await displayProviderCardsTool.handler(input, mockContext);

      expect(mockUpdateContext).not.toHaveBeenCalled();
    });
  });
});
