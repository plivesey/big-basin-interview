import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { typography } from '../../theme/classes';

interface ServiceSelectorProps {
  services: string[];
  selectedService: string | null;
  onServiceSelect: (service: string) => void;
}

export const ServiceSelector = memo(function ServiceSelector({
  services,
  selectedService,
  onServiceSelect,
}: ServiceSelectorProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <View>
      <Text className={typography.label}>Select a service</Text>
      <View className="flex-row flex-wrap gap-2">
        {services.map((service) => {
          const isSelected = selectedService === service;
          return (
            <Pressable
              key={service}
              onPress={() => onServiceSelect(service)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              testID={`service-${service}`}
            >
              <View
                className={
                  isSelected
                    ? 'px-4 py-2 rounded-lg bg-indigo-600 border-2 border-indigo-600'
                    : 'px-4 py-2 rounded-lg bg-white border border-slate-300'
                }
              >
                <Text
                  className={`font-medium ${isSelected ? 'text-white' : 'text-slate-700'}`}
                >
                  {service}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
