const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block Node-only test modules from being bundled into mobile builds
config.resolver.blockList = [
  /.*\/nodeAdapter\.(ts|js)$/,
  /.*\/better-sqlite3\/.*/,
];

module.exports = config;
