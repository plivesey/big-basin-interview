module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v5 applies its babel plugin through metro.config.js -- no
    // `nativewind/babel` preset and no `jsxImportSource` here.
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin must be last. Reanimated 4 moved the babel
    // plugin out of react-native-reanimated; the old name fails at runtime.
    plugins: ['react-native-worklets/plugin'],
  };
};
