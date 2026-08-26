import { apiPost } from './client';

export interface WorkflowSelection {
  id: string;
  currentState: string;
  selectedProviderId: string;
}

export async function selectProvider(
  workflowId: string,
  providerId: string
): Promise<WorkflowSelection> {
  const data = await apiPost<{ workflow: WorkflowSelection }>(
    `/api/workflows/${workflowId}/select-provider`,
    { providerId }
  );
  return data.workflow;
}
