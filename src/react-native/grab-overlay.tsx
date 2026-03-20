import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeTouchEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderHandlers,
} from "react-native";
import { getGrabSelectionOwner, useIsResolvedGrabSelectionOwner } from "./containers";
import { copyViaMetro } from "./copy";
import { ContextMenu } from "./context-menu";
import { GRAB_BADGE_BACKGROUND, GRAB_HIGHLIGHT_FILL, GRAB_PRIMARY } from "./grab-colors";
import {
  clearGrabOwnerPresentation,
  hideGrabSelectionMenu,
  registerLocalGrabSelectionController,
  setGrabSelectionSessionOwner,
  showGrabSelectionMenu,
  unregisterLocalGrabSelectionController,
} from "./grab-controller";
import { getDescription } from "./description";
import { getRenderedBy, type RenderedByFrame } from "./get-rendered-by";
import { findNodeAtPoint, measureInWindow } from "./measure";
import { openStackFrameInEditor } from "./open";
import type { BoundingClientRect, ReactNativeFiberNode } from "./types";

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

export type ReactNativeGrabOverlayProps = {
  ownerId: string;
  onPanHandlersChange?: (panHandlers: GestureResponderHandlers | null) => void;
};

export const ReactNativeGrabOverlay = ({
  ownerId,
  onPanHandlersChange,
}: ReactNativeGrabOverlayProps) => {
  const isResolvedSelectionOwner = useIsResolvedGrabSelectionOwner(ownerId);
  const copyBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [state, setState] = useState({
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
      grabbedElement: null,
    }));
  }, []);

  const closeSelectedElementMenu = useCallback(() => {
    hideGrabSelectionMenu(ownerId);
    setState((prev) => {
      return {
        ...prev,
        selectedElement: null,
        grabbedElement: null,
      };
    });
  }, [ownerId]);

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

  useEffect(() => {
    if (isResolvedSelectionOwner) {
      return;
    }

    clearGrabOwnerPresentation(ownerId);
    setState((prev) => {
      if (!prev.isSessionEnabled && !prev.grabbedElement && !prev.selectedElement) {
        return prev;
      }

      return {
        ...prev,
        isSessionEnabled: false,
        grabbedElement: null,
        selectedElement: null,
      };
    });
  }, [isResolvedSelectionOwner, ownerId]);

  const getElementAtPoint = (
    pageX: number,
    pageY: number,
  ): { fiberNode: ReactNativeFiberNode; rect: BoundingClientRect } | null => {
    const owner = getGrabSelectionOwner(ownerId);
    if (!owner) {
      return null;
    }

    const internalNode = findNodeAtPoint(owner.shadowNode, pageX, pageY);
    const shadowNode = internalNode?.stateNode?.node;

    if (!shadowNode) {
      return null;
    }

    const ownerRect = measureInWindow(owner.shadowNode);
    const rect = nativeFabricUIManager.getBoundingClientRect(shadowNode, true);
    return {
      fiberNode: internalNode,
      rect: [rect[0] - ownerRect[0], rect[1] - ownerRect[1], rect[2], rect[3]],
    };
  };

  const handleTouch = (nativeEvent: NativeTouchEvent) => {
    const result = getElementAtPoint(nativeEvent.pageX, nativeEvent.pageY);

    if (!result) {
      updateGrabbedElement(null);
      return null;
    }

    updateGrabbedElement(result);
  };

  const handleGrabbing = useCallback(
    async (result: GrabResult): Promise<void> => {
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
      showGrabSelectionMenu(ownerId);
    },
    [ownerId],
  );

  useEffect(() => {
    registerLocalGrabSelectionController(ownerId, {
      closeSelectionMenu: () => {
        closeSelectedElementMenu();
      },
      startSelection: startSession,
      stopSelection: () => {
        closeSelectedElementMenu();
        stopSession();
      },
    });

    return () => {
      unregisterLocalGrabSelectionController(ownerId);
    };
  }, [closeSelectedElementMenu, ownerId, startSession, stopSession]);

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
            setGrabSelectionSessionOwner(null);
            stopSession();
          }
        })();
      },
    }),
  ).current;

  useEffect(() => {
    onPanHandlersChange?.(state.isSessionEnabled ? panResponder.panHandlers : null);
    return () => {
      onPanHandlersChange?.(null);
    };
  }, [onPanHandlersChange, panResponder.panHandlers, state.isSessionEnabled]);

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

  const highlightedElement = state.grabbedElement ?? state.selectedElement?.result ?? null;

  if (
    !state.isSessionEnabled &&
    !state.isCopyBadgeVisible &&
    !state.grabbedElement &&
    !state.selectedElement
  ) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={styles.overlayRoot}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setBounds((prev) => {
          if (prev.width === width && prev.height === height) {
            return prev;
          }

          return { width, height };
        });
      }}
    >
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

      {!!highlightedElement && (
        <View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              left: highlightedElement.rect[0],
              top: highlightedElement.rect[1],
              width: highlightedElement.rect[2],
              height: highlightedElement.rect[3],
            },
          ]}
        />
      )}

      <ContextMenu
        anchor={selectedElementMenuAnchor}
        bounds={bounds}
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
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  topBadge: {
    position: "absolute",
    top: 52,
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: GRAB_BADGE_BACKGROUND,
  },
  topBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  highlight: {
    position: "absolute",
    backgroundColor: GRAB_HIGHLIGHT_FILL,
    borderWidth: 1,
    borderColor: GRAB_PRIMARY,
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
