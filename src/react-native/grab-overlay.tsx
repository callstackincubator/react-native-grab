import { useCallback, useEffect, useRef, useState } from "react";
import { NativeTouchEvent, PanResponder, StyleSheet, Text, View } from "react-native";
import { getAppRootShadowNode, getFocusedScreenShadowNode } from "./containers";
import { findNodeAtPoint, measureInWindow } from "./measure";
import type { BoundingClientRect, ReactNativeFiberNode } from "./types";
import { useDevMenu } from "./dev-menu";
import { getDescription } from "./description";
import { copyViaMetro } from "./copy";
import { FullScreenOverlay } from "./full-screen-overlay";
import { setEnableGrabbingHandler } from "./grab-controller";

type GrabResult = {
  fiberNode: ReactNativeFiberNode;
  rect: BoundingClientRect;
};

const COPY_BADGE_DURATION_MS = 1600;
const CALLSTACK_PRIMARY = "#8232FF";
const HIGHLIGHT_FILL = "rgba(130, 50, 255, 0.2)";
const BADGE_BACKGROUND = "rgba(130, 50, 255, 0.92)";

export const ReactNativeGrabOverlay = () => {
  const copyBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState({
    isSessionEnabled: false,
    grabbedElement: null as GrabResult | null,
    isCopyBadgeVisible: false,
  });

  const startSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      grabbedElement: null,
      isSessionEnabled: true,
    }));
  }, []);

  const stopSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      grabbedElement: null,
      isSessionEnabled: false,
    }));
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
    setEnableGrabbingHandler(startSession);
    return () => {
      setEnableGrabbingHandler(null);
    };
  }, [startSession]);

  useDevMenu(startSession);

  const getElementAtPoint = (
    nativePageX: number,
    nativePageY: number,
  ): { fiberNode: ReactNativeFiberNode; rect: BoundingClientRect } | null => {
    const appRootShadowNode = getAppRootShadowNode();
    const focusedScreenShadowNode = getFocusedScreenShadowNode();

    const appRootBoundingClientRect = measureInWindow(appRootShadowNode);
    const focusedScreenBoundingClientRect = measureInWindow(focusedScreenShadowNode);

    let focusedScreenOffsetY = focusedScreenBoundingClientRect[1];
    let focusedScreenHeight = focusedScreenBoundingClientRect[3];
    let appRootHeight = appRootBoundingClientRect[3];

    const offset = appRootHeight - focusedScreenHeight - focusedScreenOffsetY;
    const pageX = nativePageX;
    const pageY = nativePageY - (appRootHeight - focusedScreenHeight);

    const internalNode = findNodeAtPoint(focusedScreenShadowNode, pageX, pageY);
    const shadowNode = internalNode?.stateNode?.node;

    if (!shadowNode) {
      return null;
    }

    const rect = nativeFabricUIManager.getBoundingClientRect(shadowNode, true);
    return { fiberNode: internalNode, rect: [rect[0], rect[1] + offset, rect[2], rect[3]] };
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
    const description = await getDescription(result.fiberNode);
    console.log("[react-native-grab] Description:", description);
    await copyViaMetro(description);
  };

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
            showCopiedBadge();
          } catch {
            console.error(
              "[react-native-grab] Copying failed. Ensure your Metro config is wrapped with withReactNativeGrab(...) and Metro has been restarted.",
            );
          } finally {
            stopSession();
          }
        })();
      },
    }),
  ).current;

  return (
    <FullScreenOverlay>
      <View pointerEvents="box-none" style={styles.overlayRoot}>
        {state.isSessionEnabled && (
          <View style={[StyleSheet.absoluteFill]} {...panResponder.panHandlers} />
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
      </View>
    </FullScreenOverlay>
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
    backgroundColor: BADGE_BACKGROUND,
  },
  topBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
