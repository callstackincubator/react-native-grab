import { useCallback } from "react";
import { type ViewProps } from "react-native";
import { clearGrabSelectionOwnerFocus, setGrabSelectionOwnerFocused } from "./containers";
import { getFocusEffect } from "./focus-effect";
import {
  grabSelectionOwnerFillStyle,
  GrabSelectionOwnerView,
  useGrabSelectionOwner,
} from "./grab-selection-owner";

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
  const { ownerId, ownerRef } = useGrabSelectionOwner("screen", id);

  useFocusEffect(
    useCallback(() => {
      setGrabSelectionOwnerFocused(ownerId, true);
      return () => {
        clearGrabSelectionOwnerFocus(ownerId);
      };
    }, [ownerId]),
  );

  return (
    <GrabSelectionOwnerView
      {...props}
      ownerId={ownerId}
      ownerRef={ownerRef}
      style={[grabSelectionOwnerFillStyle, style]}
    >
      {children}
    </GrabSelectionOwnerView>
  );
};
