const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

const projectRoot = import.meta.dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo support - watch workspace packages
config.watchFolders = [monorepoRoot];

// Node modules resolution for monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Disable hierarchical lookup for better monorepo support
config.resolver.disableHierarchicalLookup = true;

// Ensure workspace packages are resolved correctly
config.resolver.extraNodeModules = {
  "@SYNERGY-GY/api": path.resolve(monorepoRoot, "packages/api"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
