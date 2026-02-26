import React from "react";
import { FlatList, ListRenderItemInfo, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

import { ReactNativeGrabScreen } from "react-native-grab";

type FlatListItem = {
  id: string;
  title: string;
  description: string;
};

const DATA: FlatListItem[] = Array.from({ length: 40 }, (_, index) => ({
  id: `item-${index + 1}`,
  title: `Item ${index + 1}`,
  description: `Row content for testing list selection #${index + 1}.`,
}));

function renderItem({ item }: ListRenderItemInfo<FlatListItem>) {
  return (
    <ThemedView type="backgroundElement" style={styles.itemCard}>
      <ThemedText type="smallBold">{item.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {item.description}
      </ThemedText>
    </ThemedView>
  );
}

export default function FlatListScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <ReactNativeGrabScreen>
      <ThemedView style={styles.root}>
        <FlatList
          data={DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: safeAreaInsets.top + Spacing.three,
            paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
            paddingHorizontal: Spacing.four,
            alignSelf: "center",
            width: "100%",
            maxWidth: MaxContentWidth,
            gap: Spacing.two,
          }}
          ListHeaderComponent={
            <ThemedView style={styles.header}>
              <ThemedText type="subtitle">FlatList Playground</ThemedText>
              <ThemedText themeColor="textSecondary">
                A dedicated list tab for testing selection and scrolling behavior.
              </ThemedText>
            </ThemedView>
          }
        />
      </ThemedView>
    </ReactNativeGrabScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  itemCard: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
});
