/**
 * Tools module - exports tool registry and registers all tools
 */

import { toolRegistry } from './tool-registry';
import { searchProvidersTool } from './search-providers';
import { ToolName } from '../types/tool.types';

// Register all tools
toolRegistry.register(ToolName.SEARCH_PROVIDERS, searchProvidersTool);

// Export the registry
export { toolRegistry, ToolRegistry } from './tool-registry';

// Export individual tools for direct use or testing
export {
  searchProvidersTool,
  searchProvidersInputSchema,
  searchProvidersDefinition,
  type SearchProvidersInput,
  type SearchProvidersOutput,
} from './search-providers';
