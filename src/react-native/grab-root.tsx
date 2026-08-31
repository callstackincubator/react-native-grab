import type { ViewProps } from "react-native";
import { useDevMenu } from "./dev-menu";
import { toggleGrabMenu } from "./grab-controller";
import {
  grabSelectionOwnerFillStyle,
  GrabSelectionOwnerView,
  useGrabSelectionOwner,
} from "./grab-selection-owner";

export type ReactNativeGrabRootProps = ViewProps;

export const ReactNativeGrabRoot = ({ children, style, ...props }: ReactNativeGrabRootProps) => {
  const { ownerId, ownerRef } = useGrabSelectionOwner("root");

  // Registered from the root rather than from the resolved owner: the dev menu
  // item has to outlive selection moving between owners.
  useDevMenu(toggleGrabMenu);

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
