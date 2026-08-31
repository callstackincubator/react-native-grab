import { useEffect, useRef, useState, type RefObject } from "react";
import { View, type GestureResponderHandlers, type ViewProps } from "react-native";
import {
  createGrabSelectionOwnerId,
  registerGrabSelectionOwner,
  unregisterGrabSelectionOwner,
  type GrabSelectionOwnerKind,
} from "./containers";
import { ReactNativeGrabOverlay } from "./grab-overlay";

/** Root and screen owners always fill their parent; surfaces are sized by their host. */
export const grabSelectionOwnerFillStyle = { flex: 1 } as const;

export const useGrabSelectionOwner = (kind: GrabSelectionOwnerKind, id?: string) => {
  const ownerRef = useRef<View | null>(null);
  const ownerIdRef = useRef(id ?? createGrabSelectionOwnerId(kind));

  useEffect(() => {
    const ownerId = ownerIdRef.current;

    if (!ownerRef.current) {
      console.error(
        `[react-native-grab] Failed to register ${kind} selection owner: the view ref was never attached. Elements inside it cannot be grabbed.`,
      );
      return;
    }

    registerGrabSelectionOwner(ownerId, kind, ownerRef.current);
    return () => {
      unregisterGrabSelectionOwner(ownerId);
    };
  }, [kind]);

  return { ownerId: ownerIdRef.current, ownerRef };
};

type GrabSelectionOwnerViewProps = ViewProps & {
  ownerId: string;
  ownerRef: RefObject<View | null>;
};

export const GrabSelectionOwnerView = ({
  children,
  ownerId,
  ownerRef,
  ...props
}: GrabSelectionOwnerViewProps) => {
  const [panHandlers, setPanHandlers] = useState<GestureResponderHandlers | null>(null);

  return (
    <View {...props} {...(panHandlers ?? {})} collapsable={false} ref={ownerRef}>
      {children}
      <ReactNativeGrabOverlay ownerId={ownerId} onPanHandlersChange={setPanHandlers} />
    </View>
  );
};
