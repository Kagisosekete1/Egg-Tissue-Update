// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  { files: ['src/components/DicePreview.js','Scene.native.js'], rules: { 'react/no-unknown-property': 'off' } },
]);
