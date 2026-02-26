// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { withReactNativeGrab } = require("react-native-grab/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(path.resolve("..", "node_modules", "react")),
  new RegExp(path.resolve("..", "node_modules", "react-native")),
  new RegExp(path.resolve("..", "node_modules", "expo-router")),
  new RegExp(path.resolve("..", "node_modules", "expo-dev-client")),
  new RegExp(path.resolve("..", "node_modules", "expo-dev-menu")),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "./node_modules"),
  path.resolve(__dirname, "../node_modules"),
];

config.resolver.extraNodeModules = {
  "react-native-grab": "..",
};

config.watchFolders = [path.resolve(__dirname, "..")];

module.exports = withReactNativeGrab(config);
