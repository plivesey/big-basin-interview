/**
 * The RN implementation of frontend/src/index.css's `@layer components` block.
 *
 * These are NOT ported as CSS. NativeWind supports `@apply`, but the web block
 * is full of `hover:`, `focus:ring-*`, `transition-*`, `cursor-pointer` and a
 * raw `::after` pseudo-element -- all of which silently no-op on native, which
 * is painful to debug.
 *
 * Every entry is a `{ container, text }` pair because RN <Text> does NOT inherit
 * color, fontSize, fontWeight or lineHeight from an ancestor <View>. On the web
 * `.message-user` sets `bg-indigo-600 text-white` on one element; here the
 * background belongs to the View and the color belongs to each Text inside it.
 * Splitting the pairs at authoring time makes that impossible to forget.
 *
 * tailwind.config.js `content` includes ./src/**\/*.ts so the scanner sees these
 * literals.
 */

export const typography = {
  heading1: 'text-3xl font-bold text-gray-800',
  heading2: 'text-2xl font-semibold text-gray-800',
  heading3: 'text-xl font-semibold text-gray-800',
  bodyLarge: 'text-lg text-gray-800 leading-relaxed',
  body: 'text-base text-gray-800 leading-relaxed',
  bodySmall: 'text-sm text-slate-600',
  caption: 'text-xs text-slate-500',
  label: 'text-sm font-medium text-gray-800 mb-2',
} as const;

export const button = {
  base: 'rounded-lg flex-row items-center justify-center',
  size: {
    small: 'px-4 py-2',
    medium: 'px-5 py-2.5',
    large: 'px-6 py-3',
  },
  textSize: {
    small: 'text-sm font-medium',
    medium: 'text-base font-medium',
    large: 'text-lg font-medium',
  },
  primary: { container: 'bg-indigo-600', text: 'text-white' },
  primaryPressed: { container: 'bg-indigo-800', text: 'text-white' },
  secondary: { container: 'bg-indigo-100', text: 'text-indigo-700' },
  secondaryPressed: { container: 'bg-indigo-200', text: 'text-indigo-700' },
  textOnly: { container: 'bg-transparent px-3 py-2', text: 'text-indigo-600' },
  textOnlyPressed: { container: 'bg-indigo-50 px-3 py-2', text: 'text-indigo-700' },
  icon: { container: 'bg-transparent p-2', text: 'text-slate-600' },
  iconPressed: { container: 'bg-slate-100 p-2', text: 'text-slate-600' },
  disabled: { container: 'bg-slate-300', text: 'text-slate-500' },
} as const;

export const message = {
  user: {
    container: 'max-w-[82%] px-4 py-3 bg-indigo-600 rounded-2xl rounded-tr-sm self-end',
    text: 'text-base leading-relaxed text-white',
  },
  assistant: {
    container:
      'max-w-[82%] px-4 py-3 bg-slate-50 rounded-2xl rounded-tl-sm border border-slate-200 self-start',
    text: 'text-base leading-relaxed text-gray-800',
  },
  failed: {
    container: 'max-w-[82%] px-4 py-3 bg-red-50 rounded-2xl rounded-tr-sm self-end border border-red-200',
    text: 'text-base leading-relaxed text-red-700',
  },
  timestamp: {
    container: 'px-3 py-1 bg-slate-100 rounded-full self-center',
    text: 'text-xs text-slate-500',
  },
} as const;

export const card = {
  base: 'bg-white border border-slate-200 rounded-xl p-5',
  pressed: 'bg-white border border-indigo-200 rounded-xl p-5',
  selected: 'bg-white border-2 border-indigo-600 rounded-xl p-5',
  info: 'bg-slate-50 border border-slate-200 rounded-xl p-5',
} as const;

export const badge = {
  base: 'flex-row items-center px-2.5 py-0.5 rounded-full self-start',
  text: 'text-xs font-medium',
  primary: { container: 'bg-indigo-100', text: 'text-indigo-700' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-700' },
  error: { container: 'bg-red-100', text: 'text-red-700' },
  neutral: { container: 'bg-slate-100', text: 'text-slate-700' },
} as const;

export const statusMessage = {
  base: 'flex-row items-start gap-3 p-4 border rounded-lg',
  success: { container: 'bg-green-50 border-green-200', text: 'text-green-700' },
  error: { container: 'bg-red-50 border-red-200', text: 'text-red-700' },
  warning: { container: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  info: { container: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
} as const;

export const timeSlot = {
  base: 'px-3 py-3 rounded-lg items-center',
  baseText: 'text-base font-medium',
  available: { container: 'bg-white border border-slate-300', text: 'text-gray-800' },
  selected: { container: 'bg-indigo-600 border-2 border-indigo-600', text: 'text-white' },
  disabled: { container: 'bg-slate-100 border border-slate-200', text: 'text-slate-400' },
  conflict: { container: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' },
} as const;

export const input = {
  base: 'w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-base text-gray-800',
  focused: 'w-full px-4 py-2.5 bg-white border border-indigo-600 rounded-lg text-base text-gray-800',
  error: 'w-full px-4 py-2.5 bg-white border border-red-500 rounded-lg text-base text-gray-800',
} as const;
