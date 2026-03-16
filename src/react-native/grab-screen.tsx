import { useCallback, useRef } from "react";
import { View, type ViewProps } from "react-native";
import { setFocusedScreenRef } from "./containers";
import { getFocusEffect } from "./focus-effect";

const useFocusEffect = getFocusEffect();

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
