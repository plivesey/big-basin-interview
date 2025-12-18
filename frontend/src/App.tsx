import { ChatContainer } from './components/ChatContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProviderPanel } from './components/ProviderPanel';
import { usePanelStore } from './store/panel-store';

function App() {
  const isProviderPanelOpen = usePanelStore((state) => state.isProviderPanelOpen);

  return (
    <ErrorBoundary>
      <div className="h-screen bg-slate-100 overflow-hidden">
        {/* Chat area - shifts left when panel opens */}
        <div
          className={`h-full flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${
            isProviderPanelOpen ? 'mr-80' : 'mr-0'
          }`}
        >
          <div className="w-full max-w-2xl h-[600px]">
            <ChatContainer />
          </div>
        </div>

        {/* Provider panel - fixed on right, slides in/out */}
        <div
          className={`fixed top-0 right-0 h-full w-80 transition-transform duration-300 ease-in-out ${
            isProviderPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ProviderPanel />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
