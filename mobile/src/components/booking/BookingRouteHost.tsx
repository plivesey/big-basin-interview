import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { useBookingStore } from '../../store/booking-store';
import { logger } from '../../utils/logger';

/**
 * Keeps the router in step with booking-store.
 *
 * openProviderModal() is called from two places -- a tap on a provider card,
 * and the server's `open_provider_detail` event when Scout picks a provider
 * with the select_provider tool. Neither of those can navigate on its own, so
 * this component watches the store and drives the router.
 *
 * The store is the source of truth and the router follows, never the reverse.
 * Note the `replace` branch: Scout can re-select while the sheet is already
 * open, and a second `push` would stack two modals.
 */
export function BookingRouteHost() {
  const isModalOpen = useBookingStore((state) => state.isModalOpen);
  const providerId = useBookingStore((state) => state.selectedProvider?.id ?? null);
  const pathname = usePathname();

  useEffect(() => {
    const onProviderRoute = pathname.startsWith('/provider/');

    if (isModalOpen && !onProviderRoute) {
      logger.debug('Opening booking route');
      router.push(`/provider/${providerId ?? 'loading'}`);
      return;
    }

    if (!isModalOpen && onProviderRoute) {
      logger.debug('Dismissing booking route');
      router.back();
    }
  }, [isModalOpen, providerId, pathname]);

  return null;
}
