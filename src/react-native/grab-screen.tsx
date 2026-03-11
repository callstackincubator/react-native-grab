import { useCallback, useEffect, useRef } from "react";
import { View, type ViewProps } from "react-native";
import { setFocusedScreenRef } from "./containers";

const getFocusEffectImpl = (): ((cb: () => void) => void) => {
  try {
    return require("expo-router").useFocusEffect;
  } catch {
    // Nothing we can do about it, it's not installed in the project.
  }

  try {
    return require("@react-navigation/native").useFocusEffect;
  } catch {
    // Nothing we can do about it, it's not installed in the project.
  }

  // No supported router found — fall back to useEffect
  return (cb: () => void) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const cleanup = cb();
      return typeof cleanup === "function" ? cleanup : undefined;
    }, [cb]);
  };
};

const useFocusEffect = getFocusEffectImpl();

export type ReactNativeGrabScreenProps = ViewProps;

export const ReactNativeGrabScreen = ({
  children,
  style,
  ...props
}: ReactNativeGrabScreenProps) => {
  const screenRef = useRef<View | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!screenRef.current) {
        return;
      }

      setFocusedScreenRef(screenRef.current);
    }, []),
  );

  return (
    <View {...props} ref={screenRef} style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};
