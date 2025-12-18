/**
 * Tools module - exports tool registry and registers all tools
 */

import { toolRegistry } from './tool-registry';
import { searchProvidersTool } from './search-providers';
import { displayProviderCardsTool } from './display-provider-cards';
import { selectProviderTool } from './select-provider';
import { getAvailabilityTool } from './get-availability';
import { setLocationTool } from './set-location';
import { ToolName } from '../types/tool.types';

// Register all tools
toolRegistry.register(ToolName.SEARCH_PROVIDERS, searchProvidersTool);
toolRegistry.register(ToolName.DISPLAY_PROVIDER_CARDS, displayProviderCardsTool);
toolRegistry.register(ToolName.SELECT_PROVIDER, selectProviderTool);
toolRegistry.register(ToolName.GET_AVAILABLE_SLOTS, getAvailabilityTool);
toolRegistry.register(ToolName.SET_LOCATION, setLocationTool);

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

export {
  selectProviderTool,
  selectProviderInputSchema,
  selectProviderDefinition,
  type SelectProviderInput,
  type SelectProviderOutput,
} from './select-provider';

export {
  getAvailabilityTool,
  getAvailabilityInputSchema,
  getAvailabilityDefinition,
  type GetAvailabilityInput,
  type GetAvailabilityOutput,
} from './get-availability';

export {
  setLocationTool,
  setLocationInputSchema,
  setLocationDefinition,
  type SetLocationInput,
  type SetLocationOutput,
} from './set-location';
