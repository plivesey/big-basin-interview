import { describe, it, expect, beforeEach } from 'vitest';
import { usePanelStore, DisplayProvider } from './panel-store';

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
    it('should close panel and clear providers', () => {
      usePanelStore.getState().openProviderPanel(mockProviders);
      usePanelStore.getState().closeProviderPanel();

      const { isProviderPanelOpen, displayedProviders } = usePanelStore.getState();
      expect(isProviderPanelOpen).toBe(false);
      expect(displayedProviders).toEqual([]);
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
