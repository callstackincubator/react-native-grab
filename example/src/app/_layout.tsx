import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import ReactNative, { useColorScheme } from "react-native";
import { Stack } from "expo-router";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { View, StyleSheet } from "react-native";
import { ReactNativeGrabRoot } from "react-native-grab";

export default function MainLayout() {
  const colorScheme = useColorScheme();

  return (
    <ReactNativeGrabRoot>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <View style={styles.appContent}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
          </Stack>
        </View>
      </ThemeProvider>
    </ReactNativeGrabRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appContent: {
    flex: 1,
  },
  overlay: {
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: "transparent",
  },
});
