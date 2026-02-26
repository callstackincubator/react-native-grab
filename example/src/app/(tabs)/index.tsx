import * as Device from "expo-device";
import { Image } from "expo-image";
import { Platform, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HintRow } from "@/components/hint-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

import { ReactNativeGrabScreen } from "react-native-grab";

function getDevMenuHint() {
  if (Platform.OS === "web") {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === "android" ? "cmd+m (or ctrl+m)" : "cmd+d";
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  return (
    <ReactNativeGrabScreen>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.heroSection}>
            <Image source={require("@/assets/images/splash-icon.png")} style={styles.heroIcon} />
            <ThemedText type="title" style={styles.title}>
              React Native Grab
            </ThemedText>
            <ThemedText style={styles.tagline} themeColor="textSecondary">
              Point at the exact UI element you want to change, copy precise context, and hand it to
              your coding agent.
            </ThemedText>
          </ThemedView>

          <ThemedText type="code" style={styles.code}>
            How it works
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <HintRow title="1. Open dev menu" hint={getDevMenuHint()} />
            <HintRow title="2. Select React Native Grab" />
            <HintRow title="3. Drag on target element" />
            <HintRow title="4. Release to capture" />
          </ThemedView>

          {Platform.OS === "web" && <WebBadge />}
        </SafeAreaView>
      </ThemedView>
    </ReactNativeGrabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  heroIcon: {
    width: 76,
    height: 76,
  },
  title: {
    textAlign: "center",
  },
  tagline: {
    textAlign: "center",
    paddingHorizontal: Spacing.two,
  },
  code: {
    textTransform: "uppercase",
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: "stretch",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
