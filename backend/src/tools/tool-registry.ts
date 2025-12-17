/**
 * Tool Registry - manages registration and execution of Claude SDK tools
 */

import { RegisteredTool, ToolDefinition, ToolExecutionContext, ToolResult } from '../types/tool.types';
import { logger } from '../utils/logger';

class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * Register a tool with the registry
   */
  register<TInput, TOutput>(name: string, tool: RegisteredTool<TInput, TOutput>): void {
    if (this.tools.has(name)) {
      logger.warn('Tool already registered, overwriting', { name });
    }
    this.tools.set(name, tool as RegisteredTool);
    logger.info('Tool registered', { name });
  }

  /**
   * Get a tool by name
   */
  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool is registered
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Execute a tool by name with input and context
   * Validates input against the tool's Zod schema before execution
   */
  async execute(
    name: string,
    input: unknown,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const tool = this.get(name);
    if (!tool) {
      logger.error('Tool not found', { name });
      return { success: false, error: `Tool not found: ${name}` };
    }

    // Validate input against Zod schema
    const parseResult = tool.inputSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      logger.error('Tool input validation failed', { name, error: errorMessage });
      return { success: false, error: `Invalid input: ${errorMessage}` };
    }

    // Execute the tool handler
    try {
      const result = await tool.handler(parseResult.data, context);
      return { success: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Tool execution failed', { name, error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Get all tool definitions for Claude SDK
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /**
   * Get the number of registered tools
   */
  size(): number {
    return this.tools.size;
  }

  /**
   * Clear all registered tools (useful for testing)
   */
  clear(): void {
    this.tools.clear();
    logger.debug('Tool registry cleared');
  }
}

// Export a singleton instance
export const toolRegistry = new ToolRegistry();

// Also export the class for testing
export { ToolRegistry };
