const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');
const sharedTypesRoot = path.resolve(repoRoot, 'packages/shared-types');

const config = getDefaultConfig(projectRoot);

// @asba/shared-types is a `file:` dependency that lives outside this project
// root and ships raw TypeScript with no build step. npm symlinks it into
// node_modules, but Metro resolves symlinks to their real path and then refuses
// to serve anything outside `projectRoot | watchFolders`. This repo has no root
// package.json, so Expo's workspace auto-detection finds nothing.
//
// Watch only packages/shared-types -- watching repoRoot would pull
// backend/node_modules and frontend/node_modules into the crawl and risk Metro
// finding a second copy of react.
config.watchFolders = [sharedTypesRoot];

config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
// NOTE: do NOT set disableHierarchicalLookup here. It switches off the standard
// node_modules walk entirely, which breaks nested installs such as
// react-native-reanimated/node_modules/semver.

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@asba/shared-types': path.resolve(sharedTypesRoot, 'src'),
};

module.exports = withNativewind(config);
