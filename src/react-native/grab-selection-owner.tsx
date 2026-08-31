import { useEffect, useRef, useState, type RefObject } from "react";
import { View, type GestureResponderHandlers, type ViewProps } from "react-native";
import {
  createGrabSelectionOwnerId,
  registerGrabSelectionOwner,
  unregisterGrabSelectionOwner,
  useIsResolvedGrabSelectionOwner,
  type GrabSelectionOwnerKind,
} from "./containers";
import { GrabOwnerControls } from "./grab-controls";
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
  // The controls belong to whichever owner resolves selection, so that they are
  // rendered in the same native window as the content they act on.
  const isResolvedSelectionOwner = useIsResolvedGrabSelectionOwner(ownerId);

  return (
    <>
      <View {...props} {...(panHandlers ?? {})} collapsable={false} ref={ownerRef}>
        {children}
        <ReactNativeGrabOverlay ownerId={ownerId} onPanHandlersChange={setPanHandlers} />
      </View>

      {/*
        A sibling of the registered view rather than a child of it: `findNodeAtPoint`
        walks the owner's shadow subtree and skips a node only when its `pointerEvents`
        makes it untargetable. The controls cannot rely on that - on iOS they are hosted
        by `FullWindowOverlay`, a full-screen native node that takes no `pointerEvents`
        prop - so a controls subtree inside the owner swallows every hit test and
        resolves each grab to the owner itself.
      */}
      {isResolvedSelectionOwner && <GrabOwnerControls />}
    </>
  );
};
