import { usePanelStore } from '../store/panel-store';
import { ProviderCard } from './ProviderCard';

export function ProviderPanel() {
  const { displayedProviders, closeProviderPanel } = usePanelStore();

  return (
    <div className="flex h-full flex-col bg-slate-50 border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">Your options</h2>
        <button
          onClick={closeProviderPanel}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {displayedProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </div>
    </div>
  );
}
