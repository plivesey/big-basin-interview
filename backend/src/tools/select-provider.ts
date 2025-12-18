/**
 * select_provider tool - selects a provider for booking
 *
 * Takes a provider ID, validates it exists in the workflow's selectedProviders,
 * transitions the workflow to TIME_SELECTION state, and emits a WebSocket event
 * to open the provider detail modal in the frontend.
 */

import { z } from 'zod';
import {
  RegisteredTool,
  ToolName,
  ToolExecutionContext,
  ToolDefinition,
} from '../types/tool.types';
import { getProviderById } from '../services/provider-service';
import {
  getCurrentWorkflow,
  transitionState,
  WorkflowState,
} from '../services/workflow-service';
import { logger } from '../utils/logger';

// Input schema (Zod for validation)
export const selectProviderInputSchema = z.object({
  providerId: z.string().describe('The ID of the provider to select for booking'),
});

export type SelectProviderInput = z.infer<typeof selectProviderInputSchema>;

// Tool definition (Claude SDK format)
export const selectProviderDefinition: ToolDefinition = {
  name: ToolName.SELECT_PROVIDER,
  description:
    'Select a provider for booking. Use this when the user indicates which provider they want to book with (e.g., "I\'ll go with Luxe Salon"). This will open the booking modal where the user can select a time slot.',
  input_schema: {
    type: 'object',
    properties: {
      providerId: {
        type: 'string',
        description:
          'The ID of the provider the user wants to book. Must be from the providers shown via display_provider_cards.',
      },
    },
    required: ['providerId'],
  },
};

// Output type for the handler
export interface SelectProviderOutput {
  success: boolean;
  providerId: string;
  providerName: string;
  workflowId: string;
  error?: string;
}

// Handler function
async function handler(
  input: SelectProviderInput,
  context: ToolExecutionContext
): Promise<SelectProviderOutput> {
  logger.info('select_provider executing', {
    providerId: input.providerId,
    sessionId: context.sessionId,
  });

  // Get the current workflow
  const workflow = await getCurrentWorkflow(context.sessionId);

  if (!workflow) {
    logger.warn('No current workflow found for session', {
      sessionId: context.sessionId,
    });
    return {
      success: false,
      providerId: input.providerId,
      providerName: '',
      workflowId: '',
      error: 'No active booking workflow. Please search for providers first.',
    };
  }

  // Validate the provider ID is in the workflow's selected providers
  const selectedProviders = workflow.context.selectedProviders || [];
  if (!selectedProviders.includes(input.providerId)) {
    logger.warn('Provider ID not in selected providers', {
      providerId: input.providerId,
      selectedProviders,
      workflowId: workflow.id,
    });

    // Build helpful error message with valid provider IDs and names
    let validProvidersList = '';
    if (selectedProviders.length > 0) {
      const providerDetails = await Promise.all(
        selectedProviders.map(async (id: string) => {
          const p = await getProviderById(id);
          return p ? `${id} (${p.name})` : id;
        })
      );
      validProvidersList = `\nValid provider IDs:\n${providerDetails.map((p) => `- ${p}`).join('\n')}`;
    }

    return {
      success: false,
      providerId: input.providerId,
      providerName: '',
      workflowId: workflow.id,
      error: `Provider ID '${input.providerId}' not found in current search results.${validProvidersList}\nUse one of these exact IDs with select_provider.`,
    };
  }

  // Look up the provider from database
  const provider = await getProviderById(input.providerId);

  if (!provider) {
    logger.warn('Provider not found in database', {
      providerId: input.providerId,
    });
    return {
      success: false,
      providerId: input.providerId,
      providerName: '',
      workflowId: workflow.id,
      error: 'Provider not found.',
    };
  }

  // Transition workflow to TIME_SELECTION state with selectedProviderId
  try {
    await transitionState(workflow.id, WorkflowState.TIME_SELECTION, {
      selectedProviderId: input.providerId,
    });
    logger.info('Workflow transitioned to TIME_SELECTION', {
      workflowId: workflow.id,
      providerId: input.providerId,
    });
  } catch (error) {
    logger.error('Failed to transition workflow state', {
      workflowId: workflow.id,
      error: String(error),
    });
    return {
      success: false,
      providerId: input.providerId,
      providerName: provider.name,
      workflowId: workflow.id,
      error: 'Failed to update booking workflow.',
    };
  }

  // Emit open_provider_detail event to open the modal in frontend
  if (context.emitOpenProviderDetail) {
    context.emitOpenProviderDetail(provider.id, provider.name, workflow.id);
    logger.info('open_provider_detail emitted to frontend', {
      providerId: provider.id,
      providerName: provider.name,
      workflowId: workflow.id,
    });
  }

  return {
    success: true,
    providerId: provider.id,
    providerName: provider.name,
    workflowId: workflow.id,
  };
}

// Registered tool (exported for use in tool registry)
export const selectProviderTool: RegisteredTool<
  SelectProviderInput,
  SelectProviderOutput
> = {
  definition: selectProviderDefinition,
  handler,
  inputSchema: selectProviderInputSchema,
};
