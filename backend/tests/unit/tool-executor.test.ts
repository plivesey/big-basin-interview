import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTools, ToolExecutionCallbacks } from '../../src/services/tool-executor';
import { ToolUseContent } from '../../src/db/schema';
import { ToolExecutionContext, ToolResult } from '../../src/types/tool.types';

// Mock the tool registry
vi.mock('../../src/tools', () => ({
  toolRegistry: {
    execute: vi.fn(),
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
import { toolRegistry } from '../../src/tools';
const mockExecute = vi.mocked(toolRegistry.execute);

describe('Tool Executor', () => {
  const mockContext: ToolExecutionContext = {
    sessionId: 'test-session',
    userId: 'test-user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeTools', () => {
    it('should execute a single tool', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-use-1',
          name: 'search_providers',
          input: { query: 'salon' },
        },
      ];

      const mockResult: ToolResult = {
        success: true,
        data: { providers: [], count: 0 },
      };
      mockExecute.mockResolvedValue(mockResult);

      const { toolResults } = await executeTools(toolUseBlocks, mockContext);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(mockExecute).toHaveBeenCalledWith('search_providers', { query: 'salon' }, mockContext);
      expect(toolResults).toHaveLength(1);
    });

    it('should execute multiple tools in sequence', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-use-1',
          name: 'tool_a',
          input: { a: 1 },
        },
        {
          type: 'tool_use',
          id: 'tool-use-2',
          name: 'tool_b',
          input: { b: 2 },
        },
      ];

      mockExecute.mockResolvedValue({ success: true, data: {} });

      const { toolResults } = await executeTools(toolUseBlocks, mockContext);

      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(toolResults).toHaveLength(2);
    });

    it('should return tool_result with correct tool_use_id', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'unique-tool-id-123',
          name: 'test_tool',
          input: {},
        },
      ];

      mockExecute.mockResolvedValue({ success: true, data: { result: 'ok' } });

      const { toolResults } = await executeTools(toolUseBlocks, mockContext);

      expect(toolResults[0].tool_use_id).toBe('unique-tool-id-123');
      expect(toolResults[0].type).toBe('tool_result');
    });

    it('should serialize result as JSON in content', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'test_tool',
          input: {},
        },
      ];

      const mockResult: ToolResult = {
        success: true,
        data: { providers: [{ id: '1', name: 'Test' }] },
      };
      mockExecute.mockResolvedValue(mockResult);

      const { toolResults } = await executeTools(toolUseBlocks, mockContext);

      const parsedContent = JSON.parse(toolResults[0].content);
      expect(parsedContent.success).toBe(true);
      expect(parsedContent.data.providers).toHaveLength(1);
    });

    it('should call onToolStart callback before execution', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'search_providers',
          input: {},
        },
      ];

      mockExecute.mockResolvedValue({ success: true });

      const callbacks: ToolExecutionCallbacks = {
        onToolStart: vi.fn(),
        onToolComplete: vi.fn(),
      };

      await executeTools(toolUseBlocks, mockContext, callbacks);

      expect(callbacks.onToolStart).toHaveBeenCalledWith('search_providers', 'tool-1');
      expect(callbacks.onToolStart).toHaveBeenCalledBefore(callbacks.onToolComplete as ReturnType<typeof vi.fn>);
    });

    it('should call onToolComplete callback after execution', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'search_providers',
          input: {},
        },
      ];

      const mockResult: ToolResult = { success: true, data: { count: 5 } };
      mockExecute.mockResolvedValue(mockResult);

      const callbacks: ToolExecutionCallbacks = {
        onToolStart: vi.fn(),
        onToolComplete: vi.fn(),
      };

      await executeTools(toolUseBlocks, mockContext, callbacks);

      expect(callbacks.onToolComplete).toHaveBeenCalledWith('search_providers', 'tool-1', mockResult);
    });

    it('should handle tool execution failure', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'failing_tool',
          input: {},
        },
      ];

      const mockResult: ToolResult = { success: false, error: 'Tool failed' };
      mockExecute.mockResolvedValue(mockResult);

      const { toolResults } = await executeTools(toolUseBlocks, mockContext);

      const parsedContent = JSON.parse(toolResults[0].content);
      expect(parsedContent.success).toBe(false);
      expect(parsedContent.error).toBe('Tool failed');
    });

    it('should still call onToolComplete on failure', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'failing_tool',
          input: {},
        },
      ];

      const mockResult: ToolResult = { success: false, error: 'Failed' };
      mockExecute.mockResolvedValue(mockResult);

      const callbacks: ToolExecutionCallbacks = {
        onToolComplete: vi.fn(),
      };

      await executeTools(toolUseBlocks, mockContext, callbacks);

      expect(callbacks.onToolComplete).toHaveBeenCalledWith('failing_tool', 'tool-1', mockResult);
    });

    it('should work without callbacks', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'test_tool',
          input: {},
        },
      ];

      mockExecute.mockResolvedValue({ success: true });

      // Should not throw
      const { toolResults } = await executeTools(toolUseBlocks, mockContext);

      expect(toolResults).toHaveLength(1);
    });

    it('should return empty array for empty tool blocks', async () => {
      const { toolResults } = await executeTools([], mockContext);

      expect(toolResults).toEqual([]);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should preserve tool execution order in results', async () => {
      const toolUseBlocks: ToolUseContent[] = [
        { type: 'tool_use', id: 'first', name: 'tool_a', input: {} },
        { type: 'tool_use', id: 'second', name: 'tool_b', input: {} },
        { type: 'tool_use', id: 'third', name: 'tool_c', input: {} },
      ];

      mockExecute.mockResolvedValue({ success: true });

      const { toolResults } = await executeTools(toolUseBlocks, mockContext);

      expect(toolResults[0].tool_use_id).toBe('first');
      expect(toolResults[1].tool_use_id).toBe('second');
      expect(toolResults[2].tool_use_id).toBe('third');
    });
  });
});
