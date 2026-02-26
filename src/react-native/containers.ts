import { findNodeHandle, type ReactNativeElement } from "react-native";
import type { ReactNativeShadowNode } from "./types";
import { getFabricUIManager } from "./fabric";

let focusedScreenShadowNode: ReactNativeShadowNode | null = null;
let appRootShadowNode: ReactNativeShadowNode | null = null;

export const setFocusedScreenRef = (ref: ReactNativeElement) => {
  // @ts-expect-error - findNodeHandle is not typed correctly
  const nativeTag = findNodeHandle(ref);

  if (!nativeTag) {
    throw new Error("Failed to find native tag for focused screen");
  }

  focusedScreenShadowNode = getFabricUIManager().findShadowNodeByTag_DEPRECATED(nativeTag);
};

export const setAppRootRef = (ref: ReactNativeElement) => {
  // @ts-expect-error - findNodeHandle is not typed correctly
  const nativeTag = findNodeHandle(ref);

  if (!nativeTag) {
    throw new Error("Failed to find native tag for app root");
  }

  appRootShadowNode = getFabricUIManager().findShadowNodeByTag_DEPRECATED(nativeTag);
};

export const getAppRootShadowNode = (): ReactNativeShadowNode => {
  if (!appRootShadowNode) {
    throw new Error("You seem to forgot to wrap your app root with ReactNativeGrabRoot.");
  }

  return appRootShadowNode;
};
export const getFocusedScreenShadowNode = () => {
  if (!focusedScreenShadowNode) {
    // No native screens, so there will be only the app root.
    return getAppRootShadowNode();
  }

  return focusedScreenShadowNode;
};
