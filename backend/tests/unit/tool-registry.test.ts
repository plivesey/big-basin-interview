import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../../src/tools/tool-registry';
import { RegisteredTool, ToolDefinition, ToolExecutionContext } from '../../src/types/tool.types';

// Mock logger to avoid console output during tests
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Test helper to create a mock tool
function createMockTool(
  name: string,
  handler: (input: unknown, context: ToolExecutionContext) => Promise<unknown> = async () => ({ result: 'ok' })
): RegisteredTool {
  const definition: ToolDefinition = {
    name,
    description: `Test tool: ${name}`,
    input_schema: {
      type: 'object',
      properties: {
        value: { type: 'string' },
      },
      required: [],
    },
  };

  return {
    definition,
    handler,
    inputSchema: z.object({
      value: z.string().optional(),
    }),
  };
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('register', () => {
    it('should register a tool', () => {
      const tool = createMockTool('test_tool');

      registry.register('test_tool', tool);

      expect(registry.has('test_tool')).toBe(true);
    });

    it('should overwrite existing tool with same name', () => {
      const tool1 = createMockTool('test_tool');
      const tool2 = createMockTool('test_tool');

      registry.register('test_tool', tool1);
      registry.register('test_tool', tool2);

      expect(registry.size()).toBe(1);
    });
  });

  describe('get', () => {
    it('should return registered tool', () => {
      const tool = createMockTool('test_tool');
      registry.register('test_tool', tool);

      const result = registry.get('test_tool');

      expect(result).toBeDefined();
      expect(result?.definition.name).toBe('test_tool');
    });

    it('should return undefined for unknown tool', () => {
      const result = registry.get('nonexistent_tool');

      expect(result).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered tool', () => {
      const tool = createMockTool('test_tool');
      registry.register('test_tool', tool);

      expect(registry.has('test_tool')).toBe(true);
    });

    it('should return false for unregistered tool', () => {
      expect(registry.has('nonexistent_tool')).toBe(false);
    });
  });

  describe('execute', () => {
    const mockContext: ToolExecutionContext = {
      sessionId: 'test-session-id',
      userId: 'test-user-id',
    };

    it('should execute tool with valid input', async () => {
      const handler = vi.fn().mockResolvedValue({ data: 'test result' });
      const tool = createMockTool('test_tool', handler);
      registry.register('test_tool', tool);

      const result = await registry.execute('test_tool', { value: 'hello' }, mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'test result' });
      expect(handler).toHaveBeenCalledWith({ value: 'hello' }, mockContext);
    });

    it('should return error for nonexistent tool', async () => {
      const result = await registry.execute('nonexistent_tool', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool not found');
    });

    it('should validate input with Zod schema', async () => {
      const handler = vi.fn().mockResolvedValue({ data: 'ok' });
      const strictTool: RegisteredTool = {
        definition: {
          name: 'strict_tool',
          description: 'A tool with strict schema',
          input_schema: {
            type: 'object',
            properties: {
              requiredField: { type: 'string' },
            },
            required: ['requiredField'],
          },
        },
        handler,
        inputSchema: z.object({
          requiredField: z.string(),
        }),
      };
      registry.register('strict_tool', strictTool);

      // Valid input
      const validResult = await registry.execute('strict_tool', { requiredField: 'value' }, mockContext);
      expect(validResult.success).toBe(true);

      // Invalid input (missing required field)
      const invalidResult = await registry.execute('strict_tool', {}, mockContext);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('Invalid input');
    });

    it('should return error for invalid input', async () => {
      const tool: RegisteredTool = {
        definition: {
          name: 'typed_tool',
          description: 'Tool with typed input',
          input_schema: {
            type: 'object',
            properties: {
              count: { type: 'number' },
            },
            required: ['count'],
          },
        },
        handler: async () => ({}),
        inputSchema: z.object({
          count: z.number(),
        }),
      };
      registry.register('typed_tool', tool);

      const result = await registry.execute('typed_tool', { count: 'not a number' }, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
    });

    it('should catch and return handler errors', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      const tool = createMockTool('failing_tool', handler);
      registry.register('failing_tool', tool);

      const result = await registry.execute('failing_tool', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Handler failed');
    });

    it('should handle non-Error throws from handler', async () => {
      const handler = vi.fn().mockRejectedValue('String error');
      const tool = createMockTool('string_error_tool', handler);
      registry.register('string_error_tool', tool);

      const result = await registry.execute('string_error_tool', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('getToolDefinitions', () => {
    it('should return all tool definitions', () => {
      const tool1 = createMockTool('tool1');
      const tool2 = createMockTool('tool2');
      registry.register('tool1', tool1);
      registry.register('tool2', tool2);

      const definitions = registry.getToolDefinitions();

      expect(definitions).toHaveLength(2);
      expect(definitions.map((d) => d.name)).toContain('tool1');
      expect(definitions.map((d) => d.name)).toContain('tool2');
    });

    it('should return empty array when no tools registered', () => {
      const definitions = registry.getToolDefinitions();

      expect(definitions).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return correct count after registrations', () => {
      registry.register('tool1', createMockTool('tool1'));
      registry.register('tool2', createMockTool('tool2'));

      expect(registry.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all registered tools', () => {
      registry.register('tool1', createMockTool('tool1'));
      registry.register('tool2', createMockTool('tool2'));

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('tool1')).toBe(false);
    });
  });
});
