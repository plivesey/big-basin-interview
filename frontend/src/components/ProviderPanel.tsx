import { usePanelStore } from '../store/panel-store';
import { ProviderCard } from './ProviderCard';

export function ProviderPanel() {
  const { displayedProviders, closeProviderPanel } = usePanelStore();

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header - matches ChatContainer header style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="font-semibold text-gray-800">Your options</h2>
        <button
          onClick={closeProviderPanel}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          aria-label="Close provider list"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Provider List */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="space-y-3">
          {displayedProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </div>
    </div>
  );
}
