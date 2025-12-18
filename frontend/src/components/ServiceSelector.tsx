import { memo } from 'react';

interface ServiceSelectorProps {
  services: string[];
  selectedService: string | null;
  onServiceSelect: (service: string) => void;
}

/**
 * Service selector as button group for selecting service type.
 */
export const ServiceSelector = memo(function ServiceSelector({
  services,
  selectedService,
  onServiceSelect,
}: ServiceSelectorProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="label-text">Select a service</h4>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => {
          const isSelected = selectedService === service;
          return (
            <button
              key={service}
              type="button"
              onClick={() => onServiceSelect(service)}
              className={
                isSelected
                  ? 'px-4 py-2 rounded-lg font-medium text-white bg-indigo-600 border-2 border-indigo-600 transition-colors'
                  : 'px-4 py-2 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors'
              }
              aria-pressed={isSelected}
            >
              {service}
            </button>
          );
        })}
      </div>
    </div>
  );
});
