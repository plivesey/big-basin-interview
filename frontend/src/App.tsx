import { useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProviderPanel } from './components/ProviderPanel';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import { SideMenu } from './components/SideMenu';
import { HamburgerButton } from './components/HamburgerButton';
import { NewConversationButton } from './components/NewConversationButton';
import { usePanelStore } from './store/panel-store';
import { useMenuStore } from './store/menu-store';
import { useWebSocket } from './hooks/useWebSocket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function App() {
  const isProviderPanelOpen = usePanelStore((state) => state.isProviderPanelOpen);
  const setCalendarStatus = useMenuStore((state) => state.setCalendarStatus);
  const {
    sendMessage,
    reconnect,
    retryLastMessage,
    isRetrying,
    switchSession,
    createNewSession,
  } = useWebSocket();

  // Handle calendar OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarConnected = params.get('calendar_connected');
    const calendarError = params.get('calendar_error');

    if (calendarConnected === 'true' || calendarError) {
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('calendar_connected');
      url.searchParams.delete('calendar_error');
      window.history.replaceState({}, '', url.pathname);

      // Fetch and update calendar status
      if (calendarConnected === 'true') {
        fetch(`${BACKEND_URL}/auth/google/status`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setCalendarStatus(data.data.connected, data.data.email || null);
            }
          })
          .catch(console.error);
      } else if (calendarError) {
        console.error('Calendar connection error:', calendarError);
      }
    }
  }, [setCalendarStatus]);

  return (
    <ErrorBoundary>
      {/* Navigation buttons - fixed top left of window */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <HamburgerButton />
        <NewConversationButton onClick={createNewSession} />
      </div>
      <SideMenu onSessionSelect={switchSession} />
      <ProviderDetailModal />
      <div className="h-screen bg-slate-100 overflow-hidden flex items-center justify-center p-4">
        {/* Main container - animates width to fit content, always centered */}
        <div
          className={`flex gap-4 h-[700px] max-h-[90vh] transition-all duration-300 ease-in-out ${
            isProviderPanelOpen ? 'w-[936px]' : 'w-[700px]'
          }`}
        >
          {/* Chat window - expands when panel is closed */}
          <div
            className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
              isProviderPanelOpen ? 'w-[600px]' : 'w-[700px]'
            }`}
          >
            <ChatContainer
              sendMessage={sendMessage}
              reconnect={reconnect}
              retryLastMessage={retryLastMessage}
              isRetrying={isRetrying}
            />
          </div>

          {/* Provider panel - animates in/out */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isProviderPanelOpen
                ? 'w-80 opacity-100'
                : 'w-0 opacity-0'
            }`}
          >
            <div className="w-80 h-full">
              <ProviderPanel />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
