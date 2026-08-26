import { memo, useCallback } from 'react';
import { Pressable, View, Text } from 'react-native';
import type { DisplayProvider } from '@asba/shared-types';
import { RatingStars } from './RatingStars';
import { PinIcon } from '../../theme/icons';

interface ProviderCardProps {
  provider: DisplayProvider;
  onPress: (providerId: string) => void;
}

export const ProviderCard = memo(function ProviderCard({
  provider,
  onPress,
}: ProviderCardProps) {
  const { name, category, rating, reviewCount, services, address, id } = provider;

  const displayedServices = services.slice(0, 3);
  const additionalCount = services.length - 3;

  const handlePress = useCallback(() => onPress(id), [onPress, id]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${name}`}
      testID={`provider-card-${id}`}
    >
      {({ pressed }: { pressed: boolean }) => (
        <View
          className={`bg-white rounded-xl p-4 mb-3 border ${
            pressed ? 'border-indigo-200' : 'border-slate-200'
          }`}
        >
          <Text className="font-semibold text-gray-800 text-base">{name}</Text>
          <Text className="text-sm text-slate-600 capitalize">{category}</Text>

          <View className="mt-2">
            <RatingStars rating={rating} reviewCount={reviewCount} />
          </View>

          {displayedServices.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-1.5">
              {displayedServices.map((service) => (
                <View key={service} className="rounded-full bg-indigo-50 px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-indigo-700">{service}</Text>
                </View>
              ))}
              {additionalCount > 0 ? (
                <View className="rounded-full bg-slate-100 px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-slate-600">
                    +{additionalCount} more
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="mt-3 flex-row items-start gap-1.5">
            <View className="mt-0.5">
              <PinIcon />
            </View>
            <Text className="flex-1 text-sm text-slate-500">{address}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
});
