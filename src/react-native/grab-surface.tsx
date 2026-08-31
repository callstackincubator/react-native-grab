import { useEffect } from "react";
import type { ViewProps } from "react-native";
import { setGrabSelectionOwnerActive } from "./containers";
import { GrabSelectionOwnerView, useGrabSelectionOwner } from "./grab-selection-owner";

export type ReactNativeGrabSurfaceProps = ViewProps & {
  active: boolean;
};

export const ReactNativeGrabSurface = ({
  active,
  children,
  style,
  ...props
}: ReactNativeGrabSurfaceProps) => {
  const { ownerId, ownerRef } = useGrabSelectionOwner("surface");

  useEffect(() => {
    if (!active) {
      return;
    }

    setGrabSelectionOwnerActive(ownerId, true);
    return () => {
      setGrabSelectionOwnerActive(ownerId, false);
    };
  }, [active, ownerId]);

  return (
    <GrabSelectionOwnerView {...props} ownerId={ownerId} ownerRef={ownerRef} style={style}>
      {children}
    </GrabSelectionOwnerView>
  );
};
