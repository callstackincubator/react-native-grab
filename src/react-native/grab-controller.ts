import { useSyncExternalStore } from "react";
import { getResolvedGrabSelectionOwnerId } from "./containers";

type LocalGrabSelectionController = {
  closeSelectionMenu: () => void;
  startSelection: () => void;
  stopSelection: () => void;
};

type GrabControllerState = {
  isMenuVisible: boolean;
  selectedOwnerId: string | null;
  selectionSessionOwnerId: string | null;
};

const localControllers = new Map<string, LocalGrabSelectionController>();
const listeners = new Set<() => void>();

let state: GrabControllerState = {
  isMenuVisible: false,
  selectedOwnerId: null,
  selectionSessionOwnerId: null,
};

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

const setState = (
  updater: GrabControllerState | ((prevState: GrabControllerState) => GrabControllerState),
) => {
  state = typeof updater === "function" ? updater(state) : updater;
  notify();
};

const stopAllSelections = () => {
  for (const controller of localControllers.values()) {
    controller.stopSelection();
    controller.closeSelectionMenu();
  }
};

export const registerLocalGrabSelectionController = (
  ownerId: string,
  controller: LocalGrabSelectionController,
) => {
  localControllers.set(ownerId, controller);
};

export const unregisterLocalGrabSelectionController = (ownerId: string) => {
  localControllers.delete(ownerId);

  setState((prevState) => ({
    ...prevState,
    selectedOwnerId: prevState.selectedOwnerId === ownerId ? null : prevState.selectedOwnerId,
    selectionSessionOwnerId:
      prevState.selectionSessionOwnerId === ownerId ? null : prevState.selectionSessionOwnerId,
  }));
};

export const useGrabControllerState = () => {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
};

export const setGrabSelectionSessionOwner = (ownerId: string | null) => {
  setState((prevState) => ({
    ...prevState,
    selectionSessionOwnerId: ownerId,
  }));
};

export const showGrabSelectionMenu = (ownerId: string) => {
  setState((prevState) => ({
    ...prevState,
    selectedOwnerId: ownerId,
    selectionSessionOwnerId:
      prevState.selectionSessionOwnerId === ownerId ? null : prevState.selectionSessionOwnerId,
  }));
};

export const hideGrabSelectionMenu = (ownerId: string) => {
  setState((prevState) => ({
    ...prevState,
    selectedOwnerId: prevState.selectedOwnerId === ownerId ? null : prevState.selectedOwnerId,
  }));
};

export const clearGrabOwnerPresentation = (ownerId: string) => {
  setState((prevState) => ({
    ...prevState,
    selectedOwnerId: prevState.selectedOwnerId === ownerId ? null : prevState.selectedOwnerId,
    selectionSessionOwnerId:
      prevState.selectionSessionOwnerId === ownerId ? null : prevState.selectionSessionOwnerId,
  }));
};

export const enableGrabbing = () => {
  const ownerId = getResolvedGrabSelectionOwnerId();
  if (!ownerId) {
    console.error(
      "[react-native-grab] Cannot enable grabbing. Ensure ReactNativeGrabRoot is mounted.",
    );
    return;
  }

  const controller = localControllers.get(ownerId);
  if (!controller) {
    console.error(
      "[react-native-grab] Cannot enable grabbing. Ensure the focused ReactNativeGrabScreen is mounted.",
    );
    return;
  }

  stopAllSelections();
  setState((prevState) => ({
    ...prevState,
    selectedOwnerId: null,
    selectionSessionOwnerId: ownerId,
  }));
  controller.startSelection();
};

export const toggleGrabMenu = () => {
  setState((prevState) => {
    const isVisible = !prevState.isMenuVisible;
    if (!isVisible) {
      stopAllSelections();
      return {
        isMenuVisible: false,
        selectedOwnerId: null,
        selectionSessionOwnerId: null,
      };
    }

    return {
      ...prevState,
      isMenuVisible: true,
    };
  });
};
