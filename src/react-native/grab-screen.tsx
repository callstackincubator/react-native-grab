import { useCallback } from "react";
import { type ViewProps } from "react-native";
import { clearGrabSelectionOwnerFocus, setGrabSelectionOwnerFocused } from "./containers";
import { getFocusEffect } from "./focus-effect";
import { GrabSelectionOwnerView, useGrabSelectionOwner } from "./grab-selection-owner";

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
      if (!ownerRef.current) {
        return;
      }

      setGrabSelectionOwnerFocused(ownerId, true);
      return () => {
        clearGrabSelectionOwnerFocus(ownerId);
      };
    }, [ownerId, ownerRef]),
  );

  return (
    <GrabSelectionOwnerView {...props} fill ownerId={ownerId} ownerRef={ownerRef} style={style}>
      {children}
    </GrabSelectionOwnerView>
  );
};
