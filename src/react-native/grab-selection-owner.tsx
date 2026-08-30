import { useEffect, useRef, useState, type RefObject } from "react";
import { View, type GestureResponderHandlers, type ViewProps } from "react-native";
import {
  createGrabSelectionOwnerId,
  registerGrabSelectionOwner,
  unregisterGrabSelectionOwner,
  type GrabSelectionOwnerKind,
} from "./containers";
import { ReactNativeGrabOverlay } from "./grab-overlay";

export const useGrabSelectionOwner = (kind: GrabSelectionOwnerKind, id?: string) => {
  const ownerRef = useRef<View | null>(null);
  const ownerIdRef = useRef(id ?? createGrabSelectionOwnerId(kind));

  useEffect(() => {
    if (!ownerRef.current) {
      return;
    }

    registerGrabSelectionOwner(ownerIdRef.current, kind, ownerRef.current);
    return () => {
      unregisterGrabSelectionOwner(ownerIdRef.current);
    };
  }, [kind]);

  return { ownerId: ownerIdRef.current, ownerRef };
};

type GrabSelectionOwnerViewProps = ViewProps & {
  fill?: boolean;
  ownerId: string;
  ownerRef: RefObject<View | null>;
};

export const GrabSelectionOwnerView = ({
  children,
  fill = false,
  ownerId,
  ownerRef,
  style,
  ...props
}: GrabSelectionOwnerViewProps) => {
  const [panHandlers, setPanHandlers] = useState<GestureResponderHandlers | null>(null);

  return (
    <View
      {...props}
      {...(panHandlers ?? {})}
      collapsable={false}
      ref={ownerRef}
      style={fill ? [{ flex: 1 }, style] : style}
    >
      {children}
      <ReactNativeGrabOverlay ownerId={ownerId} onPanHandlersChange={setPanHandlers} />
    </View>
  );
};
