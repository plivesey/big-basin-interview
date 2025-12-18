import { ChatContainer } from './components/ChatContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProviderPanel } from './components/ProviderPanel';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import { SideMenu } from './components/SideMenu';
import { HamburgerButton } from './components/HamburgerButton';
import { usePanelStore } from './store/panel-store';

function App() {
  const isProviderPanelOpen = usePanelStore((state) => state.isProviderPanelOpen);

  return (
    <ErrorBoundary>
      {/* Hamburger button - fixed top left of window */}
      <div className="fixed top-4 left-4 z-50">
        <HamburgerButton />
      </div>
      <SideMenu />
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
            <ChatContainer />
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
