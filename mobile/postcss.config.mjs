// Tailwind v4 runs as a PostCSS plugin. Expo's Metro picks this file up
// automatically; without it, global.css is inlined verbatim and no utility
// classes are generated -- the app renders completely unstyled with no error.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
