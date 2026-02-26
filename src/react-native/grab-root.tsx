import { useEffect, useRef } from "react";
import { View, ViewProps } from "react-native";
import { setAppRootRef } from "./containers";
import { ReactNativeGrabOverlay } from "./grab-overlay";

export type ReactNativeGrabRootProps = ViewProps;

export const ReactNativeGrabRoot = ({ children, style, ...props }: ReactNativeGrabRootProps) => {
  const rootRef = useRef<View | null>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    setAppRootRef(rootRef.current);
  }, []);

  return (
    <>
      <View {...props} ref={rootRef} style={[{ flex: 1 }, style]}>
        {children}
      </View>

      <ReactNativeGrabOverlay />
    </>
  );
};
