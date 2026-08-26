import { usePanelStore } from '../panel-store';
import type { DisplayProvider } from '@asba/shared-types';

describe('panel-store', () => {
  const mockProviders: DisplayProvider[] = [
    {
      id: 'provider-1',
      name: 'Test Salon',
      category: 'salon',
      rating: 4.5,
      reviewCount: 100,
      services: ['haircut', 'coloring'],
      address: '123 Main St',
    },
    {
      id: 'provider-2',
      name: 'Test Mechanic',
      category: 'mechanic',
      rating: 4.2,
      reviewCount: 50,
      services: ['oil change', 'brake repair'],
      address: '456 Oak Ave',
    },
  ];

  beforeEach(() => {
    // Reset store to initial state before each test
    usePanelStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have panel closed initially', () => {
      const { isProviderPanelOpen } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(false);
    });

    it('should have empty providers initially', () => {
      const { displayedProviders } = usePanelStore.getState();
      expect(displayedProviders).toEqual([]);
    });
  });

  describe('openProviderPanel', () => {
    it('should open panel and set providers', () => {
      usePanelStore.getState().openProviderPanel(mockProviders);

      const { isProviderPanelOpen, displayedProviders } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(true);
      expect(displayedProviders).toEqual(mockProviders);
    });

    it('should replace existing providers', () => {
      usePanelStore.getState().openProviderPanel([mockProviders[0]]);
      usePanelStore.getState().openProviderPanel([mockProviders[1]]);

      const { displayedProviders } = usePanelStore.getState();
      expect(displayedProviders).toHaveLength(1);
      expect(displayedProviders[0].id).toBe('provider-2');
    });
  });

  describe('closeProviderPanel', () => {
    it('should close panel but preserve providers for toggle button', () => {
      usePanelStore.getState().openProviderPanel(mockProviders);
      usePanelStore.getState().closeProviderPanel();

      const { isProviderPanelOpen, displayedProviders } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(false);
      // Providers are preserved so toggle button can re-open panel
      expect(displayedProviders).toEqual(mockProviders);
    });
  });

  describe('reopenProviderPanel', () => {
    it('should reopen panel with existing providers', () => {
      usePanelStore.getState().openProviderPanel(mockProviders);
      usePanelStore.getState().closeProviderPanel();
      usePanelStore.getState().reopenProviderPanel();

      const { isProviderPanelOpen, displayedProviders } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(true);
      expect(displayedProviders).toEqual(mockProviders);
    });
  });

  describe('clearProviders', () => {
    it('should clear providers and close panel when workflow completes', () => {
      usePanelStore.getState().openProviderPanel(mockProviders, 'workflow-1', 'PROVIDER_SELECTION');
      usePanelStore.getState().clearProviders();

      const { isProviderPanelOpen, displayedProviders, workflowState } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(false);
      expect(displayedProviders).toEqual([]);
      expect(workflowState).toBeNull();
    });
  });

  describe('workflowState', () => {
    it('should set workflow state when opening panel', () => {
      usePanelStore.getState().openProviderPanel(mockProviders, 'workflow-1', 'PROVIDER_SELECTION');

      const { workflowState } = usePanelStore.getState();
      expect(workflowState).toBe('PROVIDER_SELECTION');
    });

    it('should allow setting workflow state independently', () => {
      usePanelStore.getState().setWorkflowState('PROVIDER_SELECTION');

      const { workflowState } = usePanelStore.getState();
      expect(workflowState).toBe('PROVIDER_SELECTION');
    });
  });

  describe('updateProviders', () => {
    it('should update providers and open panel if not empty', () => {
      usePanelStore.getState().updateProviders(mockProviders);

      const { isProviderPanelOpen, displayedProviders } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(true);
      expect(displayedProviders).toEqual(mockProviders);
    });

    it('should close panel if empty array provided', () => {
      usePanelStore.getState().openProviderPanel(mockProviders);
      usePanelStore.getState().updateProviders([]);

      const { isProviderPanelOpen, displayedProviders } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(false);
      expect(displayedProviders).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      usePanelStore.getState().openProviderPanel(mockProviders);
      usePanelStore.getState().reset();

      const { isProviderPanelOpen, displayedProviders } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(false);
      expect(displayedProviders).toEqual([]);
    });
  });
});
