import type { ViewProps } from "react-native";
import { ReactNativeGrabRootControls } from "./grab-root-controls";
import {
  grabSelectionOwnerFillStyle,
  GrabSelectionOwnerView,
  useGrabSelectionOwner,
} from "./grab-selection-owner";

export type ReactNativeGrabRootProps = ViewProps;

export const ReactNativeGrabRoot = ({ children, style, ...props }: ReactNativeGrabRootProps) => {
  const { ownerId, ownerRef } = useGrabSelectionOwner("root");

  return (
    <>
      <GrabSelectionOwnerView
        {...props}
        ownerId={ownerId}
        ownerRef={ownerRef}
        style={[grabSelectionOwnerFillStyle, style]}
      >
        {children}
      </GrabSelectionOwnerView>

      <ReactNativeGrabRootControls />
    </>
  );
};
