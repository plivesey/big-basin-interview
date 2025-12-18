import { RatingStars } from './RatingStars';
import type { DisplayProvider } from '../store/panel-store';

interface ProviderCardProps {
  provider: DisplayProvider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const { name, category, rating, reviewCount, services, address } = provider;

  // Show max 3 services as badges
  const displayedServices = services.slice(0, 3);
  const additionalCount = services.length - 3;

  return (
    <div className="card-hover bg-white rounded-lg border border-slate-200 p-4">
      {/* Name */}
      <h3 className="font-semibold text-slate-900">{name}</h3>

      {/* Category */}
      <p className="text-sm text-slate-600 capitalize">{category}</p>

      {/* Rating */}
      <div className="mt-2">
        <RatingStars rating={rating} reviewCount={reviewCount} />
      </div>

      {/* Services */}
      {displayedServices.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {displayedServices.map((service) => (
            <span
              key={service}
              className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {service}
            </span>
          ))}
          {additionalCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              +{additionalCount} more
            </span>
          )}
        </div>
      )}

      {/* Address */}
      <div className="mt-3 flex items-start gap-1.5 text-sm text-slate-500">
        <svg
          className="h-4 w-4 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        <span>{address}</span>
      </div>
    </div>
  );
}
