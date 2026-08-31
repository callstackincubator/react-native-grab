import { useSyncExternalStore } from "react";
import { findNodeHandle, type ReactNativeElement } from "react-native";
import type { ReactNativeShadowNode } from "./types";
import { getFabricUIManager } from "./fabric";

export type GrabSelectionOwnerKind = "root" | "screen" | "surface";

export type GrabSelectionOwner = {
  id: string;
  kind: GrabSelectionOwnerKind;
  shadowNode: ReactNativeShadowNode;
  registrationOrder: number;
  activationOrder: number | null;
};

let ownerIdCounter = 0;
let registrationOrder = 0;
let activationOrder = 0;
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

const getOwnerShadowNode = (ref: ReactNativeElement, errorMessage: string) => {
  // @ts-expect-error - findNodeHandle is not typed correctly
  const nativeTag = findNodeHandle(ref);

  if (!nativeTag) {
    throw new Error(errorMessage);
  }

  return getFabricUIManager().findShadowNodeByTag_DEPRECATED(nativeTag);
};

const ownerNativeTagErrorMessages: Record<GrabSelectionOwnerKind, string> = {
  root: "Failed to find native tag for app root",
  screen: "Failed to find native tag for screen",
  surface: "Failed to find native tag for native surface",
};

const getFallbackRootOwner = () => {
  const rootOwners = Array.from(owners.values()).filter((owner) => owner.kind === "root");
  rootOwners.sort((left, right) => right.registrationOrder - left.registrationOrder);
  return rootOwners[0] ?? null;
};

const getActiveSurfaceOwner = () => {
  let activeSurfaceOwner: GrabSelectionOwner | null = null;
  let highestActivationOrder = -1;

  for (const owner of owners.values()) {
    const order = owner.kind === "surface" ? owner.activationOrder : null;
    if (order !== null && order > highestActivationOrder) {
      activeSurfaceOwner = owner;
      highestActivationOrder = order;
    }
  }

  return activeSurfaceOwner;
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
  const shadowNode = getOwnerShadowNode(ref, ownerNativeTagErrorMessages[kind]);

  registrationOrder += 1;
  owners.set(id, {
    id,
    kind,
    shadowNode,
    registrationOrder,
    activationOrder: null,
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

export const setGrabSelectionOwnerActive = (id: string, isActive: boolean) => {
  const owner = owners.get(id);
  // Re-activating an already active surface deliberately keeps its original
  // activation order, so a redundant render cannot promote a surface above one
  // that was presented on top of it.
  if (!owner || owner.kind !== "surface" || (owner.activationOrder !== null) === isActive) {
    return;
  }

  if (isActive) {
    activationOrder += 1;
  }

  owners.set(id, {
    ...owner,
    activationOrder: isActive ? activationOrder : null,
  });
  notify();
};

export const getGrabSelectionOwner = (id: string): GrabSelectionOwner | null => {
  return owners.get(id) ?? null;
};

export const getResolvedGrabSelectionOwner = (): GrabSelectionOwner | null => {
  const activeSurfaceOwner = getActiveSurfaceOwner();
  if (activeSurfaceOwner) {
    return activeSurfaceOwner;
  }

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

export const useIsResolvedGrabSelectionOwner = (id: string) => {
  return useSyncExternalStore(
    subscribe,
    () => getResolvedGrabSelectionOwnerId() === id,
    () => false,
  );
};
