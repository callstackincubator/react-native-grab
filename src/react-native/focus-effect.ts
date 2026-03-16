import { useEffect } from "react";

const getDefaultFocusEffectFactory = (): ((cb: () => void) => void) => {
  try {
    return require("expo-router").useFocusEffect;
  } catch {
    // Nothing we can do about it, it's not installed in the project.
  }

  try {
    return require("@react-navigation/native").useFocusEffect;
  } catch {
    // Nothing we can do about it, it's not installed in the project.
  }

  console.warn(
    "[react-native-grab] No supported router found — falling back to useEffect. This may cause issues. Provide a custom focus effect using the setFocusEffect function.",
  );

  const useFallbackFocusEffect = (cb: () => void) => {
    useEffect(() => {
      return cb();
    }, [cb]);
  };

  return useFallbackFocusEffect;
};

let cachedFocusEffect: ((cb: () => void) => void) | null = null;

export const getFocusEffect = (): ((cb: () => void) => void) => {
  if (!cachedFocusEffect) {
    cachedFocusEffect = getDefaultFocusEffectFactory();
  }

  return cachedFocusEffect;
};

export const setFocusEffect = (impl: (cb: () => void) => void) => {
  cachedFocusEffect = impl;
};
