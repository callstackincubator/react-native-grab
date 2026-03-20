import { useEffect, useRef, useState } from "react";
import { View, ViewProps, type GestureResponderHandlers } from "react-native";
import {
  createGrabSelectionOwnerId,
  registerGrabSelectionOwner,
  unregisterGrabSelectionOwner,
} from "./containers";
import { ReactNativeGrabOverlay } from "./grab-overlay";
import { ReactNativeGrabRootControls } from "./grab-root-controls";

export type ReactNativeGrabRootProps = ViewProps;

export const ReactNativeGrabRoot = ({ children, style, ...props }: ReactNativeGrabRootProps) => {
  const rootRef = useRef<View | null>(null);
  const ownerIdRef = useRef(createGrabSelectionOwnerId("root"));
  const [panHandlers, setPanHandlers] = useState<GestureResponderHandlers | null>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    registerGrabSelectionOwner(ownerIdRef.current, "root", rootRef.current);
    return () => {
      unregisterGrabSelectionOwner(ownerIdRef.current);
    };
  }, []);

  return (
    <>
      <View
        {...props}
        {...(panHandlers ?? {})}
        collapsable={false}
        ref={rootRef}
        style={[{ flex: 1 }, style]}
      >
        {children}
        <ReactNativeGrabOverlay ownerId={ownerIdRef.current} onPanHandlersChange={setPanHandlers} />
      </View>

      <ReactNativeGrabRootControls />
    </>
  );
};
