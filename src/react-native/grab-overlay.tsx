import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeTouchEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getAppRootShadowNode, getFocusedScreenShadowNode } from "./containers";
import { findNodeAtPoint, measureInWindow } from "./measure";
import type { BoundingClientRect, ReactNativeFiberNode } from "./types";
import { useDevMenu } from "./dev-menu";
import { getDescription } from "./description";
import { copyViaMetro } from "./copy";
import { FullScreenOverlay } from "./full-screen-overlay";
import { setEnableGrabbingHandler, setToggleGrabMenuHandler } from "./grab-controller";
import { GrabControlBar } from "./grab-control-bar";
import { ContextMenu } from "./context-menu";
import { getRenderedBy, type RenderedByFrame } from "./get-rendered-by";
import { openStackFrameInEditor } from "./open";

type GrabResult = {
  fiberNode: ReactNativeFiberNode;
  rect: BoundingClientRect;
};

type SelectedGrabResult = {
  description: string;
  elementName: string;
  frame: RenderedByFrame | null;
  result: GrabResult;
};

const COPY_BADGE_DURATION_MS = 1600;
const CALLSTACK_PRIMARY = "#8232FF";
const HIGHLIGHT_FILL = "rgba(130, 50, 255, 0.2)";
const BADGE_BACKGROUND = "rgba(130, 50, 255, 0.92)";
const BAR_HEIGHT = 36;
const BAR_WIDTH = 108;
const INITIAL_BAR_POSITION = {
  x: (Dimensions.get("window").width - BAR_WIDTH) / 2,
  y: 72,
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const ReactNativeGrabOverlay = () => {
  const copyBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlBarPosition = useRef(new Animated.ValueXY(INITIAL_BAR_POSITION)).current;
  const shouldResetControlBarPositionRef = useRef(false);
  const [state, setState] = useState({
    isMenuVisible: false,
    isSessionEnabled: false,
    grabbedElement: null as GrabResult | null,
    isCopyBadgeVisible: false,
    selectedElement: null as SelectedGrabResult | null,
  });

  const startSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      grabbedElement: null,
      isSessionEnabled: true,
      selectedElement: null,
    }));
  }, []);

  const stopSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSessionEnabled: false,
    }));
  }, []);

  const toggleMenuVisibility = useCallback(() => {
    setState((prev) => {
      shouldResetControlBarPositionRef.current = prev.isMenuVisible;

      return {
        ...prev,
        isMenuVisible: !prev.isMenuVisible,
        isSessionEnabled: !prev.isMenuVisible ? prev.isSessionEnabled : false,
        grabbedElement: !prev.isMenuVisible ? prev.grabbedElement : null,
        selectedElement: !prev.isMenuVisible ? prev.selectedElement : null,
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      if (copyBadgeTimeoutRef.current) {
        clearTimeout(copyBadgeTimeoutRef.current);
      }
    };
  }, []);

  const updateGrabbedElement = useCallback((grabbedElement: GrabResult | null) => {
    setState((prev) => ({
      ...prev,
      grabbedElement,
    }));
  }, []);

  const closeSelectedElementMenu = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedElement: null,
      grabbedElement: null,
    }));
  }, []);

  const showCopiedBadge = useCallback(() => {
    if (copyBadgeTimeoutRef.current) {
      clearTimeout(copyBadgeTimeoutRef.current);
    }

    setState((prev) => ({ ...prev, isCopyBadgeVisible: true }));

    copyBadgeTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, isCopyBadgeVisible: false }));
      copyBadgeTimeoutRef.current = null;
    }, COPY_BADGE_DURATION_MS);
  }, []);

  const resetControlBarPosition = useCallback(() => {
    if (!shouldResetControlBarPositionRef.current) {
      return;
    }

    shouldResetControlBarPositionRef.current = false;
    controlBarPosition.setValue(INITIAL_BAR_POSITION);
  }, [controlBarPosition]);

  useEffect(() => {
    setEnableGrabbingHandler(startSession);
    setToggleGrabMenuHandler(toggleMenuVisibility);
    return () => {
      setEnableGrabbingHandler(null);
      setToggleGrabMenuHandler(null);
    };
  }, [startSession, toggleMenuVisibility]);

  useDevMenu(toggleMenuVisibility);

  const getElementAtPoint = (
    nativePageX: number,
    nativePageY: number,
  ): { fiberNode: ReactNativeFiberNode; rect: BoundingClientRect } | null => {
    const appRootShadowNode = getAppRootShadowNode();
    const focusedScreenShadowNode = getFocusedScreenShadowNode();

    const appRootBoundingClientRect = measureInWindow(appRootShadowNode);
    const focusedScreenBoundingClientRect = measureInWindow(focusedScreenShadowNode);

    const focusedScreenOffsetY = focusedScreenBoundingClientRect[1];
    const focusedScreenHeight = focusedScreenBoundingClientRect[3];
    const appRootHeight = appRootBoundingClientRect[3];
    const appRootOffsetY = appRootBoundingClientRect[1];

    const overlayOffset = Platform.select({
      ios: appRootHeight - focusedScreenHeight - focusedScreenOffsetY,
      android: focusedScreenOffsetY - (appRootOffsetY + focusedScreenOffsetY),
      default: 0,
    });

    const pageOffset = Platform.select({
      ios: focusedScreenHeight - appRootHeight,
      android: appRootOffsetY - focusedScreenOffsetY,
      default: 0,
    });

    const pageX = nativePageX;
    const pageY = nativePageY + pageOffset;

    const internalNode = findNodeAtPoint(focusedScreenShadowNode, pageX, pageY);
    const shadowNode = internalNode?.stateNode?.node;

    if (!shadowNode) {
      return null;
    }

    const rect = nativeFabricUIManager.getBoundingClientRect(shadowNode, true);
    return { fiberNode: internalNode, rect: [rect[0], rect[1] + overlayOffset, rect[2], rect[3]] };
  };

  const handleTouch = (nativeEvent: NativeTouchEvent) => {
    const result = getElementAtPoint(nativeEvent.pageX, nativeEvent.pageY);

    if (!result) {
      updateGrabbedElement(null);
      return null;
    }

    updateGrabbedElement(result);
  };

  const handleGrabbing = async (result: GrabResult): Promise<void> => {
    const [description, renderedBy] = await Promise.all([
      getDescription(result.fiberNode),
      getRenderedBy(result.fiberNode),
    ]);

    const firstFrame = renderedBy.find((frame) => Boolean(frame.file)) ?? null;
    const elementNameMatch = description.match(/<([A-Za-z0-9_$.:-]+)/);
    const elementName = elementNameMatch?.[1] ?? firstFrame?.name ?? "Selected element";

    setState((prev) => ({
      ...prev,
      grabbedElement: result,
      selectedElement: {
        description,
        elementName,
        frame: firstFrame,
        result,
      },
    }));
  };

  const handleCopySelectedElement = useCallback(async () => {
    const selectedElement = state.selectedElement;

    if (!selectedElement) {
      return;
    }

    closeSelectedElementMenu();

    try {
      await copyViaMetro(selectedElement.description);
      showCopiedBadge();
    } catch {
      console.error(
        "[react-native-grab] Copying failed. Ensure your Metro config is wrapped with withReactNativeGrab(...) and Metro has been restarted.",
      );
    }
  }, [closeSelectedElementMenu, showCopiedBadge, state.selectedElement]);

  const handleOpenSelectedElement = useCallback(async () => {
    const frame = state.selectedElement?.frame;

    if (!frame?.file || frame.line == null) {
      return;
    }

    closeSelectedElementMenu();

    try {
      await openStackFrameInEditor({
        file: frame.file,
        lineNumber: frame.line,
      });
    } catch {
      console.error("[react-native-grab] Opening editor failed.");
    }
  }, [closeSelectedElementMenu, state.selectedElement]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent),
      onPanResponderRelease: (evt) => {
        void (async () => {
          try {
            const result = getElementAtPoint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
            if (!result) {
              return;
            }

            await handleGrabbing(result);
          } catch {
            console.error("[react-native-grab] Grabbing failed.");
          } finally {
            stopSession();
          }
        })();
      },
    }),
  ).current;

  const dragHandlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: () => {
        controlBarPosition.stopAnimation((value) => {
          controlBarPosition.setOffset(value);
          controlBarPosition.setValue({ x: 0, y: 0 });
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: controlBarPosition.x, dy: controlBarPosition.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: () => {
        controlBarPosition.flattenOffset();
        controlBarPosition.stopAnimation((value) => {
          const { width, height } = Dimensions.get("window");

          controlBarPosition.setValue({
            x: clamp(value.x, 0, Math.max(0, width - BAR_WIDTH)),
            y: clamp(value.y, 0, Math.max(0, height - BAR_HEIGHT)),
          });
        });
      },
      onPanResponderTerminate: () => {
        controlBarPosition.flattenOffset();
        controlBarPosition.stopAnimation((value) => {
          const { width, height } = Dimensions.get("window");

          controlBarPosition.setValue({
            x: clamp(value.x, 0, Math.max(0, width - BAR_WIDTH)),
            y: clamp(value.y, 0, Math.max(0, height - BAR_HEIGHT)),
          });
        });
      },
    }),
  ).current;

  const selectedElementMenuAnchor = useMemo(() => {
    if (!state.selectedElement) {
      return null;
    }

    const rect = state.selectedElement.result.rect;
    return {
      x: rect[0] + rect[2] / 2,
      y: rect[1] + rect[3],
    };
  }, [state.selectedElement]);

  const isControlBarVisible =
    state.isMenuVisible && !state.isSessionEnabled && state.selectedElement === null;

  return (
    <FullScreenOverlay>
      <View pointerEvents="box-none" style={styles.overlayRoot}>
        {state.isSessionEnabled && (
          <View
            style={[StyleSheet.absoluteFill, styles.sessionCapture]}
            {...panResponder.panHandlers}
          />
        )}

        {state.isSessionEnabled && (
          <View pointerEvents="none" style={styles.topBadge}>
            <Text style={styles.topBadgeText}>Touch and move around to grab</Text>
          </View>
        )}

        {state.isCopyBadgeVisible && (
          <View pointerEvents="none" style={styles.topBadge}>
            <Text style={styles.topBadgeText}>Element copied</Text>
          </View>
        )}

        {!!state.grabbedElement && (
          <View
            style={[
              {
                position: "absolute",
                left: state.grabbedElement.rect[0],
                top: state.grabbedElement.rect[1],
                width: state.grabbedElement.rect[2],
                height: state.grabbedElement.rect[3],
                pointerEvents: "none",
              },
              {
                backgroundColor: HIGHLIGHT_FILL,
                borderWidth: 1,
                borderColor: CALLSTACK_PRIMARY,
              },
            ]}
          />
        )}

        <GrabControlBar
          containerStyle={[
            styles.controlBar,
            {
              transform: controlBarPosition.getTranslateTransform(),
            },
          ]}
          dragHandlePanHandlers={dragHandlePanResponder.panHandlers}
          isSessionEnabled={state.isSessionEnabled}
          isVisible={isControlBarVisible}
          onHidden={resetControlBarPosition}
          onPressHide={toggleMenuVisibility}
          onPressSelect={startSession}
        />

        <ContextMenu
          anchor={selectedElementMenuAnchor}
          cutout={
            state.selectedElement
              ? {
                  x: state.selectedElement.result.rect[0],
                  y: state.selectedElement.result.rect[1],
                  width: state.selectedElement.result.rect[2],
                  height: state.selectedElement.result.rect[3],
                }
              : null
          }
          horizontalAlignment="center"
          offset={{ x: 0, y: 8 }}
          onClose={closeSelectedElementMenu}
          visible={state.selectedElement !== null}
        >
          <View style={styles.selectionMenuHeader}>
            <Text numberOfLines={1} style={styles.selectionMenuTitle}>
              {state.selectedElement?.elementName}
            </Text>
          </View>
          <View style={styles.selectionMenuActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleCopySelectedElement()}
              style={({ pressed }) => [
                styles.selectionMenuActionButton,
                pressed && styles.selectionMenuActionButtonPressed,
              ]}
            >
              <Text style={styles.selectionMenuActionText}>Copy</Text>
            </Pressable>
            <View style={styles.selectionMenuActionDivider} />
            <Pressable
              accessibilityRole="button"
              disabled={!state.selectedElement?.frame?.file}
              onPress={() => void handleOpenSelectedElement()}
              style={({ pressed }) => [
                styles.selectionMenuActionButton,
                pressed &&
                  state.selectedElement?.frame?.file &&
                  styles.selectionMenuActionButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.selectionMenuActionText,
                  !state.selectedElement?.frame?.file && styles.selectionMenuActionTextDisabled,
                ]}
              >
                Open
              </Text>
            </Pressable>
          </View>
        </ContextMenu>
      </View>
    </FullScreenOverlay>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  sessionCapture: {
    zIndex: 1,
  },
  controlBar: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
  },
  topBadge: {
    position: "absolute",
    top: 52,
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: BADGE_BACKGROUND,
  },
  topBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  selectionMenuHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectionMenuTitle: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "600",
  },
  selectionMenuActions: {
    flexDirection: "row",
  },
  selectionMenuActionButton: {
    flex: 1,
  },
  selectionMenuActionButtonPressed: {
    backgroundColor: "rgba(17, 17, 17, 0.06)",
  },
  selectionMenuActionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(17, 17, 17, 0.12)",
  },
  selectionMenuActionText: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111111",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  selectionMenuActionTextDisabled: {
    opacity: 0.4,
  },
});
