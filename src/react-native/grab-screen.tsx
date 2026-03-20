import { useCallback, useEffect, useRef, useState } from "react";
import { View, type GestureResponderHandlers, type ViewProps } from "react-native";
import {
  clearGrabSelectionOwnerFocus,
  createGrabSelectionOwnerId,
  registerGrabSelectionOwner,
  setGrabSelectionOwnerFocused,
  unregisterGrabSelectionOwner,
} from "./containers";
import { getFocusEffect } from "./focus-effect";
import { ReactNativeGrabOverlay } from "./grab-overlay";

const useFocusEffect = getFocusEffect();

export type ReactNativeGrabScreenProps = ViewProps & {
  id?: string;
};

export const ReactNativeGrabScreen = ({
  children,
  style,
  id,
  ...props
}: ReactNativeGrabScreenProps) => {
  const screenRef = useRef<View | null>(null);
  const ownerIdRef = useRef(id ?? createGrabSelectionOwnerId("screen"));
  const [panHandlers, setPanHandlers] = useState<GestureResponderHandlers | null>(null);

  useEffect(() => {
    if (!screenRef.current) {
      return;
    }

    registerGrabSelectionOwner(ownerIdRef.current, "screen", screenRef.current);
    return () => {
      unregisterGrabSelectionOwner(ownerIdRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!screenRef.current) {
        return;
      }

      setGrabSelectionOwnerFocused(ownerIdRef.current, true);
      return () => {
        clearGrabSelectionOwnerFocus(ownerIdRef.current);
      };
    }, []),
  );

  return (
    <View
      {...props}
      {...(panHandlers ?? {})}
      collapsable={false}
      ref={screenRef}
      style={[{ flex: 1 }, style]}
    >
      {children}
      <ReactNativeGrabOverlay ownerId={ownerIdRef.current} onPanHandlersChange={setPanHandlers} />
    </View>
  );
};
