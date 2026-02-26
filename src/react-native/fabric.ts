import type { ReactNativeFiberNode, ReactNativeShadowNode } from "./types.js";

export type FabricUIManager = {
  findShadowNodeByTag_DEPRECATED: (tag: number) => ReactNativeShadowNode;
  findNodeAtPoint: (
    node: ReactNativeShadowNode,
    locationX: number,
    locationY: number,
    callback: (instanceHandle: ReactNativeFiberNode) => void,
  ) => void;
  getBoundingClientRect: (
    node: ReactNativeShadowNode,
    includeTransform?: boolean,
  ) => [number, number, number, number];
  measureInWindow: (
    node: ReactNativeShadowNode,
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

declare global {
  var nativeFabricUIManager: FabricUIManager;
}

export const getFabricUIManager = (): FabricUIManager => {
  if (typeof nativeFabricUIManager === "undefined") {
    throw new Error("React Native Grab requires New Architecture (Fabric) to be enabled.");
  }

  return nativeFabricUIManager;
};
