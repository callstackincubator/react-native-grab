import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { ReactNativeGrabScreen } from "react-native-grab";

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
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
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      >
        <ThemedView style={styles.container}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">Selection playground</ThemedText>
            <ThemedText style={styles.centerText} themeColor="textSecondary">
              Tricky examples to try with React Native Grab.{"\n"}
              Select overlays, absolute elements, and modal content.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.sectionsWrapper}>
            <Collapsible title="Absolutely positioned elements">
              <ThemedText type="small">
                These cards use <ThemedText type="code">position: absolute</ThemedText> for badges
                and overlapping layers. Try selecting the badge or the floating label.
              </ThemedText>
              <View style={styles.absoluteExamplesRow}>
                <ThemedView type="backgroundElement" style={styles.absoluteCard}>
                  <View style={styles.absoluteFloatingLabel}>
                    <ThemedText
                      onPress={() => alert("hello")}
                      type="small"
                      style={styles.overlayLabelText}
                    >
                      Coming soon
                    </ThemedText>
                  </View>
                  <View style={styles.cardImagePlaceholder} />
                  <View style={styles.cardContent}>
                    <ThemedText type="default" style={styles.cardTitle}>
                      Beta access
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.cardDescription}
                    >
                      Early access to experimental DOM traversal features.
                    </ThemedText>
                  </View>
                </ThemedView>
              </View>
            </Collapsible>

            <Collapsible title="Modal route">
              <ThemedText type="small">
                Content in a modal route is presented as a modal screen. Open the modal and try
                selecting its title or link.
              </ThemedText>
              <Link href="/modal" asChild>
                <Pressable
                  style={({ pressed }) => [styles.modalTrigger, pressed && styles.pressed]}
                >
                  <ThemedView type="backgroundElement" style={styles.modalTriggerInner}>
                    <ThemedText type="link">Open modal</ThemedText>
                    <SymbolView
                      tintColor={theme.text}
                      name={{ ios: "rectangle.stack", android: "layers", web: "layers" }}
                      size={14}
                    />
                  </ThemedView>
                </Pressable>
              </Link>
            </Collapsible>
          </ThemedView>
          {Platform.OS === "web" && <WebBadge />}
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
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  absoluteExamplesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  absoluteCard: {
    flex: 1,
    minWidth: 160,
    maxWidth: 220,
    borderRadius: Spacing.three,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImagePlaceholder: {
    height: 88,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
  },
  cardContent: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: {
    fontWeight: 600,
  },
  cardDescription: {
    lineHeight: 20,
  },
  absoluteBadge: {
    position: "absolute",
    top: -Spacing.one,
    right: -Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
    backgroundColor: "#208AEF",
  },
  badgeText: {
    color: "#fff",
  },
  absoluteFloatingLabel: {
    position: "absolute",
    top: 26,
    left: Spacing.three,
    right: Spacing.three,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayLabelText: {
    color: "#fff",
  },
  modalTrigger: {
    marginTop: Spacing.two,
  },
  modalTriggerInner: {
    flexDirection: "row",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    justifyContent: "center",
    gap: Spacing.one,
    alignItems: "center",
  },
});
