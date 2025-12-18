import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  selectProviderTool,
  selectProviderInputSchema,
  selectProviderDefinition,
  SelectProviderInput,
} from '../../src/tools/select-provider';
import { ToolExecutionContext, ToolName } from '../../src/types/tool.types';

// Mock the provider service
vi.mock('../../src/services/provider-service', () => ({
  getProviderById: vi.fn(),
}));

// Mock the workflow service
vi.mock('../../src/services/workflow-service', () => ({
  getCurrentWorkflow: vi.fn(),
  transitionState: vi.fn(),
  WorkflowState: {
    TIME_SELECTION: 'TIME_SELECTION',
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
import {
  getCurrentWorkflow,
  transitionState,
} from '../../src/services/workflow-service';

const mockGetProviderById = vi.mocked(getProviderById);
const mockGetCurrentWorkflow = vi.mocked(getCurrentWorkflow);
const mockTransitionState = vi.mocked(transitionState);

describe('select_provider tool', () => {
  const mockContext: ToolExecutionContext = {
    sessionId: 'test-session',
    userId: 'test-user',
    emitOpenProviderDetail: vi.fn(),
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
    context: {
      selectedProviders: ['provider-1', 'provider-2'],
    },
    createdAt: new Date(),
    lastUpdated: new Date(),
    completedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('definition', () => {
    it('should have correct name', () => {
      expect(selectProviderDefinition.name).toBe(ToolName.SELECT_PROVIDER);
    });

    it('should have description mentioning booking', () => {
      expect(selectProviderDefinition.description).toContain('booking');
    });

    it('should require providerId', () => {
      expect(selectProviderDefinition.input_schema.required).toEqual(['providerId']);
    });
  });

  describe('inputSchema', () => {
    it('should accept valid providerId', () => {
      const result = selectProviderInputSchema.safeParse({
        providerId: 'provider-1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing providerId', () => {
      const result = selectProviderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('workflow validation', () => {
    it('should fail if no active workflow exists', async () => {
      mockGetCurrentWorkflow.mockResolvedValue(null);

      const result = await selectProviderTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active booking workflow');
    });

    it('should return helpful error message when no workflow', async () => {
      mockGetCurrentWorkflow.mockResolvedValue(null);

      const result = await selectProviderTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      expect(result.error).toContain('search for providers first');
    });
  });

  describe('provider validation', () => {
    it('should fail if provider not found in database', async () => {
      mockGetCurrentWorkflow.mockResolvedValue(mockWorkflow as never);
      mockGetProviderById.mockResolvedValue(null);

      const result = await selectProviderTool.handler(
        { providerId: 'invalid-provider' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Provider ID 'invalid-provider' does not exist");
    });

    it('should return list of valid provider IDs from recent search', async () => {
      mockGetCurrentWorkflow.mockResolvedValue(mockWorkflow as never);
      // First call for the invalid provider, subsequent calls for the valid ones
      mockGetProviderById.mockImplementation(async (id: string) => {
        if (id === 'provider-1') {
          return { ...mockProvider, id: 'provider-1', name: 'Provider One' };
        }
        if (id === 'provider-2') {
          return { ...mockProvider, id: 'provider-2', name: 'Provider Two' };
        }
        return null;
      });

      const result = await selectProviderTool.handler(
        { providerId: 'invalid-provider' },
        mockContext
      );

      expect(result.error).toContain('provider-1 (Provider One)');
      expect(result.error).toContain('provider-2 (Provider Two)');
    });
  });

  describe('success cases', () => {
    beforeEach(() => {
      mockGetCurrentWorkflow.mockResolvedValue(mockWorkflow as never);
      mockGetProviderById.mockResolvedValue(mockProvider);
      mockTransitionState.mockResolvedValue(undefined);
    });

    it('should transition workflow to TIME_SELECTION state', async () => {
      await selectProviderTool.handler({ providerId: 'provider-1' }, mockContext);

      expect(mockTransitionState).toHaveBeenCalledWith(
        'workflow-1',
        'TIME_SELECTION',
        { selectedProviderId: 'provider-1' }
      );
    });

    it('should emit open_provider_detail event via context', async () => {
      await selectProviderTool.handler({ providerId: 'provider-1' }, mockContext);

      expect(mockContext.emitOpenProviderDetail).toHaveBeenCalledWith(
        'provider-1',
        'Test Salon',
        'workflow-1'
      );
    });

    it('should return success with provider details', async () => {
      const result = await selectProviderTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.providerId).toBe('provider-1');
      expect(result.providerName).toBe('Test Salon');
      expect(result.error).toBeUndefined();
    });

    it('should not include workflowId in output', async () => {
      const result = await selectProviderTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      // Verify workflowId is not in the result
      expect('workflowId' in result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle transition state failure', async () => {
      mockGetCurrentWorkflow.mockResolvedValue(mockWorkflow as never);
      mockGetProviderById.mockResolvedValue(mockProvider);
      mockTransitionState.mockRejectedValue(new Error('Transition failed'));

      const result = await selectProviderTool.handler(
        { providerId: 'provider-1' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update booking workflow');
    });
  });

  describe('registered tool structure', () => {
    it('should have definition property', () => {
      expect(selectProviderTool.definition).toBeDefined();
    });

    it('should have handler property', () => {
      expect(selectProviderTool.handler).toBeInstanceOf(Function);
    });

    it('should have inputSchema property', () => {
      expect(selectProviderTool.inputSchema).toBeDefined();
    });
  });
});
