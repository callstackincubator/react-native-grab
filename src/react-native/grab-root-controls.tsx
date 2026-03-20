import { useCallback, useMemo, useRef } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, View } from "react-native";
import { useDevMenu } from "./dev-menu";
import { FullScreenOverlay } from "./full-screen-overlay";
import { enableGrabbing, toggleGrabMenu, useGrabControllerState } from "./grab-controller";
import { GrabControlBar } from "./grab-control-bar";

const BAR_HEIGHT = 36;
const BAR_WIDTH = 108;
const INITIAL_BAR_POSITION = {
  x: (Dimensions.get("window").width - BAR_WIDTH) / 2,
  y: 72,
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const ReactNativeGrabRootControls = () => {
  const state = useGrabControllerState();
  const controlBarPosition = useRef(new Animated.ValueXY(INITIAL_BAR_POSITION)).current;
  const shouldResetControlBarPositionRef = useRef(false);

  const isControlBarVisible =
    state.isMenuVisible && state.selectionSessionOwnerId === null && state.selectedOwnerId === null;

  const toggleMenuVisibility = useCallback(() => {
    shouldResetControlBarPositionRef.current = state.isMenuVisible;
    toggleGrabMenu();
  }, [state.isMenuVisible]);

  const resetControlBarPosition = useCallback(() => {
    if (!shouldResetControlBarPositionRef.current) {
      return;
    }

    shouldResetControlBarPositionRef.current = false;
    controlBarPosition.setValue(INITIAL_BAR_POSITION);
  }, [controlBarPosition]);

  useDevMenu(toggleMenuVisibility);

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
    <FullScreenOverlay>
      <View pointerEvents="box-none" style={styles.overlayRoot}>
        <GrabControlBar
          containerStyle={containerStyle}
          dragHandlePanHandlers={dragHandlePanResponder.panHandlers}
          isSessionEnabled={state.selectionSessionOwnerId !== null}
          isVisible={isControlBarVisible}
          onHidden={resetControlBarPosition}
          onPressHide={toggleMenuVisibility}
          onPressSelect={enableGrabbing}
        />
      </View>
    </FullScreenOverlay>
  );
};

const styles = StyleSheet.create({
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
