import React from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { ReactNativeGrabContextProvider, ReactNativeGrabScreen } from "react-native-grab";

const formatContext = (value: Record<string, string | number | boolean | null>) =>
  JSON.stringify(value);

const ContextLabel = ({ value }: { value: Record<string, string | number | boolean | null> }) => {
  return (
    <ThemedView type="backgroundSelected" style={styles.contextLabel}>
      <ThemedText type="code">adds: {formatContext(value)}</ThemedText>
    </ThemedView>
  );
};

export default function ContextPlaygroundScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const rootContext = { area: "context-playground", release: "1.0", tracked: true } as const;
  const sectionContext = { section: "checkout-flow", density: "compact" } as const;
  const cardContext = { card: "payment-summary", currency: "USD", experiment: "B" } as const;
  const ctaContext = { action: "confirm-payment", priority: 1 } as const;

  const contentPlatformStyle = Platform.select({
    default: {
      paddingTop: Spacing.three,
      paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
      paddingLeft: safeAreaInsets.left,
      paddingRight: safeAreaInsets.right,
    },
    android: {
      paddingTop: Spacing.three,
      paddingLeft: safeAreaInsets.left,
      paddingRight: safeAreaInsets.right,
      paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ReactNativeGrabScreen>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      >
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">Grab Context Playground</ThemedText>
            <ThemedText themeColor="textSecondary">
              Select any box below and verify the copied payload includes this hierarchy.
            </ThemedText>
          </ThemedView>

          <ReactNativeGrabContextProvider value={rootContext}>
            <ThemedView type="backgroundElement" style={styles.levelRoot}>
              <ThemedText type="smallBold">Level 1: App Area</ThemedText>
              <ContextLabel value={rootContext} />

              <ReactNativeGrabContextProvider value={sectionContext}>
                <ThemedView type="backgroundElement" style={styles.levelSection}>
                  <ThemedText type="smallBold">Level 2: Section</ThemedText>
                  <ContextLabel value={sectionContext} />

                  <ReactNativeGrabContextProvider value={cardContext}>
                    <ThemedView type="backgroundElement" style={styles.levelCard}>
                      <ThemedText type="smallBold">Level 3: Card</ThemedText>
                      <ContextLabel value={cardContext} />

                      <ReactNativeGrabContextProvider value={ctaContext}>
                        <ThemedView type="backgroundSelected" style={styles.levelAction}>
                          <ThemedText type="smallBold">Level 4: Action Button</ThemedText>
                          <ContextLabel value={ctaContext} />
                          <ThemedText type="small" themeColor="textSecondary">
                            Grab this node to get all levels merged.
                          </ThemedText>
                        </ThemedView>
                      </ReactNativeGrabContextProvider>
                    </ThemedView>
                  </ReactNativeGrabContextProvider>
                </ThemedView>
              </ReactNativeGrabContextProvider>
            </ThemedView>
          </ReactNativeGrabContextProvider>
        </ThemedView>
      </ScrollView>
    </ReactNativeGrabScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  levelRoot: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  levelSection: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  levelCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  levelAction: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  contextLabel: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
