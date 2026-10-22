// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Prefer the ESM entry for Three.js; its CommonJS entry calls process.emitWarning,
// which React Native does not provide.
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];
config.resolver.assetExts = [...config.resolver.assetExts, 'ogg'];

module.exports = config;
