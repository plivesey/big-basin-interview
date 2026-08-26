import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { tokens } from './tokens';

interface IconProps {
  size?: number;
  color?: string;
}

/** Paths lifted from the web components so the two clients draw the same marks. */

export const SendIcon = memo(function SendIcon({ size = 20, color = tokens.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </Svg>
  );
});

export const WarningIcon = memo(function WarningIcon({
  size = 20,
  color = tokens.red600,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </Svg>
  );
});

export const PinIcon = memo(function PinIcon({ size = 16, color = tokens.slate500 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <Path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </Svg>
  );
});

export const ChevronIcon = memo(function ChevronIcon({
  size = 20,
  color = tokens.slate600,
  direction = 'right',
}: IconProps & { direction?: 'left' | 'right' }) {
  const d =
    direction === 'right' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </Svg>
  );
});

export const MenuIcon = memo(function MenuIcon({ size = 24, color = tokens.slate600 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
});

export const CloseIcon = memo(function CloseIcon({ size = 24, color = tokens.slate600 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
});

export const NewChatIcon = memo(function NewChatIcon({
  size = 24,
  color = tokens.slate600,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </Svg>
  );
});

export const StarIcon = memo(function StarIcon({ size = 16, color = tokens.amber500 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <Path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
    </Svg>
  );
});
