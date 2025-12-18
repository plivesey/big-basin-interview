import { ChatContainer } from './components/ChatContainer';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl h-[600px]">
          <ChatContainer />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
