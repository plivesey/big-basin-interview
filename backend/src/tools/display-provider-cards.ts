/**
 * display_provider_cards tool - displays provider cards in the UI side panel
 *
 * Takes provider IDs as input, looks up full provider data from database,
 * and emits a WebSocket event to display the cards. This prevents AI hallucination
 * of provider details.
 *
 * Also transitions the workflow to PROVIDER_SELECTION state and stores
 * the displayed provider IDs in the workflow context.
 */

import { z } from 'zod';
import {
  RegisteredTool,
  ToolName,
  ToolExecutionContext,
  ToolDefinition,
  DisplayProvider,
} from '../types/tool.types';
import { getProviderById } from '../services/provider-service';
import {
  getCurrentWorkflow,
  transitionState,
  WorkflowState,
} from '../services/workflow-service';
import { logger } from '../utils/logger';

// Input schema (Zod for validation) - IDs only
export const displayProviderCardsInputSchema = z.object({
  providerIds: z
    .array(z.string())
    .min(1)
    .describe('Array of provider IDs from search_providers results'),
});

export type DisplayProviderCardsInput = z.infer<typeof displayProviderCardsInputSchema>;

// Tool definition (Claude SDK format)
export const displayProviderCardsDefinition: ToolDefinition = {
  name: ToolName.DISPLAY_PROVIDER_CARDS,
  description:
    'Display provider cards in the side panel. Call this with provider IDs from search_providers results. The backend will fetch the current provider data - do NOT include provider details, only IDs.',
  input_schema: {
    type: 'object',
    properties: {
      providerIds: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Array of provider IDs to display. Use the IDs from search_providers results.',
      },
    },
    required: ['providerIds'],
  },
};

// Output type for the handler
export interface DisplayProviderCardsOutput {
  success: boolean;
  displayed: number;
  notFound: string[];
  workflowId?: string;
}

// Handler function
async function handler(
  input: DisplayProviderCardsInput,
  context: ToolExecutionContext
): Promise<DisplayProviderCardsOutput> {
  logger.info('display_provider_cards executing', {
    providerIds: input.providerIds,
    sessionId: context.sessionId,
  });

  // Get the current workflow to transition it
  const workflow = await getCurrentWorkflow(context.sessionId);
  let workflowId: string | undefined;

  if (workflow) {
    try {
      // Transition to PROVIDER_SELECTION state with the provider IDs
      const updatedWorkflow = await transitionState(
        workflow.id,
        WorkflowState.PROVIDER_SELECTION,
        { selectedProviders: input.providerIds }
      );
      workflowId = updatedWorkflow.id;
      logger.info('Workflow transitioned to PROVIDER_SELECTION', {
        workflowId,
        providerCount: input.providerIds.length,
      });
    } catch (error) {
      // Log but don't fail the tool - workflow transition is not critical for display
      logger.warn('Failed to transition workflow state', {
        workflowId: workflow.id,
        error: String(error),
      });
      workflowId = workflow.id;
    }
  } else {
    logger.warn('No current workflow found for session', {
      sessionId: context.sessionId,
    });
  }

  // Look up each provider from database
  const providers: DisplayProvider[] = [];
  const notFound: string[] = [];

  for (const id of input.providerIds) {
    const provider = await getProviderById(id);
    if (provider) {
      providers.push({
        id: provider.id,
        name: provider.name,
        category: provider.category,
        rating: provider.rating,
        reviewCount: provider.reviewCount,
        services: provider.services as string[],
        address: provider.address,
      });
    } else {
      notFound.push(id);
      logger.warn('Provider not found for display', { providerId: id });
    }
  }

  // Emit to frontend via context callback (with workflowId)
  if (providers.length > 0 && context.emitDisplayProviders) {
    context.emitDisplayProviders(providers, workflowId);
    logger.info('display_provider_cards emitted to frontend', {
      count: providers.length,
      workflowId,
    });
  }

  return {
    success: true,
    displayed: providers.length,
    notFound,
    workflowId,
  };
}

// Registered tool (exported for use in tool registry)
export const displayProviderCardsTool: RegisteredTool<
  DisplayProviderCardsInput,
  DisplayProviderCardsOutput
> = {
  definition: displayProviderCardsDefinition,
  handler,
  inputSchema: displayProviderCardsInputSchema,
};
