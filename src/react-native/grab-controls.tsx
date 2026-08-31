import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { FullScreenOverlay } from "./full-screen-overlay";
import { enableGrabbing, toggleGrabMenu, useGrabControllerState } from "./grab-controller";
import { GrabControlBar } from "./grab-control-bar";

const BAR_HEIGHT = 36;
const BAR_WIDTH = 108;
const BAR_TOP_INSET = 72;

type ControlsBounds = {
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const getInitialBarPosition = (bounds: ControlsBounds) => {
  return {
    x: clamp((bounds.width - BAR_WIDTH) / 2, 0, Math.max(0, bounds.width - BAR_WIDTH)),
    y: clamp(BAR_TOP_INSET, 0, Math.max(0, bounds.height - BAR_HEIGHT)),
  };
};

/**
 * Rendered by the owner that currently resolves selection, so the controls live in
 * the same native window as the content they act on. A natively presented surface
 * gets its own window, and no z-index inside the main window can paint over it -
 * on iOS `FullScreenOverlay` lifts the bar above every window, but Android has no
 * equivalent, which left the bar stranded behind presented sheets.
 *
 * The bar is placed against the measured size of its container rather than the
 * window's, since that container is a sheet rather than the whole screen whenever
 * a surface owns selection.
 */
export const GrabOwnerControls = () => {
  const state = useGrabControllerState();
  const controlBarPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const boundsRef = useRef<ControlsBounds | null>(null);
  const [hasBounds, setHasBounds] = useState(false);
  const shouldResetControlBarPositionRef = useRef(false);

  const isControlBarVisible =
    hasBounds &&
    state.isMenuVisible &&
    state.selectionSessionOwnerId === null &&
    state.selectedOwnerId === null;

  // Hiding the controls returns them to their initial spot the next time they are
  // shown; pausing them for a selection session deliberately does not.
  useEffect(() => {
    if (!state.isMenuVisible) {
      shouldResetControlBarPositionRef.current = true;
    }
  }, [state.isMenuVisible]);

  const clampControlBarToBounds = useCallback(() => {
    controlBarPosition.flattenOffset();
    controlBarPosition.stopAnimation((value) => {
      const bounds = boundsRef.current;
      if (!bounds) {
        return;
      }

      controlBarPosition.setValue({
        x: clamp(value.x, 0, Math.max(0, bounds.width - BAR_WIDTH)),
        y: clamp(value.y, 0, Math.max(0, bounds.height - BAR_HEIGHT)),
      });
    });
  }, [controlBarPosition]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      const previousBounds = boundsRef.current;

      if (previousBounds?.width === width && previousBounds.height === height) {
        return;
      }

      boundsRef.current = { width, height };

      if (!previousBounds) {
        controlBarPosition.setValue(getInitialBarPosition(boundsRef.current));
        setHasBounds(true);
        return;
      }

      clampControlBarToBounds();
    },
    [clampControlBarToBounds, controlBarPosition],
  );

  const resetControlBarPosition = useCallback(() => {
    const bounds = boundsRef.current;
    if (!shouldResetControlBarPositionRef.current || !bounds) {
      return;
    }

    shouldResetControlBarPositionRef.current = false;
    controlBarPosition.setValue(getInitialBarPosition(bounds));
  }, [controlBarPosition]);

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
      onPanResponderRelease: () => clampControlBarToBounds(),
      onPanResponderTerminate: () => clampControlBarToBounds(),
    }),
  ).current;

  const containerStyle = useMemo(
    () => [
      styles.controlBar,
      {
        transform: controlBarPosition.getTranslateTransform(),
      },
    ],
    [controlBarPosition],
  );

  return (
    // The anchor is absolutely positioned so that mounting the controls inside an
    // owner cannot disturb its layout: an owner is free to be a `gap`-spaced flex
    // container, and absolutely positioned children are not flex items.
    <View pointerEvents="box-none" style={styles.overlayAnchor}>
      <FullScreenOverlay>
        {/* Measured rather than the anchor, because `FullScreenOverlay` lifts this
            out to window size on iOS while it stays owner-sized elsewhere. */}
        <View pointerEvents="box-none" style={styles.overlayRoot} onLayout={handleLayout}>
          <GrabControlBar
            containerStyle={containerStyle}
            dragHandlePanHandlers={dragHandlePanResponder.panHandlers}
            isSessionEnabled={state.selectionSessionOwnerId !== null}
            isVisible={isControlBarVisible}
            onHidden={resetControlBarPosition}
            onPressHide={toggleGrabMenu}
            onPressSelect={enableGrabbing}
          />
        </View>
      </FullScreenOverlay>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayAnchor: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  controlBar: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
  },
});
