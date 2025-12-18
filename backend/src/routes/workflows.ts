import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getWorkflow,
  transitionState,
  WorkflowState,
  WorkflowNotFoundError,
  InvalidTransitionError,
} from '../services/workflow-service';
import { NotFoundError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const workflowIdSchema = z.object({
  id: z.string().uuid('Invalid workflow ID format'),
});

const selectProviderBodySchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format'),
});

/**
 * POST /api/workflows/:id/select-provider
 * Called by frontend when user clicks on a provider card.
 * Transitions workflow from PROVIDER_SEARCH to PROVIDER_SELECTION.
 * Idempotent: If already in PROVIDER_SELECTION, returns success.
 */
router.post(
  '/:id/select-provider',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { id: workflowId } = workflowIdSchema.parse(req.params);
      const { providerId } = selectProviderBodySchema.parse(req.body);

      logger.debug('Select provider request', { workflowId, providerId });

      // Get current workflow
      const workflow = await getWorkflow(workflowId);
      if (!workflow) {
        throw new NotFoundError('Workflow', workflowId);
      }

      // Idempotent: If already in PROVIDER_SELECTION, just return success
      if (workflow.currentState === WorkflowState.PROVIDER_SELECTION) {
        logger.debug('Workflow already in PROVIDER_SELECTION state', {
          workflowId,
          providerId,
        });

        return res.json({
          success: true,
          data: {
            workflow: {
              id: workflow.id,
              currentState: workflow.currentState,
              selectedProviderId: workflow.context.selectedProviderId,
            },
          },
        });
      }

      // Transition to PROVIDER_SELECTION
      const updatedWorkflow = await transitionState(
        workflowId,
        WorkflowState.PROVIDER_SELECTION,
        { selectedProviderId: providerId }
      );

      logger.info('Provider selected via API', {
        workflowId,
        providerId,
        previousState: workflow.currentState,
        newState: updatedWorkflow.currentState,
      });

      res.json({
        success: true,
        data: {
          workflow: {
            id: updatedWorkflow.id,
            currentState: updatedWorkflow.currentState,
            selectedProviderId: updatedWorkflow.context.selectedProviderId,
          },
        },
      });
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        return next(new NotFoundError('Workflow', req.params.id));
      }
      if (error instanceof InvalidTransitionError) {
        // Return 400 for invalid transitions
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: error.message,
          },
        });
      }
      next(error);
    }
  }
);

export default router;
