import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";

const SCREEN_EDGE_MARGIN = 8;

export type ContextMenuAnchor = {
  x: number;
  y: number;
};

export type ContextMenuCutout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ContextMenuBounds = {
  width: number;
  height: number;
};

export type ContextMenuHorizontalAlignment = "left" | "center" | "right";
export type ContextMenuVerticalAlignment = "top" | "center" | "bottom";
export type ContextMenuOffset = {
  x: number;
  y: number;
};

type ContextMenuContextValue = {
  onClose: () => void;
};

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export type ContextMenuProps = {
  anchor: ContextMenuAnchor | null;
  bounds?: ContextMenuBounds | null;
  children?: ReactNode;
  cutout?: ContextMenuCutout | null;
  horizontalAlignment?: ContextMenuHorizontalAlignment;
  offset?: ContextMenuOffset;
  onClose: () => void;
  verticalAlignment?: ContextMenuVerticalAlignment;
  visible: boolean;
};

export type ContextMenuItemProps = {
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const getAlignedLeft = (
  anchorX: number,
  menuWidth: number,
  horizontalAlignment: ContextMenuHorizontalAlignment,
) => {
  switch (horizontalAlignment) {
    case "left":
      return anchorX;
    case "right":
      return anchorX - menuWidth;
    case "center":
    default:
      return anchorX - menuWidth / 2;
  }
};

const getAlignedTop = (
  anchorY: number,
  menuHeight: number,
  verticalAlignment: ContextMenuVerticalAlignment,
) => {
  switch (verticalAlignment) {
    case "center":
      return anchorY - menuHeight / 2;
    case "bottom":
      return anchorY - menuHeight;
    case "top":
    default:
      return anchorY;
  }
};

const getMenuPosition = (
  anchor: ContextMenuAnchor,
  menuWidth: number,
  menuHeight: number,
  horizontalAlignment: ContextMenuHorizontalAlignment,
  verticalAlignment: ContextMenuVerticalAlignment,
  offset: ContextMenuOffset,
  bounds: ContextMenuBounds | null,
) => {
  const { width: screenWidth, height: screenHeight } = bounds ?? Dimensions.get("window");
  const preferredLeft = getAlignedLeft(anchor.x, menuWidth, horizontalAlignment) + offset.x;
  const preferredTop = getAlignedTop(anchor.y, menuHeight, verticalAlignment) + offset.y;

  return {
    left: Math.min(
      Math.max(SCREEN_EDGE_MARGIN, preferredLeft),
      screenWidth - menuWidth - SCREEN_EDGE_MARGIN,
    ),
    top: Math.min(
      Math.max(SCREEN_EDGE_MARGIN, preferredTop),
      screenHeight - menuHeight - SCREEN_EDGE_MARGIN,
    ),
  };
};

const ContextMenuItem = ({
  children,
  destructive = false,
  disabled = false,
  onPress,
}: ContextMenuItemProps) => {
  const context = useContext(ContextMenuContext);

  if (!context) {
    throw new Error("ContextMenu.Item must be rendered inside ContextMenu.");
  }

  return (
    <Pressable
      accessibilityRole="menuitem"
      disabled={disabled}
      onPress={() => {
        context.onClose();
        onPress();
      }}
      style={({ pressed }) => [
        styles.item,
        pressed && !disabled && styles.itemPressed,
        disabled && styles.itemDisabled,
      ]}
    >
      <Text style={[styles.itemText, destructive && styles.destructiveText]}>{children}</Text>
    </Pressable>
  );
};

export const ContextMenu = ({
  anchor,
  bounds = null,
  children,
  cutout = null,
  horizontalAlignment = "center",
  offset = { x: 0, y: 10 },
  onClose,
  verticalAlignment = "top",
  visible,
}: ContextMenuProps) => {
  const [isRendered, setIsRendered] = useState(visible);
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });
  const [renderedAnchor, setRenderedAnchor] = useState<ContextMenuAnchor | null>(anchor);
  const animation = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
    }

    if (anchor) {
      setRenderedAnchor(anchor);
    }

    Animated.timing(animation, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 140,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setIsRendered(false);
        setRenderedAnchor(null);
      }
    });
  }, [anchor, animation, visible]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    if (width === menuSize.width && height === menuSize.height) {
      return;
    }

    setMenuSize({ width, height });
  };

  const position = useMemo(() => {
    if (!renderedAnchor) {
      return { left: SCREEN_EDGE_MARGIN, top: SCREEN_EDGE_MARGIN };
    }

    return getMenuPosition(
      renderedAnchor,
      menuSize.width,
      menuSize.height,
      horizontalAlignment,
      verticalAlignment,
      offset,
      bounds,
    );
  }, [
    bounds,
    horizontalAlignment,
    menuSize.height,
    menuSize.width,
    offset,
    renderedAnchor,
    verticalAlignment,
  ]);

  const renderedItems = useMemo(
    () => Children.toArray(children).filter((child) => isValidElement(child)),
    [children],
  );

  const dismissalRegions = useMemo(() => {
    const { width: screenWidth, height: screenHeight } = bounds ?? Dimensions.get("window");

    if (!cutout) {
      return [
        {
          key: "full",
          style: StyleSheet.absoluteFillObject,
        },
      ];
    }

    const left = Math.max(0, cutout.x);
    const top = Math.max(0, cutout.y);
    const right = Math.min(screenWidth, cutout.x + cutout.width);
    const bottom = Math.min(screenHeight, cutout.y + cutout.height);

    return [
      {
        key: "top",
        style: {
          position: "absolute" as const,
          top: 0,
          left: 0,
          right: 0,
          height: top,
        },
      },
      {
        key: "left",
        style: {
          position: "absolute" as const,
          top,
          left: 0,
          width: left,
          height: Math.max(0, bottom - top),
        },
      },
      {
        key: "right",
        style: {
          position: "absolute" as const,
          top,
          left: right,
          right: 0,
          height: Math.max(0, bottom - top),
        },
      },
      {
        key: "bottom",
        style: {
          position: "absolute" as const,
          top: bottom,
          left: 0,
          right: 0,
          bottom: 0,
        },
      },
    ];
  }, [bounds, cutout]);

  if (!isRendered || !renderedAnchor || renderedItems.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      {dismissalRegions.map((region) => (
        <Pressable
          key={`pressable-${region.key}`}
          accessibilityLabel="Close context menu"
          onPress={onClose}
          style={region.style}
        />
      ))}

      <ContextMenuContext.Provider value={{ onClose }}>
        <Animated.View
          onLayout={handleLayout}
          style={[
            styles.menu,
            position,
            {
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.menuContent}>
            {renderedItems.map((child, index) => (
              <View key={index} style={index > 0 ? styles.itemBorder : undefined}>
                {child}
              </View>
            ))}
          </View>
        </Animated.View>
      </ContextMenuContext.Provider>
    </View>
  );
};

ContextMenu.Item = ContextMenuItem;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  menu: {
    position: "absolute",
    zIndex: 11,
    minWidth: 176,
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  menuContent: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(17, 17, 17, 0.12)",
  },
  itemPressed: {
    backgroundColor: "rgba(17, 17, 17, 0.06)",
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemText: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "500",
  },
  destructiveText: {
    color: "#C43D2F",
  },
});
