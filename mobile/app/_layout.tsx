import '../global.css';

import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { hydrateSessionId } from '../src/socket/session-storage';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // The splash is held until the stored session id is in memory. Everything
  // below this point can then read it synchronously, which is what keeps
  // useWebSocket's connect() free of an await. See src/socket/session-storage.ts.
  useEffect(() => {
    let cancelled = false;
    void hydrateSessionId().finally(() => {
      if (cancelled) return;
      setReady(true);
      void SplashScreen.hideAsync();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="provider/[id]" options={{ presentation: 'modal' }} />
            </Stack>
          </ErrorBoundary>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
