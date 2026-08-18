const { getDefaultConfig } = require('expo/metro-config');

// SDK 52+ auto-configures monorepo resolution; manual watchFolders /
// nodeModulesPaths / disableHierarchicalLookup are no longer needed.
module.exports = getDefaultConfig(__dirname);
