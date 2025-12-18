/**
 * Tools module - exports tool registry and registers all tools
 */

import { toolRegistry } from './tool-registry';
import { searchProvidersTool } from './search-providers';
import { displayProviderCardsTool } from './display-provider-cards';
import { ToolName } from '../types/tool.types';

// Register all tools
toolRegistry.register(ToolName.SEARCH_PROVIDERS, searchProvidersTool);
toolRegistry.register(ToolName.DISPLAY_PROVIDER_CARDS, displayProviderCardsTool);

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

export {
  displayProviderCardsTool,
  displayProviderCardsInputSchema,
  displayProviderCardsDefinition,
  type DisplayProviderCardsInput,
  type DisplayProviderCardsOutput,
} from './display-provider-cards';
