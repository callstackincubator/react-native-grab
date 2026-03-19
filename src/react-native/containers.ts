import { useSyncExternalStore } from "react";
import { findNodeHandle, type ReactNativeElement } from "react-native";
import type { ReactNativeShadowNode } from "./types";
import { getFabricUIManager } from "./fabric";

export type GrabSelectionOwnerKind = "root" | "screen";

export type GrabSelectionOwner = {
  id: string;
  kind: GrabSelectionOwnerKind;
  shadowNode: ReactNativeShadowNode;
  registrationOrder: number;
};

type SelectionOwnersStoreSnapshot = {
  owners: Map<string, GrabSelectionOwner>;
  focusedScreenOwnerId: string | null;
};

let ownerIdCounter = 0;
let registrationOrder = 0;
let focusedScreenOwnerId: string | null = null;
const owners = new Map<string, GrabSelectionOwner>();
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): SelectionOwnersStoreSnapshot => ({
  owners: new Map(owners),
  focusedScreenOwnerId,
});

const getOwnerShadowNode = (ref: ReactNativeElement, errorMessage: string) => {
  // @ts-expect-error - findNodeHandle is not typed correctly
  const nativeTag = findNodeHandle(ref);

  if (!nativeTag) {
    throw new Error(errorMessage);
  }

  return getFabricUIManager().findShadowNodeByTag_DEPRECATED(nativeTag);
};

const getFallbackRootOwner = () => {
  const rootOwners = Array.from(owners.values()).filter((owner) => owner.kind === "root");
  rootOwners.sort((left, right) => right.registrationOrder - left.registrationOrder);
  return rootOwners[0] ?? null;
};

export const createGrabSelectionOwnerId = (kind: GrabSelectionOwnerKind) => {
  ownerIdCounter += 1;
  return `react-native-grab-${kind}-${ownerIdCounter}`;
};

export const registerGrabSelectionOwner = (
  id: string,
  kind: GrabSelectionOwnerKind,
  ref: ReactNativeElement,
) => {
  const shadowNode = getOwnerShadowNode(
    ref,
    kind === "root"
      ? "Failed to find native tag for app root"
      : "Failed to find native tag for screen",
  );

  registrationOrder += 1;
  owners.set(id, {
    id,
    kind,
    shadowNode,
    registrationOrder,
  });
  notify();
};

export const unregisterGrabSelectionOwner = (id: string) => {
  const removedOwner = owners.get(id);
  if (!removedOwner) {
    return;
  }

  owners.delete(id);

  if (focusedScreenOwnerId === id) {
    focusedScreenOwnerId = null;
  }

  notify();
};

export const setGrabSelectionOwnerFocused = (id: string, isFocused: boolean) => {
  const owner = owners.get(id);
  if (!owner || owner.kind !== "screen") {
    return;
  }

  if (isFocused) {
    focusedScreenOwnerId = id;
  } else if (focusedScreenOwnerId === id) {
    focusedScreenOwnerId = null;
  }

  notify();
};

export const clearGrabSelectionOwnerFocus = (id: string) => {
  if (focusedScreenOwnerId !== id) {
    return;
  }

  focusedScreenOwnerId = null;
  notify();
};

export const getGrabSelectionOwner = (id: string): GrabSelectionOwner | null => {
  return owners.get(id) ?? null;
};

export const getResolvedGrabSelectionOwner = (): GrabSelectionOwner | null => {
  if (focusedScreenOwnerId) {
    const focusedOwner = owners.get(focusedScreenOwnerId);
    if (focusedOwner) {
      return focusedOwner;
    }
  }

  return getFallbackRootOwner();
};

export const getResolvedGrabSelectionOwnerId = (): string | null => {
  return getResolvedGrabSelectionOwner()?.id ?? null;
};

export const useResolvedGrabSelectionOwnerId = () => {
  return useSyncExternalStore(
    subscribe,
    () => getResolvedGrabSelectionOwnerId(),
    () => null,
  );
};

export const useIsResolvedGrabSelectionOwner = (id: string) => {
  return useSyncExternalStore(
    subscribe,
    () => getResolvedGrabSelectionOwnerId() === id,
    () => false,
  );
};

export const useSelectionOwnersStore = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
