const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const rootModules = path.resolve(workspaceRoot, "node_modules");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  rootModules,
];

// En workspaces npm, Expo y sus peers suelen estar solo en node_modules de la raíz.
const expoPeers = [
  "expo",
  "expo-asset",
  "expo-constants",
  "expo-font",
  "expo-modules-core",
];
config.resolver.extraNodeModules = Object.fromEntries(
  expoPeers.map((name) => [name, path.join(rootModules, name)]),
);

module.exports = config;
