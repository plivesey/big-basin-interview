import { memo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/tokens';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number | null;
  size?: number;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function Star({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d={STAR_PATH} fill={color} />
    </Svg>
  );
}

/**
 * The web version fills the half-star with a <linearGradient> whose id is the
 * hardcoded string "half-star-gradient" (RatingStars.tsx:32), so every instance
 * on the page declares the same id -- a real collision.
 *
 * Rather than port that and reach for useId(), the half star here is an empty
 * star with a 50%-wide overflow-hidden amber star laid over it. No <defs>, no
 * ids, no bug class. Duplicate ids are worse in react-native-svg than on the
 * web anyway: on Android they can cause the shape not to render at all.
 */
export const RatingStars = memo(function RatingStars({
  rating,
  reviewCount,
  size = 16,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clamped);
  const hasHalfStar = clamped - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View className="flex-row items-center gap-1">
      <View
        className="flex-row"
        accessibilityLabel={`${rating} out of 5 stars`}
        accessibilityRole="image"
      >
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={size} color={tokens.amber500} />
        ))}

        {hasHalfStar ? (
          <View style={{ width: size, height: size }}>
            <Star size={size} color={tokens.slate300} />
            <View
              className="absolute left-0 top-0 overflow-hidden"
              style={{ width: size / 2, height: size }}
            >
              <Star size={size} color={tokens.amber500} />
            </View>
          </View>
        ) : null}

        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={size} color={tokens.slate300} />
        ))}
      </View>

      {reviewCount !== undefined && reviewCount !== null ? (
        <Text className="text-sm text-slate-500">({reviewCount})</Text>
      ) : null}
    </View>
  );
});
