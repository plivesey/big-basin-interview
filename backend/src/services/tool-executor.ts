/**
 * Tool Executor - executes tool blocks from Claude API responses
 */

import { toolRegistry } from '../tools';
import { ToolExecutionContext, ToolResult } from '../types/tool.types';
import { ToolUseContent, ToolResultContent } from '../db/schema';
import { logger } from '../utils/logger';

/**
 * Callbacks for tool execution events
 */
export interface ToolExecutionCallbacks {
  onToolStart?: (toolName: string, toolUseId: string) => void;
  onToolComplete?: (toolName: string, toolUseId: string, result: ToolResult) => void;
}

/**
 * Result of executing tools
 */
export interface ExecuteToolsResult {
  toolResults: ToolResultContent[];
}

/**
 * Execute a list of tool_use blocks and return tool_result blocks
 *
 * @param toolUseBlocks - Array of tool_use content blocks from Claude
 * @param context - Execution context (sessionId, userId, etc.)
 * @param callbacks - Optional callbacks for tool events
 * @returns Array of tool_result content blocks to send back to Claude
 */
export async function executeTools(
  toolUseBlocks: ToolUseContent[],
  context: ToolExecutionContext,
  callbacks?: ToolExecutionCallbacks
): Promise<ExecuteToolsResult> {
  const toolResults: ToolResultContent[] = [];

  for (const toolUse of toolUseBlocks) {
    const toolName = toolUse.name;

    logger.info('Executing tool', { toolName, toolUseId: toolUse.id, sessionId: context.sessionId });

    // Emit tool_start callback
    callbacks?.onToolStart?.(toolName, toolUse.id);

    // Execute the tool via registry
    const result = await toolRegistry.execute(toolName, toolUse.input, context);

    // Construct tool_result content block
    toolResults.push({
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: JSON.stringify(result),
    });

    // Emit tool_complete callback
    callbacks?.onToolComplete?.(toolName, toolUse.id, result);

    logger.info('Tool execution complete', {
      toolName,
      toolUseId: toolUse.id,
      success: result.success,
    });
  }

  return { toolResults };
}
