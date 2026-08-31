import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { ReactNativeGrabScreen, ReactNativeGrabSurface, enableGrabbing } from "react-native-grab";

/**
 * Named wrappers so the grab selection menu title identifies which surface the
 * element came from: the menu renders `Text (in ScreenTarget)`, `Text (in AutoSheetTarget)`,
 * and so on. The e2e flows assert on those exact strings.
 *
 * These render `Text` directly instead of `ThemedText`: the menu title names the
 * closest non-host owner, so a shared wrapper component would make every target
 * report the same `Text (in ThemedText)`.
 */
function ScreenTarget() {
  const theme = useTheme();
  return <Text style={[styles.target, { color: theme.text }]}>Screen target</Text>;
}

function AutoSheetTarget() {
  const theme = useTheme();
  return <Text style={[styles.target, { color: theme.text }]}>Auto sheet target</Text>;
}

function FullSheetTarget() {
  const theme = useTheme();
  return <Text style={[styles.target, { color: theme.text }]}>Full sheet target</Text>;
}

type ActionProps = {
  label: string;
  onPress: () => void;
};

function Action({ label, onPress }: ActionProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.action}>
        <ThemedText type="link">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function SheetPlaygroundScreen() {
  const theme = useTheme();
  const autoSheet = useRef<TrueSheet>(null);
  const fullSheet = useRef<TrueSheet>(null);

  // Driven by the sheet's own presentation lifecycle rather than by the press
  // handlers, so drag-to-dismiss also deactivates the surface.
  const [isAutoSheetPresented, setIsAutoSheetPresented] = useState(false);
  const [isFullSheetPresented, setIsFullSheetPresented] = useState(false);

  return (
    <ReactNativeGrabScreen>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Native sheets</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          TrueSheet presents its content in a native container outside the screen subtree. Each
          sheet wraps its content in ReactNativeGrabSurface so grabbing resolves to the presented
          sheet instead of the screen behind it.
        </ThemedText>

        <ScreenTarget />

        <View style={styles.actions}>
          <Action label="Start grabbing on screen" onPress={enableGrabbing} />
          <Action label="Open auto sheet" onPress={() => void autoSheet.current?.present()} />
        </View>
      </ThemedView>

      {/* Content-measured sheet: the surface wrapper sizes to its content, which is
          what the `auto` detent needs to measure. */}
      <TrueSheet
        ref={autoSheet}
        name="auto-sheet"
        detents={["auto"]}
        cornerRadius={24}
        backgroundColor={theme.background}
        onDidPresent={() => setIsAutoSheetPresented(true)}
        onDidDismiss={() => setIsAutoSheetPresented(false)}
      >
        <ReactNativeGrabSurface active={isAutoSheetPresented} style={styles.sheetContent}>
          <ThemedText type="subtitle">Auto sheet</ThemedText>
          <AutoSheetTarget />
          <Action label="Start grabbing in auto sheet" onPress={enableGrabbing} />
          <Action label="Open full sheet" onPress={() => void fullSheet.current?.present()} />
          <Action label="Dismiss auto sheet" onPress={() => void autoSheet.current?.dismiss()} />
        </ReactNativeGrabSurface>
      </TrueSheet>

      {/* Fixed-height sheet: the surface has to fill the sheet, so it takes an
          explicit flex style. */}
      <TrueSheet
        ref={fullSheet}
        name="full-sheet"
        detents={[0.9]}
        cornerRadius={24}
        backgroundColor={theme.background}
        onDidPresent={() => setIsFullSheetPresented(true)}
        onDidDismiss={() => setIsFullSheetPresented(false)}
      >
        <ReactNativeGrabSurface
          active={isFullSheetPresented}
          style={[styles.sheetContent, styles.fill]}
        >
          <ThemedText type="subtitle">Full sheet</ThemedText>
          <FullSheetTarget />
          <Action label="Start grabbing in full sheet" onPress={enableGrabbing} />
          <Action label="Dismiss full sheet" onPress={() => void fullSheet.current?.dismiss()} />
        </ReactNativeGrabSurface>
      </TrueSheet>
    </ReactNativeGrabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  fill: {
    flex: 1,
  },
  target: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
  sheetContent: {
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  actions: {
    gap: Spacing.two,
  },
  action: {
    alignItems: "center",
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
