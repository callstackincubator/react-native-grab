import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderHandlers,
  Image,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const BAR_HEIGHT = 36;
const BAR_WIDTH = 108;
const SLOT_WIDTH = 36;

// Icons from https://lucide.dev/
const DRAG_ICON_IMAGE_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAsElEQVR4AdySMQqAMAxFxUWv6eiJHL2mbr5AyfAhQ0PaQUnhhzR5pvx1Gfz9D3DwYk87ppEelnfX9Ikuxm3tmEZ6WN5dU4BPqxIKOBn8tmMa6WF5d00BN+P2dkwjPSzvrinAp1WJ6YCUFdk27NMNUlYEEPYpgLu1oYCUFfmlsE8BKSsCCPsUwN3amA4I7cZeqZpuENoNQKqmAObUhgJCu4FN1RQQ2g1AqqYA5tTGcMAHAAD//+qsAJ8AAAAGSURBVAMAklJIMadtfagAAAAASUVORK5CYII=";
const HIDE_ICON_IMAGE_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABMElEQVR4AezRy20CMRAGYJQiUkcuSQu5pNxc0kJySR1Uwf+hNQ+tx14hIS4gDzue/7UML7s7f54B0wU/bEW/eTX1mufs4OCqFXf0C97D/k4xyKN7YDi4XUIV8BX2X4qQAaNcr44ZDAeX5orgUgXsAxIQMmDEMOPj0ZvBcHBpjuDlVxWAQ0DIgBFDxkpvBsPBpVnVKACZkAEjhj8ZKr0ZDCfj/pkFUDFg9J/L21J6M1hG9dkSUKs3IFsC2s69vTdXev8DbBgzC2DAqO38M27K/s1gOBn3zyiAkAEjhm3n9q43g+HgdhOqAAJCBowYMm4mejMYDi5Nw0/PKoCAkAEjhifR0pjBcHBpFuj8qAIwCBkwcu8VDAe3h++qgI+wFYO0w4ODq1bEKmBFvHXwDJhu7gAAAP//FX4TdAAAAAZJREFUAwAkFUAxInh9owAAAABJRU5ErkJggg==";
const INSPECT_ICON_IMAGE_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABNUlEQVR4AezUYU7DMAwFYMPFKCcDTgacDPxFc5ROZazRNu3Hor46cWy/vDTpc1y53ZxgSUGfiZ9JyH3P3P6MCkwIQNIDdnbkvmUOmyZiJHhpnoiPtE+TkJupgYRdESzNE0FJTLbKXSp/VFC+i9oHwb/beXdb5JS4KyxsKXBUoc3tVeCuOILOObjxx0TGMEXQkvL1dUCadqkQlTK+jr0KuvSs8HpA+UoZsmkFVp51QzEwVsyvBRFENttH0epXkf6zHkUFKsICMt8HjOHba+8WyalVKmrMWi0LFgCUTStQoIorqs9X34XlWxEI4GzMOidQKmwTCOWrGsYN4xYJ4JTgJGyhyKtQrV5e+fQ7RgIBSNgecKIzxsnbDB0JBFih/XPstmBeHIhTGEa/uY5jgj5xZkdh+DP8FwAA//94DFv3AAAABklEQVQDANreSTEI+d7fAAAAAElFTkSuQmCC";

export type GrabControlBarProps = {
  dragHandlePanHandlers?: GestureResponderHandlers;
  isSessionEnabled: boolean;
  isVisible: boolean;
  onHidden?: () => void;
  onPressHide: () => void;
  onPressSelect: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export const GrabControlBar = ({
  dragHandlePanHandlers,
  isSessionEnabled,
  isVisible,
  onHidden,
  onPressHide,
  onPressSelect,
  containerStyle,
  style,
}: GrabControlBarProps) => {
  const [isRendered, setIsRendered] = useState(isVisible);
  const visibilityProgress = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
    }

    Animated.timing(visibilityProgress, {
      toValue: isVisible ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isVisible) {
        setIsRendered(false);
        onHidden?.();
      }
    });
  }, [isVisible, onHidden, visibilityProgress]);

  const containerAnimatedStyle = useMemo(
    () => ({
      opacity: visibilityProgress,
      transform: [
        {
          translateY: visibilityProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [-10, 0],
          }),
        },
        {
          scale: visibilityProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1],
          }),
        },
      ],
    }),
    [visibilityProgress],
  );

  if (!isRendered) {
    return null;
  }

  return (
    <Animated.View pointerEvents={isVisible ? "auto" : "none"} style={containerStyle}>
      <Animated.View style={containerAnimatedStyle}>
        <Animated.View style={[styles.container, style]}>
          <View style={styles.content}>
            <View
              accessibilityHint="Drag to reposition the React Native Grab controls."
              accessibilityLabel="Move controls"
              accessibilityRole="adjustable"
              style={styles.slot}
              {...dragHandlePanHandlers}
            >
              <Image source={{ uri: DRAG_ICON_IMAGE_URL }} style={styles.dragIcon} />
            </View>

            <View style={styles.divider} />

            <Pressable
              accessibilityHint="Starts selecting an element to copy its description."
              accessibilityLabel="Select element"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onPressSelect}
              style={({ pressed }) => [styles.slot, pressed && styles.pressedButton]}
            >
              <Image
                source={{ uri: INSPECT_ICON_IMAGE_URL }}
                style={[styles.inspectIcon, isSessionEnabled && styles.inspectIconActive]}
              />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              accessibilityHint="Hides the React Native Grab controls."
              accessibilityLabel="Hide controls"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onPressHide}
              style={({ pressed }) => [styles.slot, pressed && styles.pressedButton]}
            >
              <Image source={{ uri: HIDE_ICON_IMAGE_URL }} style={styles.arrowIcon} />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BAR_HEIGHT,
    width: BAR_WIDTH,
    borderRadius: BAR_HEIGHT / 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    flex: 1,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  slot: {
    width: SLOT_WIDTH,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: "rgba(17, 17, 17, 0.14)",
  },
  pressedButton: {
    backgroundColor: "rgba(17, 17, 17, 0.08)",
  },
  dragIcon: {
    width: 12,
    height: 12,
  },
  inspectIcon: {
    width: 16,
    height: 16,
  },
  inspectIconActive: {
    opacity: 0.72,
  },
  arrowIcon: {
    width: 16,
    height: 16,
  },
});
